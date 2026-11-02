import { Router } from 'express';
import { managerAuthMiddleware } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import {
  managerLogin,
  getManagerCategories,
  getManagerItems,
  getManagerItemById,
  createManagerItem,
  updateManagerItem,
  deleteManagerItem,
  getManagerOrders,
  updateManagerOrder,
  uploadManagerImage,
} from '../controllers/managerController.js';

const router = Router();

// Manager Login (Key Verification)
router.post('/auth', managerLogin);

// Protected routes below
router.use(managerAuthMiddleware);

// Categories (queried dynamically from distinct item categories)
router.get('/categories', getManagerCategories);

// Item Management
router.get('/items', getManagerItems);
router.get('/items/:id', getManagerItemById);
router.post('/items', createManagerItem);
router.put('/items/:id', updateManagerItem);
router.delete('/items/:id', deleteManagerItem);
router.post('/upload', upload.single('image'), uploadManagerImage);

// Order Management (Status & Notes)
router.get('/orders', getManagerOrders);
router.patch('/orders/:id', updateManagerOrder);

export default router;
