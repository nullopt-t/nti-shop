import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Item } from '../models/Item.js';
import { Order } from '../models/Order.js';

const sampleItems = [
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000001'),
    category: 'Hoodies',
    name: 'ROCK Heavyweight Fleece Hoodie — Pitch Black',
    description: 'Custom 480 GSM combed cotton fleece. Drop shoulder tailoring, double-lined seamless hood, and dense ribbed hems.',
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000002'),
    category: 'Hoodies',
    name: 'ROCK Washed Vintage Hoodie — Slate Grey',
    description: 'Sun-faded garment wash with brushed interior fleece. Relaxed drape with kangaroo pouch.',
    price: 115.00,
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000003'),
    category: 'T-Shirts',
    name: 'ROCK Oversized Boxy Tee — Clean White',
    description: '300 GSM luxury organic ring-spun cotton. High-density crewneck collar with wide silhouette.',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000004'),
    category: 'T-Shirts',
    name: 'ROCK Minimalist Graphic Tee — Charcoal',
    description: 'Tonal matte screenprint across heavyweight jersey cotton. Pre-shrunk for durable drape.',
    price: 60.00,
    image: '',
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000005'),
    category: 'Denim',
    name: 'ROCK 14oz Japanese Selvedge Denim — Raw Indigo',
    description: 'Rigid shuttle-loomed Japanese denim with red selvedge ID line. Clean straight-leg silhouette with custom matte black hardware.',
    price: 185.00,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000006'),
    category: 'Outerwear',
    name: 'ROCK Matte Tactical Overshirt — Pitch Black',
    description: 'Water-repellent technical ripstop with concealed snap closures, dual chest utility bellows, and ventilated back yoke.',
    price: 195.00,
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
  },
  {
    _id: new mongoose.Types.ObjectId('660000000000000000000007'),
    category: 'Accessories',
    name: 'ROCK Heavy Ribbed Wool Beanie — Obsidian',
    description: '100% fine merino wool spun into tight thermal ribbing. Foldover brim with subtle tonal branding.',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80',
  },
];

async function seed() {
  await connectDB();
  console.log('[Seed] Refreshing collections...');
  await Item.deleteMany({});
  await Order.deleteMany({});

  console.log('[Seed] Seeding ROCK catalog items (category stored as column)...');
  const createdItems = await Item.insertMany(sampleItems);

  console.log('[Seed] Seeding sample client order...');
  const sampleOrder = {
    userDetails: {
      name: 'David Miller',
      phone: '+1 (555) 349-2810',
      address: '84 King Street, Suite 4B, New York, NY',
    },
    items: [
      {
        itemId: createdItems[0]._id,
        name: createdItems[0].name,
        price: createdItems[0].price,
        quantity: 1,
        subtotal: createdItems[0].price,
      },
      {
        itemId: createdItems[2]._id,
        name: createdItems[2].name,
        price: createdItems[2].price,
        quantity: 2,
        subtotal: createdItems[2].price * 2,
      },
    ],
    totalPrice: createdItems[0].price + createdItems[2].price * 2,
    status: 'opened',
    notes: 'Client confirmed size Large by telephone. Scheduled for express delivery handover.',
  };
  await Order.create(sampleOrder);

  const categories = await Item.distinct('category');
  console.log(`[Seed] Seeded ${createdItems.length} items across ${categories.length} distinct categories: [${categories.join(', ')}]`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
