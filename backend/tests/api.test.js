import { test, before, after, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Item } from '../src/models/Item.js';
import { Order } from '../src/models/Order.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nti_clothing_shop_test';
let managerToken = '';
let testItem = null;

before(async () => {
  await mongoose.connect(MONGODB_URI);
  await Item.deleteMany({});
  await Order.deleteMany({});

  testItem = await Item.create({
    category: 'Outerwear',
    name: 'Test Sherpa Fleece',
    description: 'High-density sherpa fleece jacket',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1544441893-675973e31985',
  });
});

after(async () => {
  await Item.deleteMany({});
  await Order.deleteMany({});
  await mongoose.disconnect();
});

describe('Public Storefront Endpoints', () => {
  test('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  test('GET /api/categories should return distinct categories derived from items', async () => {
    const res = await request(app).get('/api/categories');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.includes('Outerwear'));
  });

  test('GET /api/items?category=Outerwear filters items by category string', async () => {
    const res = await request(app).get('/api/items?category=Outerwear');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    assert.strictEqual(res.body.data[0].category, 'Outerwear');
  });

  test('GET /api/items returns public catalog list without stock level', async () => {
    const res = await request(app).get('/api/items');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length >= 1);

    for (const item of res.body.data) {
      assert.strictEqual(item.quantity, undefined);
      assert.ok(item.name);
      assert.ok(item.category);
    }
  });

  test('GET /api/items/:id returns item detail without stock level', async () => {
    const res = await request(app).get(`/api/items/${testItem._id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.name, 'Test Sherpa Fleece');
    assert.strictEqual(res.body.data.quantity, undefined);
  });

  test('POST /api/orders creates order with opened status and valid totals', async () => {
    const payload = {
      userDetails: {
        name: 'Alice Customer',
        phone: '+1 555-987-6543',
        address: '456 Test Avenue, Springfield',
      },
      items: [
        {
          itemId: testItem._id.toString(),
          quantity: 2,
        },
      ],
    };

    const res = await request(app).post('/api/orders').send(payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.paymentMethod, 'cod');
    assert.strictEqual(res.body.data.paymentStatus, 'pending');
    assert.strictEqual(res.body.data.status, 'opened');
    assert.strictEqual(res.body.data.totalPrice, 79.99 * 2);
    assert.strictEqual(res.body.data.items[0].subtotal, 79.99 * 2);
  });

  test('POST /api/orders with paymentMethod=paymob initializes intention with fallback contact', async () => {
    const payload = {
      paymentMethod: 'paymob',
      userDetails: {
        name: 'Bob Online',
        phone: '+20 100 123 4567',
        // Address omitted to verify fallback
      },
      items: [
        {
          itemId: testItem._id.toString(),
          quantity: 1,
        },
      ],
    };

    const res = await request(app).post('/api/orders').send(payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.paymentMethod, 'paymob');
    assert.strictEqual(res.body.data.paymentStatus, 'pending');
    assert.ok(res.body.checkoutUrl);
    assert.ok(res.body.checkoutUrl.includes('unifiedcheckout'));
    assert.strictEqual(res.body.data.userDetails.name, 'Bob Online');
    assert.strictEqual(res.body.data.userDetails.address, 'N/A');
  });

  test('POST /api/paymob/webhook updates order status to paid on successful transaction', async () => {
    // Create an order first
    const order = await Order.create({
      userDetails: { name: 'Card Buyer', phone: '+20100', address: 'Cairo' },
      items: [{ itemId: testItem._id, name: testItem.name, price: testItem.price, quantity: 1, subtotal: testItem.price }],
      totalPrice: testItem.price,
      paymentMethod: 'paymob',
      paymentStatus: 'pending',
      status: 'opened',
    });

    const webhookPayload = {
      type: 'TRANSACTION',
      obj: {
        id: 998877,
        success: true,
        special_reference: order._id.toString(),
        amount_cents: Math.round(testItem.price * 100),
      },
    };

    const res = await request(app)
      .post('/api/paymob/webhook')
      .send(webhookPayload);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const updated = await Order.findById(order._id);
    assert.strictEqual(updated.paymentStatus, 'paid');
    assert.strictEqual(updated.paymobDetails.transactionId, '998877');
  });
});

describe('Manager Administrative Endpoints', () => {
  test('POST /api/manager/auth fails with invalid access key', async () => {
    const res = await request(app)
      .post('/api/manager/auth')
      .send({ accessKey: 'wrong-key-xyz' });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/manager/auth succeeds with valid key and returns token', async () => {
    const res = await request(app)
      .post('/api/manager/auth')
      .send({ accessKey: 'manager123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    managerToken = res.body.token;
  });

  test('Unauthenticated request to /api/manager/items is rejected with 401', async () => {
    const res = await request(app).get('/api/manager/items');
    assert.strictEqual(res.status, 401);
  });

  test('Manager GET /api/manager/items returns catalog items', async () => {
    const res = await request(app)
      .get('/api/manager/items')
      .set('Authorization', `Bearer ${managerToken}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.length >= 1);

    const found = res.body.data.find((i) => i._id.toString() === testItem._id.toString());
    assert.ok(found, 'Test item not found in manager items');
    assert.strictEqual(found.name, testItem.name);
  });

  test('Manager can create and update clothing items with category column', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/manager/items')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        category: 'Headwear',
        name: 'Manager Created Beanie',
        description: 'Ribbed knit beanie',
        price: 19.99,
        image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9',
      });
    assert.strictEqual(createRes.status, 201);
    const createdId = createRes.body.data._id;
    assert.strictEqual(createRes.body.data.category, 'Headwear');

    // Update price & category
    const updateRes = await request(app)
      .put(`/api/manager/items/${createdId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        price: 17.50,
        category: 'Accessories',
      });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.body.data.price, 17.50);
    assert.strictEqual(updateRes.body.data.category, 'Accessories');

    // Clean up
    const delRes = await request(app)
      .delete(`/api/manager/items/${createdId}`)
      .set('Authorization', `Bearer ${managerToken}`);
    assert.strictEqual(delRes.status, 200);
  });

  test('Manager can upload an image file via POST /api/manager/upload', async () => {
    const buffer = Buffer.from('fake-image-bytes');
    const res = await request(app)
      .post('/api/manager/upload')
      .set('Authorization', `Bearer ${managerToken}`)
      .attach('image', buffer, 'test_hoodie.png');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.imageUrl.startsWith('/uploads/'));
  });

  test('Manager can list orders and update status to closed with phone notes', async () => {
    const ordersRes = await request(app)
      .get('/api/manager/orders')
      .set('Authorization', `Bearer ${managerToken}`);
    assert.strictEqual(ordersRes.status, 200);
    assert.ok(ordersRes.body.data.length >= 1);

    const orderId = ordersRes.body.data[0]._id;

    const patchRes = await request(app)
      .patch(`/api/manager/orders/${orderId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        status: 'closed',
        notes: 'Called customer Alice. Address confirmed. Dispatched for delivery.',
      });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.body.data.status, 'closed');
    assert.strictEqual(
      patchRes.body.data.notes,
      'Called customer Alice. Address confirmed. Dispatched for delivery.'
    );
  });
});
