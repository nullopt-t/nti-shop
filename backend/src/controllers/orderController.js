import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Item } from '../models/Item.js';
import { paymobService } from '../services/paymobService.js';

export async function createPublicOrder(req, res, next) {
  try {
    const { userDetails = {}, items, paymentMethod = 'cod' } = req.body;

    // Validate payment method
    if (!['cod', 'paymob'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method. Allowed: cod, paymob',
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

    // Standardize userDetails with fallback for paymob inquiry
    const normalizedUserDetails = {
      name: (userDetails.name || 'Guest Client').trim(),
      phone: (userDetails.phone || 'N/A').trim(),
      address: (userDetails.address || 'N/A').trim(),
    };

    const newOrder = await Order.create({
      userDetails: normalizedUserDetails,
      items: itemSnapshots,
      totalPrice,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'opened',
      notes: '',
    });

    // If Cash on Delivery, respond immediately
    if (paymentMethod === 'cod') {
      return res.status(201).json({
        success: true,
        message: 'Order submitted successfully. Our team will contact you via phone to confirm your delivery.',
        data: newOrder,
      });
    }

    // If Paymob Online Payment Gateway
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/+$/, '');
    const redirectionUrl = `${frontendUrl}/checkout?orderId=${newOrder._id}`;

    try {
      const intention = await paymobService.createIntention({
        orderId: newOrder._id,
        amount: totalPrice,
        items: itemSnapshots,
        customer: normalizedUserDetails,
        redirectionUrl,
      });

      newOrder.paymobDetails = {
        intentionId: intention.id,
        clientSecret: intention.client_secret,
        paymobOrderId: intention.paymob_order_id ? String(intention.paymob_order_id) : null,
      };
      await newOrder.save();

      return res.status(201).json({
        success: true,
        message: 'Paymob payment intention initialized.',
        data: newOrder,
        checkoutUrl: intention.checkout_url,
      });
    } catch (err) {
      newOrder.paymentStatus = 'failed';
      newOrder.notes = `Payment initialization error: ${err.message}`;
      await newOrder.save();

      return res.status(502).json({
        success: false,
        message: `Payment gateway error: ${err.message}`,
        data: newOrder,
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Paymob Webhook transaction processed callbacks
 * Verifies HMAC signature, extracts order reference, and updates paymentStatus.
 */
export async function handlePaymobWebhook(req, res, next) {
  try {
    const { hmac } = req.query;
    const transactionObj = req.body?.obj;

    if (!transactionObj) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload structure' });
    }

    // Verify HMAC if HMAC secret is configured
    if (process.env.PAYMOB_HMAC_SECRET) {
      const isValid = paymobService.verifyWebhookHmac(hmac, transactionObj);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid Paymob HMAC signature' });
      }
    }

    const merchantOrderId =
      transactionObj.order?.merchant_order_id ||
      transactionObj.special_reference ||
      transactionObj.order?.extras?.merchant_order_id;

    if (!merchantOrderId || !mongoose.Types.ObjectId.isValid(merchantOrderId)) {
      // Return 200 to acknowledge receipt even if unrecognized to prevent endless retries
      return res.status(200).json({ success: true, message: 'No matching internal order ID found' });
    }

    const order = await Order.findById(merchantOrderId);
    if (!order) {
      return res.status(200).json({ success: true, message: 'Order not found' });
    }

    const isSuccess = Boolean(transactionObj.success);
    order.paymentStatus = isSuccess ? 'paid' : 'failed';
    order.paymobDetails.transactionId = String(transactionObj.id);

    if (isSuccess) {
      order.notes = [order.notes, `Paid via Paymob transaction #${transactionObj.id}`].filter(Boolean).join(' | ');
    } else {
      order.notes = [order.notes, `Paymob payment failed #${transactionObj.id}`].filter(Boolean).join(' | ');
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order payment status updated successfully',
      data: { orderId: order._id, paymentStatus: order.paymentStatus },
    });
  } catch (error) {
    next(error);
  }
}

