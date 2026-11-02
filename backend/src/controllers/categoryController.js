import { Item } from '../models/Item.js';
import { extractRequestLanguage } from './itemController.js';

export async function getPublicCategories(req, res, next) {
  try {
    const lang = extractRequestLanguage(req);
    const items = await Item.find({}, { category: 1, translations: 1 }).lean();

    const categorySet = new Set();
    for (const item of items) {
      if (lang !== 'en' && item.translations && item.translations[lang]?.category) {
        categorySet.add(item.translations[lang].category);
      } else if (item.category) {
        categorySet.add(item.category);
      }
    }

    const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}
