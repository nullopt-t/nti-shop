import { Router } from 'express';
import { getPublicCategories } from '../controllers/categoryController.js';
import { getPublicItems, getPublicItemById } from '../controllers/itemController.js';
import { createPublicOrder, handlePaymobWebhook, getPublicOrderStatus } from '../controllers/orderController.js';

const router = Router();

// Categories
router.get('/categories', getPublicCategories);

// Items
router.get('/items', getPublicItems);
router.get('/items/:id', getPublicItemById);

// Orders & Paymob Integration
router.post('/orders', createPublicOrder);
router.get('/orders/:id/status', getPublicOrderStatus);
router.post('/paymob/webhook', handlePaymobWebhook);

export default router;
