import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Item } from '../models/Item.js';

export async function createPublicOrder(req, res, next) {
  try {
    const { userDetails, items } = req.body;

    if (!userDetails || !userDetails.name || !userDetails.phone || !userDetails.address) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, and delivery address are all required',
      });
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

    const newOrder = await Order.create({
      userDetails: {
        name: userDetails.name.trim(),
        phone: userDetails.phone.trim(),
        address: userDetails.address.trim(),
      },
      items: itemSnapshots,
      totalPrice,
      status: 'opened',
      notes: '',
    });

    res.status(201).json({
      success: true,
      message: 'Order submitted successfully. Our team will contact you via phone to confirm your delivery.',
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
}
