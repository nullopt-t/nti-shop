import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    // Multilingual translations map: { ar: { name, description, category }, fr: { ... } }
    translations: {
      type: Map,
      of: new mongoose.Schema(
        {
          name: { type: String, trim: true },
          description: { type: String, trim: true },
          category: { type: String, trim: true },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Helper to localize an Item instance or plain object based on the requested language code.
 * Falls back to default English values if translation or specific field is missing.
 */
itemSchema.methods.toLocalized = function (lang = 'en') {
  const obj = this.toObject ? this.toObject() : { ...this };
  return localizeItemObject(obj, lang);
};

export function localizeItemObject(itemObj, lang = 'en') {
  if (!itemObj) return itemObj;
  const normalizedLang = (lang || 'en').toLowerCase().trim();

  if (normalizedLang === 'en' || !itemObj.translations) {
    return itemObj;
  }

  // Handle both Map (Mongoose Document) and plain object (from lean/JSON)
  let translation = null;
  if (itemObj.translations instanceof Map) {
    translation = itemObj.translations.get(normalizedLang);
  } else if (typeof itemObj.translations === 'object') {
    translation = itemObj.translations[normalizedLang];
  }

  if (translation) {
    return {
      ...itemObj,
      name: translation.name || itemObj.name,
      description: translation.description || itemObj.description,
      category: translation.category || itemObj.category,
    };
  }

  return itemObj;
}

export const Item = mongoose.model('Item', itemSchema);

