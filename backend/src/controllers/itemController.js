import mongoose from 'mongoose';
import { Item } from '../models/Item.js';

export async function getPublicItems(req, res, next) {
  try {
    const { category } = req.query;
    const filter = {};

    if (category && category.trim()) {
      filter.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicItemById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
}
