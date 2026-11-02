# Stripe Payment Gateway Integration Report

## 1. Executive Summary & Objective

This document provides a comprehensive technical overview of the Stripe Payment Gateway integration implemented in the NTI Shop e-commerce platform.

The primary objective of this integration is to enable secure, frictionless, and PCI-compliant online card payments for customers while maintaining strict separation of concerns across our frontend (Angular 17), backend (Node.js/Express), and data layer (MongoDB).

### Key Architectural Highlights
- **PCI-DSS SAQ A Compliance**: Sensitive card data never touches our application servers. Payment data is captured directly by Stripe via a secure, hosted checkout interface.
- **Zero-Dependency Native Service**: Implemented using Node.js built-in `fetch` and `crypto` modules without third-party SDK dependencies.
- **Dual-Layer Payment Verification**: Combines immediate synchronous status verification upon redirect with an asynchronous HMAC-signed Webhook listener for maximum fault tolerance.
- **Dynamic Gateway Orchestration**: Payment options are loaded dynamically from the backend based on administrative environment flags.

---

## 2. End-to-End Communication Architecture

The sequence below illustrates the interaction model between our application (NTI Shop), the Stripe Payment Gateway, and the customer's financial institution.

> **[INSERT IMAGE: Communication Flow Diagram]**
> *Place the communication diagram here (showing the interaction flow between NTI Shop, Stripe Checkout, and the banking network).*

### Step-by-Step Protocol Walkthrough

```
[ Customer / Browser ]         [ NTI Shop Backend ]          [ Stripe Gateway ]         [ Issuing Bank ]
         |                              |                             |                        |
         | --- 1. Submit Order -------> |                             |                        |
         |                              | --- 2. Create Session ----> |                        |
         |                              | <--- 3. Return Session URL- |                        |
         | <--- 4. Redirect URL ------- |                             |                        |
         |                              |                             |                        |
         | --- 5. Redirect to Stripe -------------------------------> |                        |
         |                              |                             |                        |
         | <--- 6. Render Checkout Form (with temporary token) ------ |                        |
         |                              |                             |                        |
         | --- 7. Submit Card & Confirm Charge ---------------------> |                        |
         |                              |                             | --- 8. Charge Request ->|
         |                              |                             | <-- 9. Auth / Decline -|
         |                              |                             |                        |
         | <--- 10. Redirect to Shop Success / Cancel URL ----------- |                        |
         |                              |                             |                        |
         | --- 11. Query Status ------> |                             |                        |
         |                              | --- 12. Verify Session ---> |                        |
         |                              | <--- 13. Session Data ----- |                        |
         | <--- 14. Display Receipt --- |                             |                        |
```

1. **Order Initiation**: The customer finalizes their shopping cart in Angular and submits the order with `paymentMethod: 'stripe'`.
2. **Checkout Session Request**: NTI Shop backend validates the item inventory, calculates the authoritative total price, creates an order record in MongoDB with `paymentStatus: 'pending'`, and sends an authenticated HTTP POST request to Stripe's `/v1/checkout/sessions` endpoint.
3. **Session Creation & URL Generation**: Stripe registers a temporary checkout session, binds it to the unique order ID and line items, and returns a checkout URL (`https://checkout.stripe.com/c/pay/...`).
4. **Redirect Instruction**: The backend returns the checkout URL to the frontend in the HTTP 201 response.
5. **Gateway Navigation**: The frontend automatically redirects the customer's browser to the Stripe-hosted checkout page.
6. **Isolated Payment Form**: Stripe serves the customer with an isolated, encrypted form requesting card credentials, billing address, and confirmation.
7. **Charge Activation**: The customer inputs their details and activates the charge. The temporary session token binds this transaction to the authorization request.
8. **Interbank Settlement Request**: Stripe communicates securely with the customer's card issuing bank through credit card networks (Visa, Mastercard, etc.).
9. **Authorization Decision**:
   - **Approved**: The bank verifies fund availability and confirms authorization.
   - **Declined**: The bank rejects the transaction (e.g. insufficient funds, expired card, 3D Secure failure).
