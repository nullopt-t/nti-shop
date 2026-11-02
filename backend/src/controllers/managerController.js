import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Item } from '../models/Item.js';
import { Order } from '../models/Order.js';

// --- AUTHENTICATION ---
export async function managerLogin(req, res) {
  const { accessKey } = req.body;
  const configuredKey = process.env.MANAGER_ACCESS_KEY || 'manager123';
  const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey_sprint01_2026';

  if (!accessKey || accessKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid manager access key',
    });
  }

  const token = jwt.sign(
    { role: 'manager', authenticatedAt: Date.now() },
    jwtSecret,
    { expiresIn: '24h' }
  );

  return res.status(200).json({
    success: true,
    message: 'Manager authenticated successfully',
    token,
  });
}

// --- CATEGORIES (EXTRACTED FROM ITEMS) ---
export async function getManagerCategories(req, res, next) {
  try {
    const rawCategories = await Item.distinct('category');
    const categories = rawCategories.filter(Boolean).sort((a, b) => a.localeCompare(b));
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
}

// --- ITEM CRUD ---
export async function getManagerItems(req, res, next) {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
}

export async function getManagerItemById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function createManagerItem(req, res, next) {
  try {
    const { category, name, description, price, image, translations } = req.body;

    if (!category || !name || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Item fields (category, name, description, price) are required',
      });
    }

    const newItem = await Item.create({
      category: category.trim(),
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      image: image ? image.trim() : '',
      translations: translations || {},
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    next(error);
  }
}

export async function updateManagerItem(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const { category, name, description, price, image, translations } = req.body;

    if (category) item.category = category.trim();
    if (name) item.name = name.trim();
    if (description) item.description = description.trim();
    if (price !== undefined) item.price = Number(price);
    if (image !== undefined) item.image = image ? image.trim() : '';
    if (translations !== undefined) {
      item.translations = translations;
    }

    await item.save();
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteManagerItem(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid item ID' });
    }

    const deleted = await Item.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
}

// --- ORDER MANAGEMENT ---
export async function getManagerOrders(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['opened', 'closed'].includes(status)) {
      filter.status = status;
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
}

export async function updateManagerOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) {
      if (!['opened', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either "opened" or "closed"',
        });
      }
      order.status = status;
    }

    if (notes !== undefined) {
      if (typeof notes === 'string') {
        const trimmed = notes.trim();
        if (trimmed) {
          order.notes = order.notes || [];
          order.notes.push({
            time: new Date(),
            content: trimmed,
          });
        }
      } else if (Array.isArray(notes)) {
        order.notes = notes.map((n) => {
          if (typeof n === 'string') {
            return { time: new Date(), content: n.trim() };
          }
          return {
            time: n.time ? new Date(n.time) : new Date(),
            content: (n.content || '').trim(),
          };
        }).filter((n) => n.content.length > 0);
      }
    }

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
}

// --- IMAGE UPLOAD ---
export async function uploadManagerImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
      data: { imageUrl, filename: req.file.filename },
    });
  } catch (error) {
    next(error);
  }
}
