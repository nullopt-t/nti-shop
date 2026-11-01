import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';

/**
 * Encodes nested JavaScript objects into Stripe's required x-www-form-urlencoded format.
 */
function buildStripeFormBody(params, prefix = '') {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      parts.push(buildStripeFormBody(value, fullKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object') {
          parts.push(buildStripeFormBody(item, `${fullKey}[${index}]`));
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${index}]`)}=${encodeURIComponent(item)}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.filter(Boolean).join('&');
}

/**
 * Service for interacting with Stripe Checkout API and Webhooks.
 * Implemented using native Node.js fetch and crypto with zero external dependencies.
 */
export class StripeService {
  get baseUrl() {
    return (process.env.STRIPE_BASE_URL || 'https://api.stripe.com/v1').replace(/\/+$/, '');
  }

  get secretKey() {
    return (process.env.STRIPE_SECRET_KEY || '').trim();
  }

  get publishableKey() {
    return (process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
  }

  get webhookSecret() {
    return (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  }

  get currency() {
    return (process.env.STRIPE_CURRENCY || 'usd').toLowerCase().trim();
  }

  /**
   * Check if Stripe credentials are configured.
   */
  isConfigured() {
    return Boolean(this.secretKey);
  }

  /**
   * Create a Stripe Checkout Session for the specified order.
   */
  async createCheckoutSession({ orderId, amount, items = [], customer = {}, successUrl, cancelUrl }) {
    // If Stripe credentials are not set, return mock session for development/testing
    if (!this.isConfigured()) {
      const mockSessionId = `cs_test_mock_${orderId}_${Date.now()}`;
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/+$/, '');
      const redirectSuccessUrl = (successUrl || `${frontendUrl}/checkout?orderId=${orderId}&session_id=${mockSessionId}`)
        .replace('{CHECKOUT_SESSION_ID}', mockSessionId);
      return {
        id: mockSessionId,
        url: redirectSuccessUrl,
        payment_status: 'unpaid',
      };
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: this.currency,
        unit_amount: Math.round(item.price * 100),
        product_data: {
          name: item.name,
        },
      },
      quantity: item.quantity,
    }));

    const sessionPayload = {
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: String(orderId),
      metadata: {
        orderId: String(orderId),
      },
      line_items: lineItems,
    };

    if (customer.email && customer.email.includes('@')) {
      sessionPayload.customer_email = customer.email;
    }

    const formBody = buildStripeFormBody(sessionPayload);

    const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe Checkout Session creation failed [${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      url: data.url,
      payment_status: data.payment_status,
      payment_intent: data.payment_intent,
    };
  }

  /**
   * Retrieve Checkout Session from Stripe to verify payment without requiring webhooks.
   */
  async retrieveCheckoutSession(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required to retrieve Checkout Session');
    }

    // Handle mock sessions
    if (!this.isConfigured() || sessionId.startsWith('cs_test_mock_')) {
      return {
        id: sessionId,
        payment_status: 'paid',
        status: 'complete',
        payment_intent: `pi_mock_${Date.now()}`,
        customer_details: { email: 'client@example.com' },
      };
    }

    const response = await fetch(`${this.baseUrl}/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe Checkout Session retrieval failed [${response.status}]: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Verify Stripe Webhook signature using HMAC-SHA256.
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!this.webhookSecret || !signatureHeader || !rawBody) {
      return false;
    }

    const items = signatureHeader.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (key && value) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(value.trim());
      }
      return acc;
    }, {});

    const timestamp = items.t?.[0];
    const signatures = items.v1 || [];

    if (!timestamp || signatures.length === 0) {
      return false;
    }

    const payloadString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const signedPayload = `${timestamp}.${payloadString}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    return signatures.some((sig) => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(sig, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        );
      } catch {
        return false;
      }
    });
  }
}

export const stripeService = new StripeService();
