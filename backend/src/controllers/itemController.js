import mongoose from 'mongoose';
import { Item, localizeItemObject } from '../models/Item.js';

export function extractRequestLanguage(req) {
  // 1. Explicit query parameter ?lang=ar
  if (req.query?.lang && typeof req.query.lang === 'string') {
    return req.query.lang.toLowerCase().trim();
  }
  // 2. Custom header X-Language: ar
  if (req.headers?.['x-language']) {
    return String(req.headers['x-language']).toLowerCase().trim();
  }
  // 3. Standard Accept-Language: ar, en-US...
  const acceptLang = req.headers?.['accept-language'];
  if (acceptLang && typeof acceptLang === 'string') {
    const primary = acceptLang.split(',')[0].split(';')[0].split('-')[0].trim().toLowerCase();
    if (primary) return primary;
  }
  return 'en';
}

export async function getPublicItems(req, res, next) {
  try {
    const { category } = req.query;
    const lang = extractRequestLanguage(req);
    const filter = {};

    if (category && category.trim()) {
      const catTrim = category.trim();
      // Match English category OR translated category
      filter.$or = [
        { category: new RegExp(`^${catTrim}$`, 'i') },
        { [`translations.${lang}.category`]: new RegExp(`^${catTrim}$`, 'i') },
      ];
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const localizedItems = items.map((it) => localizeItemObject(it, lang));

    res.status(200).json({
      success: true,
      count: localizedItems.length,
      data: localizedItems,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicItemById(req, res, next) {
  try {
    const { id } = req.params;
    const lang = extractRequestLanguage(req);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format',
      });
    }

    const item = await Item.findById(id).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const localized = localizeItemObject(item, lang);

    res.status(200).json({
      success: true,
      data: localized,
    });
  } catch (error) {
    next(error);
  }
};
