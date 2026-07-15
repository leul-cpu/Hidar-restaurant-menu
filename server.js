const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// ---------------------------------------------------------------------------
// Load .env file manually (works locally; on Vercel use Environment Variables)
// ---------------------------------------------------------------------------
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        const value = trimmed.substring(index + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MadigaAdmin2026';
const TOKEN_SECRET   = 'madiga-secret-auth-token-12345';
const STAFF_PIN      = process.env.STAFF_PIN || '1234';
const MONGODB_URI    = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set. Add it to your .env file.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// MongoDB connection (cached at module level for warm serverless reuse)
// ---------------------------------------------------------------------------
let cachedClient = null;

async function getDb() {
  if (cachedClient) return cachedClient.db();
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client.db();
}

// ---------------------------------------------------------------------------
// Express setup
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ⚡ Bolt: Implement browser caching for static assets.
// Assets in public/ (JS, CSS, images) are cached for 1 day.
// HTML files are set to must-revalidate to ensure users always get the latest SPA entry point.
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

app.get('/IMG000.jpg', (req, res) => {
  // ⚡ Bolt: Cache the main logo for 1 day.
  res.sendFile(path.join(__dirname, 'IMG000.jpg'), { maxAge: '1d' });
});

// ---------------------------------------------------------------------------
// GET /api/menu
// ---------------------------------------------------------------------------
app.get('/api/menu', async (req, res) => {
  try {
    const db = await getDb();
    const doc = await db.collection('menu').findOne({ _id: 'menu' });
    res.json(doc || { categories: [] });
  } catch (err) {
    console.error('GET /api/menu error:', err);
    res.status(500).json({ success: false, message: 'Failed to load menu' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/login
// ---------------------------------------------------------------------------
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: TOKEN_SECRET });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/admin/menu — update a single item
// ---------------------------------------------------------------------------
app.post('/api/admin/menu', async (req, res) => {
  const token = req.headers['authorization'];
  if (token !== `Bearer ${TOKEN_SECRET}`) {
    return res.status(403).json({ success: false, message: 'Unauthorized access' });
  }

  const { itemId, name, price, available } = req.body;

  try {
    const db = await getDb();
    const doc = await db.collection('menu').findOne({ _id: 'menu' });
    if (!doc) return res.status(404).json({ success: false, message: 'Menu not found' });

    let found = false;
    for (const cat of doc.categories) {
      const item = cat.items.find(i => i.id === itemId);
      if (item) {
        if (name      !== undefined) item.name      = name;
        if (price     !== undefined) item.price     = Number(price);
        if (available !== undefined) item.available = Boolean(available);
        found = true;
        break;
      }
    }

    if (!found) return res.status(404).json({ success: false, message: 'Item not found' });

    await db.collection('menu').replaceOne({ _id: 'menu' }, doc);
    res.json({ success: true, message: 'Item updated successfully' });
  } catch (err) {
    console.error('POST /api/admin/menu error:', err);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/orders — place a new order
// ---------------------------------------------------------------------------
app.post('/api/orders', async (req, res) => {
  const { table, items } = req.body;
  if (!table || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid order parameters' });
  }

  try {
    const db = await getDb();
    const menuDoc = await db.collection('menu').findOne({ _id: 'menu' });
    if (!menuDoc) return res.status(500).json({ success: false, message: 'Menu not available' });

    const itemMap = new Map();
    for (const cat of menuDoc.categories) {
      for (const item of cat.items) itemMap.set(item.id, item);
    }

    const orderItems = [];
    let total = 0;

    for (const orderItem of items) {
      const menuItem = itemMap.get(orderItem.itemId);
      if (!menuItem || !menuItem.available) {
        return res.status(400).json({ success: false, message: `Item ${orderItem.itemId} is unavailable` });
      }
      const qty = Number(orderItem.quantity) || 1;
      orderItems.push({ id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: qty });
      total += menuItem.price * qty;
    }

    const orderId = `MDG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      table: String(table),
      items: orderItems,
      status: 'pending',
      total,
      timestamp: new Date().toISOString()
    };

    await db.collection('orders').insertOne(newOrder);
    res.json({ success: true, orderId });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to save order' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/staff/login
// ---------------------------------------------------------------------------
app.post('/api/staff/login', (req, res) => {
  const { pin } = req.body;
  if (pin === STAFF_PIN) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid Staff PIN' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/orders — staff: all orders
// ---------------------------------------------------------------------------
app.get('/api/orders', async (req, res) => {
  const pin = req.headers['x-staff-pin'];
  if (pin !== STAFF_PIN) {
    return res.status(403).json({ success: false, message: 'Unauthorized staff access' });
  }

  try {
    const db = await getDb();
    const orders = await db.collection('orders').find({}).sort({ timestamp: -1 }).toArray();
    res.json(orders);
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/orders/:orderId — customer: track single order
// ---------------------------------------------------------------------------
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const db = await getDb();
    const order = await db.collection('orders').findOne({ id: req.params.orderId });
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (err) {
    console.error('GET /api/orders/:orderId error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/orders/:orderId/status — staff: update order status
// ---------------------------------------------------------------------------
app.post('/api/orders/:orderId/status', async (req, res) => {
  const pin = req.headers['x-staff-pin'];
  if (pin !== STAFF_PIN) {
    return res.status(403).json({ success: false, message: 'Unauthorized staff access' });
  }

  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'served'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const db = await getDb();
    const result = await db.collection('orders').updateOne(
      { id: req.params.orderId },
      { $set: { status } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (err) {
    console.error('POST /api/orders/:orderId/status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Madiga Cafe & Restaurant server running at http://localhost:${PORT}`);
});

module.exports = app; // required by Vercel
