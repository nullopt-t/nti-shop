import { Router } from 'express';
import { getPublicCategories } from '../controllers/categoryController.js';
import { getPublicItems, getPublicItemById } from '../controllers/itemController.js';
import { createPublicOrder } from '../controllers/orderController.js';

const router = Router();

// Categories
router.get('/categories', getPublicCategories);

// Items
router.get('/items', getPublicItems);
router.get('/items/:id', getPublicItemById);

// Orders
router.post('/orders', createPublicOrder);

export default router;