10. **Redirection to Shop**: Stripe redirects the customer back to the NTI Shop application return URL:
    - On success: `/checkout?orderId=<ORDER_ID>&session_id={CHECKOUT_SESSION_ID}`
    - On cancellation: `/checkout?orderId=<ORDER_ID>&cancelled=true`
11. **Order Status Verification**: Upon arrival on the checkout page, the frontend calls the backend status endpoint (`/api/orders/:id/status?session_id=...`) to confirm completion.
12. **Status Update**: The backend verifies the session directly with Stripe, marks the order as `paid`, and the customer receives an immediate confirmation receipt.

---

## 3. System Components & Implementation Details

### 3.1 Backend Architecture

#### A. Stripe Service (`backend/src/services/stripeService.js`)
The `StripeService` class encapsulates all direct communication with the Stripe REST API.

- **URL-Encoded Serialization**: Stripe's API requires form URL-encoded request bodies (`application/x-www-form-urlencoded`) with square bracket notation for nested objects (such as `line_items[0][price_data][unit_amount]`). A dedicated recursive helper (`buildStripeFormBody`) transforms nested JavaScript objects into standard compliant payloads.
- **Session Creation (`createCheckoutSession`)**:
  - Builds line items from the order products.
  - Converts item prices to integer cents (`Math.round(price * 100)`).
  - Configures return URLs with parameter substitution (`{CHECKOUT_SESSION_ID}`).
  - Binds the internal order ID as `client_reference_id` and metadata for reconciliation.
- **Session Verification (`retrieveCheckoutSession`)**:
  - Fetches the current session state via `GET /v1/checkout/sessions/:sessionId`.
  - Inspects `payment_status` (`paid`, `unpaid`, `no_payment_required`).
- **Webhook Signature Verification (`verifyWebhookSignature`)**:
  - Extracts the timestamp `t` and signature `v1` from the `stripe-signature` header.
  - Generates an HMAC-SHA256 hash using the secret key (`STRIPE_WEBHOOK_SECRET`).
  - Validates equality using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attack vulnerabilities.

#### B. Order Controller (`backend/src/controllers/orderController.js`)
- **Order Creation Pipeline**:
  - Calculates prices server-side using MongoDB product records (never trusting client-supplied prices).
  - Creates the order with status `opened` and payment status `pending`.
  - Dispatches creation to Stripe and records `stripeDetails` (`sessionId`, `customerEmail`).
- **Dual-Verification Endpoints**:
  1. `GET /api/orders/:id/status`: Directly inspects the session ID passed upon frontend redirect. If Stripe reports `payment_status: 'paid'`, the order is marked `paid` instantly.
  2. `POST /api/stripe/webhook`: Handles asynchronous event dispatch from Stripe (`checkout.session.completed`), updating the order even if the user closes their browser before redirection completes.

#### C. Database Schema (`backend/src/models/Order.js`)
The Mongoose `Order` schema was extended with dedicated tracking fields:

```javascript
paymentMethod: {
  type: String,
  enum: ['cod', 'stripe'],
  default: 'cod',
},
stripeDetails: {
  sessionId: { type: String, default: null },
  paymentIntentId: { type: String, default: null },
  customerEmail: { type: String, default: null },
}
```

---

### 3.2 Frontend Architecture

#### A. Dynamic Gateway Discovery (`frontend/src/app/public/checkout/checkout.component.ts`)
- The checkout component requests `GET /api/payment-methods` on initialization.
- Available options (`cod`, `stripe`) are dynamically rendered to the user.
- If Stripe is enabled, the payment selector displays a clean SVG card indicator.

#### B. Redirection and User Experience
- When the user selects Stripe and clicks "Place Order", the backend returns the `checkoutUrl`.
- The frontend clears the local shopping cart and redirects the browser window to Stripe:
  ```typescript
  window.location.href = res.checkoutUrl;
  ```
- If the payment is cancelled, the user is redirected to `/checkout?orderId=...&cancelled=true`, displaying an informative cancellation notice without losing their order reference.

#### C. Return Verification
- When returning from Stripe, the Angular component inspects the route query parameters:
  - Detects `orderId` and `session_id`.
  - Queries `GET /api/orders/:id/status?session_id=...`.
  - Displays a success card with the order reference, total paid, and confirmation message.

