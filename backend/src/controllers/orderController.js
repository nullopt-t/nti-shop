import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Item } from '../models/Item.js';
import { stripeService } from '../services/stripeService.js';

/**
 * Determine enabled payment methods based on environment variables and credentials.
 */
export function getEnabledPaymentMethodsList() {
  const methods = ['cod'];

  const stripeExplicit = process.env.ENABLE_STRIPE;
  const stripeConfigured = stripeService.isConfigured();
  if (
    stripeExplicit === 'true' ||
    (stripeExplicit !== 'false' && stripeConfigured) ||
    (process.env.NODE_ENV === 'test' && stripeExplicit !== 'false')
  ) {
    methods.push('stripe');
  }

  return methods;
}

/**
 * Public endpoint to list currently enabled payment methods.
 */
export async function getPublicPaymentMethods(req, res) {
  return res.status(200).json({
    success: true,
    data: getEnabledPaymentMethodsList(),
  });
}

export async function createPublicOrder(req, res, next) {
  try {
    const { userDetails = {}, items, paymentMethod = 'cod' } = req.body;
    const allowedMethods = getEnabledPaymentMethodsList();

    // Validate payment method
    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or disabled payment method: ${paymentMethod}. Allowed: ${allowedMethods.join(', ')}`,
      });
    }

    // Validation rules based on payment mode:
    // Cash on Delivery requires full contact details to call and verify dispatch
    if (paymentMethod === 'cod') {
      if (!userDetails.name?.trim() || !userDetails.phone?.trim() || !userDetails.address?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Customer name, phone, and delivery address are all required for Cash on Delivery',
        });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items must be a non-empty array',
      });
    }

    // Build snapshot array with database-verified names and prices
    const itemSnapshots = [];
    let totalPrice = 0;

    for (const itemEntry of items) {
      const { itemId, quantity } = itemEntry;

      if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid item ID: ${itemId}`,
        });
      }

      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be a positive integer',
        });
      }

      const dbItem = await Item.findById(itemId);
      if (!dbItem) {
        return res.status(404).json({
          success: false,
          message: `Item not found with ID: ${itemId}`,
        });
      }

      const subtotal = Math.round(dbItem.price * qty * 100) / 100;
      totalPrice = Math.round((totalPrice + subtotal) * 100) / 100;

      itemSnapshots.push({
        itemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        subtotal,
      });
    }

    // Standardize userDetails with fallback for gateway inquiry
    const normalizedUserDetails = {
      name: (userDetails.name || 'Guest Client').trim(),
      phone: (userDetails.phone || 'N/A').trim(),
      address: (userDetails.address || 'N/A').trim(),
      email: (userDetails.email || '').trim(),
    };

    const newOrder = await Order.create({
      userDetails: normalizedUserDetails,
      items: itemSnapshots,
      totalPrice,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'opened',
      notes: [],
    });

    // 1. Cash on Delivery
    if (paymentMethod === 'cod') {
      return res.status(201).json({
        success: true,
        message: 'Order submitted successfully. Our team will contact you via phone to confirm your delivery.',
        data: newOrder,
      });
    }

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/+$/, '');

    // 2. Stripe Payment Gateway
    if (paymentMethod === 'stripe') {
      const successUrl = `${frontendUrl}/checkout?orderId=${newOrder._id}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${frontendUrl}/checkout?orderId=${newOrder._id}&cancelled=true`;

      try {
        const session = await stripeService.createCheckoutSession({
          orderId: newOrder._id,
          amount: totalPrice,
          items: itemSnapshots,
          customer: normalizedUserDetails,
          successUrl,
          cancelUrl,
        });

        newOrder.stripeDetails = {
          sessionId: session.id,
          paymentIntentId: session.payment_intent ? String(session.payment_intent) : null,
          customerEmail: normalizedUserDetails.email || null,
        };
        await newOrder.save();

        return res.status(201).json({
          success: true,
          message: 'Stripe checkout session initialized.',
          data: newOrder,
          checkoutUrl: session.url,
        });
      } catch (err) {
        newOrder.paymentStatus = 'failed';
        newOrder.notes.push({
          time: new Date(),
          content: `Stripe initialization error: ${err.message}`,
        });
        await newOrder.save();

        return res.status(502).json({
          success: false,
          message: `Stripe gateway error: ${err.message}`,
          data: newOrder,
        });
      }
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Stripe Webhooks
 */
export async function handleStripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature if secret is configured
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      const isValid = stripeService.verifyWebhookSignature(req.rawBody, signature);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid Stripe signature' });
      }
    }

    const event = req.body || {};
    const eventType = event.type || '';
    const sessionObj = event.data?.object || event;

    console.log(`[Stripe Webhook] Received event: ${eventType || 'unknown'}`);

    if (eventType === 'checkout.session.completed' || sessionObj.object === 'checkout.session') {
      const orderId = sessionObj.client_reference_id || sessionObj.metadata?.orderId;
      console.log(`[Stripe Webhook] Processing checkout.session.completed for Order #${orderId}`);
      if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paymentStatus = 'paid';
          order.stripeDetails = order.stripeDetails || {};
          order.stripeDetails.sessionId = sessionObj.id || order.stripeDetails.sessionId;
          order.stripeDetails.paymentIntentId = sessionObj.payment_intent ? String(sessionObj.payment_intent) : order.stripeDetails.paymentIntentId;
          order.notes = order.notes || [];
          order.notes.push({
            time: new Date(),
            content: `Paid via Stripe session #${sessionObj.id}`,
          });
          await order.save();
          console.log(`[Stripe Webhook] Order #${orderId} marked as PAID`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Public Order Payment Status Inquiry
 * Supports direct session retrieval to verify Stripe checkout without needing a webhook tunnel.
 */
export async function getPublicOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { session_id } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Direct Stripe Session Verification (No tunnel required)
    if (order.paymentMethod === 'stripe' && order.paymentStatus !== 'paid' && session_id) {
      try {
        const session = await stripeService.retrieveCheckoutSession(session_id);
        if (session.payment_status === 'paid' || session.status === 'complete') {
          order.paymentStatus = 'paid';
          order.stripeDetails = order.stripeDetails || {};
          order.stripeDetails.sessionId = session.id;
          if (session.payment_intent) {
            order.stripeDetails.paymentIntentId = String(session.payment_intent);
          }
          if (session.customer_details?.email) {
            order.stripeDetails.customerEmail = session.customer_details.email;
          }
          order.notes = order.notes || [];
          order.notes.push({
            time: new Date(),
            content: `Paid via verified Stripe session #${session.id}`,
          });
          await order.save();
          console.log(`[Stripe Direct Verification] Order #${order._id} verified as PAID via Stripe session #${session.id}`);
        }
      } catch (err) {
        console.warn(`[Stripe Direct Verification] Failed: ${err.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: order._id,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        totalPrice: order.totalPrice,
        userDetails: order.userDetails,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
