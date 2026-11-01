import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';

/**
 * Service for interacting with Paymob's latest Payment Intention API (v1/intention).
 * Uses standard Node.js fetch and crypto with zero external dependencies.
 */
export class PaymobService {
  get baseUrl() {
    return (process.env.PAYMOB_BASE_URL || 'https://accept.paymob.com')
      .replace(/\/api\/?$/, '')
      .replace(/\/+$/, '');
  }

  get secretKey() {
    return (process.env.PAYMOB_SECRET_KEY || '').trim();
  }

  get publicKey() {
    return (process.env.PAYMOB_PUBLIC_KEY || '').trim();
  }

  get integrationId() {
    return process.env.PAYMOB_INTEGRATION_ID ? parseInt(process.env.PAYMOB_INTEGRATION_ID, 10) : null;
  }

  get hmacSecret() {
    return (process.env.PAYMOB_HMAC_SECRET || '').trim();
  }

  get currency() {
    return (process.env.PAYMOB_CURRENCY || 'EGP').trim();
  }

  /**
   * Check if Paymob live credentials are configured.
   */
  isConfigured() {
    return Boolean(this.secretKey && this.publicKey);
  }

  /**
   * Create Payment Intention using latest v1/intention API endpoint.
   * Converts total amount to minor currency unit (e.g. cents/piastres).
   */
  async createIntention({ orderId, amount, items = [], customer = {}, redirectionUrl, notificationUrl }) {
    // Amount in minor currency units (e.g. 100.00 EGP = 10000)
    const amountCents = Math.round(amount * 100);

    const paymentMethods = [];
    if (this.integrationId) {
      paymentMethods.push(this.integrationId);
    }

    const [firstName = 'Guest', ...restName] = (customer.name || 'Guest Client').trim().split(' ');
    const lastName = restName.join(' ') || 'Customer';

    const payload = {
      amount: amountCents,
      currency: this.currency,
      payment_methods: paymentMethods,
      items: items.map((i) => ({
        name: i.name,
        amount: Math.round(i.price * 100),
        description: i.name,
        quantity: i.quantity,
      })),
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: customer.phone || '+201000000000',
        email: customer.email || 'customer@rock.shop',
        country: 'EG',
        city: 'Cairo',
        street: customer.address || 'Online Checkout',
        building: 'NA',
        floor: 'NA',
        apartment: 'NA',
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: customer.email || 'customer@rock.shop',
      },
      extras: {
        merchant_order_id: String(orderId),
      },
      special_reference: String(orderId),
    };

    if (redirectionUrl) {
      payload.redirection_url = redirectionUrl;
    }
    if (notificationUrl) {
      payload.notification_url = notificationUrl;
    }

    // If API credentials are not set (e.g. mock/test environments), return mock intention
    if (!this.isConfigured()) {
      const mockSecret = `mock_csk_${orderId}_${Date.now()}`;
      return {
        id: `mock_intent_${orderId}`,
        client_secret: mockSecret,
        checkout_url: `${this.baseUrl}/unifiedcheckout/?publicKey=pk_mock_test&clientSecret=${mockSecret}`,
      };
    }

    const response = await fetch(`${this.baseUrl}/v1/intention/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${this.secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paymob Intention creation failed [${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      client_secret: data.client_secret,
      paymob_order_id: data.intention_order_id || (data.order && data.order.id),
      checkout_url: `${this.baseUrl}/unifiedcheckout/?publicKey=${this.publicKey}&clientSecret=${data.client_secret}`,
    };
  }

  /**
   * Verify HMAC-SHA512 signature on incoming Paymob Webhook.
   * Concatenates the 20 required transaction fields in exact Paymob canonical order.
   */
  verifyWebhookHmac(queryHmac, transactionObj) {
    if (!this.hmacSecret || !queryHmac || !transactionObj) {
      return false;
    }

    const sourceData = transactionObj.source_data || {};
    const order = transactionObj.order || {};

    const fields = [
      transactionObj.amount_cents,
      transactionObj.created_at,
      transactionObj.currency,
      transactionObj.error_occured,
      transactionObj.has_parent_transaction,
      transactionObj.id,
      transactionObj.integration_id,
      transactionObj.is_3d_secure,
      transactionObj.is_auth,
      transactionObj.is_capture,
      transactionObj.is_refunded,
      transactionObj.is_standalone_payment,
      transactionObj.is_voided,
      order.id,
      transactionObj.owner,
      transactionObj.pending,
      sourceData.pan,
      sourceData.sub_type,
      sourceData.type,
      transactionObj.success,
    ];

    const concatenatedString = fields
      .map((val) => (val !== undefined && val !== null ? String(val) : ''))
      .join('');

    const calculatedHmac = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(concatenatedString)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(calculatedHmac, 'hex'),
        Buffer.from(queryHmac, 'hex')
      );
    } catch {
      return false;
    }
  }
}

export const paymobService = new PaymobService();