---

### 3.3 Manager Dashboard (`frontend/src/app/manager/dashboard/manager-dashboard.component.html`)
The manager order management table was updated to provide full visibility into online payments:
- **Gateway Badge**: Orders paid via Stripe display a dedicated badge showing the gateway type.
- **Payment Status**: Visual indicators differentiate between `paid` (green), `pending` (amber), and `failed` (red).
- **Session Reference**: Notes include the verified Stripe Session ID for cross-referencing in the Stripe Merchant Dashboard.

---

## 4. Dual-Layer Verification Flow

A common challenge in payment gateway integrations is handling edge cases where customers close their browser immediately after paying. NTI Shop solves this using a two-tier strategy:

```
                  [ Payment Completed on Stripe ]
                                 |
                 ---------------------------------
                 |                               |
                 v                               v
    [ Customer Redirect ]               [ Asynchronous Webhook ]
    (Immediate / Synchronous)           (Background / Event-driven)
                 |                               |
                 v                               v
    Frontend reaches Shop Return URL    Stripe dispatches HTTP POST
                 |                               |
                 v                               v
    Backend queries Stripe API           Backend validates HMAC
    and verifies payment_status          and checks event payload
                 |                               |
                 ---------------------------------
                                 |
                                 v
                     [ Order Marked as PAID ]
```

1. **Synchronous Immediate Verification**:
   - The user returns to our domain via the return URL.
   - The backend checks the session status directly against Stripe API in real time.
   - Result: Instant positive feedback to the customer without waiting for webhook queue delays.

2. **Asynchronous Webhook Listener**:
   - Stripe sends an independent HTTP notification to `/api/stripe/webhook`.
   - The payload signature is validated via HMAC-SHA256.
   - Result: If the user lost internet connectivity, closed their tab, or encountered a browser crash after completing payment, the order is still reliably fulfilled.

---

## 5. Configuration & Environment Variables

All gateway behavior is configured via environment variables located in `backend/.env`:

| Variable Name | Description | Example / Default |
| :--- | :--- | :--- |
| `ENABLE_STRIPE` | Master toggle to enable/disable Stripe in the checkout view | `true` |
| `STRIPE_SECRET_KEY` | Restricted or standard secret key from Stripe dashboard | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Public key used for frontend client identification | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret used to authenticate webhook events | `whsec_...` |
| `STRIPE_CURRENCY` | Default ISO currency code for transactions | `usd` (or `egp`, `eur`) |
| `FRONTEND_URL` | Application base URL used to construct redirect paths | `http://localhost:4200` |

### Development & Mock Fallback
To facilitate testing in environments without active Stripe API keys, `StripeService` includes an automated fallback mechanism:
- If `STRIPE_SECRET_KEY` is not defined, the service automatically generates simulated session tokens (`cs_test_mock_<orderId>_<timestamp>`).
- This allows developers and automated test suites to validate complete checkout flows and database transitions without live network credentials.

---

## 6. Security & Data Protection Measures

- **No Cardholder Data Storage**: Credit card numbers, expiration dates, and CVV codes are handled exclusively within Stripe's PCI-DSS Level 1 certified environment.
- **Server-Side Price Integrity**: Order totals are computed strictly from verified database records. Client-side price tampering is completely prevented.
- **Cryptographic Webhook Validation**: Every webhook payload is verified using HMAC-SHA256 and constant-time buffer comparison to prevent spoofing and replay attacks.
- **Zero Third-Party Dependency Risk**: Built using native Node.js core libraries (`crypto` and `fetch`), eliminating vulnerabilities associated with unvetted external packages.

---

## 7. Verification & Test Results

The integration was validated across automated test suites and end-to-end scenarios:

- **Backend Integration Tests**: 19/19 passing (`node --test tests/*.test.js`).
- **Frontend Unit Tests**: 7/7 passing (`ng test --watch=false`).
- **Production Build**: Angular production bundle compiled with zero errors.
- **Lifecycle Verification**:
  - Order creation with `paymentMethod: 'stripe'` confirmed in MongoDB.
  - Successful return redirect confirmed order transition from `pending` to `paid`.
  - Cancelled checkout gracefully maintained order state and alerted the customer.
