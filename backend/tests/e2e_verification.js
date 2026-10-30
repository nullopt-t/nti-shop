import fetch from 'node:http';

const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const res = await globalThis.fetch(url, options);
  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body: json };
}

async function verifyEndToEnd() {
  console.log('[E2E Check] Starting full stack verification...');

  // 1. Health
  const health = await request(`${BASE_URL}/health`);
  if (!health.ok) throw new Error(`Health check failed: ${JSON.stringify(health)}`);
  console.log('✓ Health check passed');

  // 2. Public categories
  const categories = await request(`${BASE_URL}/categories`);
  if (!categories.ok || categories.body.data.length === 0) {
    throw new Error('Categories fetch failed');
  }
  console.log(`✓ Fetched ${categories.body.data.length} public categories`);

  // 3. Public items
  const items = await request(`${BASE_URL}/items`);
  if (!items.ok || items.body.data.length === 0) {
    throw new Error('Items fetch failed');
  }
  for (const item of items.body.data) {
    if (item.quantity !== undefined) {
      throw new Error(`Unexpected quantity on item ${item.name}`);
    }
  }
  console.log(`✓ Fetched ${items.body.data.length} public items.`);

  const noImageItem = items.body.data.find((i) => !i.image || i.image === '');
  if (!noImageItem) {
    throw new Error('Expected at least one item without an image in seed data');
  }
  console.log(`✓ Confirmed item with empty image exists: "${noImageItem.name}"`);

  const sampleItem = items.body.data[0];

  // 4. Public item detail
  const detail = await request(`${BASE_URL}/items/${sampleItem._id}`);
  if (!detail.ok || detail.body.data.quantity !== undefined) {
    throw new Error('Item detail exposed quantity or failed');
  }
  console.log('✓ Public item detail verified without quantity leak');

  // 5. Submit customer order
  const orderRes = await request(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userDetails: {
        name: 'Sarah Connor',
        phone: '+1 800-555-0149',
        address: '42 Cyberdyne Blvd, Los Angeles',
      },
      items: [
        { itemId: sampleItem._id, quantity: 2 },
      ],
    }),
  });

  if (!orderRes.ok || orderRes.body.data.status !== 'opened') {
    throw new Error(`Order submission failed: ${JSON.stringify(orderRes)}`);
  }
  const createdOrderId = orderRes.body.data._id;
  console.log(`✓ Order #${createdOrderId} submitted successfully in opened status`);

  // 6. Manager login gate
  const authRes = await request(`${BASE_URL}/manager/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessKey: 'manager123' }),
  });
  if (!authRes.ok || !authRes.body.token) {
    throw new Error('Manager login failed');
  }
  const token = authRes.body.token;
  console.log('✓ Manager authenticated with access key');

  // 7. Manager items check
  const mgrItems = await request(`${BASE_URL}/manager/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!mgrItems.ok) throw new Error('Manager items failed');
  const mgrSample = mgrItems.body.data.find((i) => i._id === sampleItem._id);
  if (!mgrSample) {
    throw new Error('Manager view missing item');
  }
  console.log('✓ Manager successfully retrieved catalog items');

  // 8. Manager order update & notes
  const patchRes = await request(`${BASE_URL}/manager/orders/${createdOrderId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'closed',
      notes: 'Customer confirmed order by telephone. Dispatched with courier #11.',
    }),
  });

  if (!patchRes.ok || patchRes.body.data.status !== 'closed' || !patchRes.body.data.notes) {
    throw new Error('Manager order patch failed');
  }
  console.log('✓ Order closed and phone confirmation notes saved by manager');

  console.log('\n>>> ALL SYSTEM SPECIFICATIONS AND BEHAVIORS VERIFIED CLEANLY <<<');
}

verifyEndToEnd().catch((err) => {
  console.error('[E2E Error]', err);
  process.exit(1);
});
