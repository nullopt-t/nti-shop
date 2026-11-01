import { Router } from 'express';
import { getPublicCategories } from '../controllers/categoryController.js';
import { getPublicItems, getPublicItemById } from '../controllers/itemController.js';
import {
  createPublicOrder,
  getPublicPaymentMethods,
  handlePaymobWebhook,
  handleStripeWebhook,
  getPublicOrderStatus,
} from '../controllers/orderController.js';

const router = Router();

// Payment Methods & Options
router.get('/payment-methods', getPublicPaymentMethods);

// Categories
router.get('/categories', getPublicCategories);

// Items
router.get('/items', getPublicItems);
router.get('/items/:id', getPublicItemById);

// Orders & Payment Gateways
router.post('/orders', createPublicOrder);
router.get('/orders/:id/status', getPublicOrderStatus);
router.post('/paymob/webhook', handlePaymobWebhook);
router.post('/stripe/webhook', handleStripeWebhook);

export default router;
