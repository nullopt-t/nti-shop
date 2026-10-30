import { Item } from '../models/Item.js';

export async function getPublicCategories(req, res, next) {
  try {
    const rawCategories = await Item.distinct('category');
    const categories = rawCategories.filter(Boolean).sort((a, b) => a.localeCompare(b));
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}
