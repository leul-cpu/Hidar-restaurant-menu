const express = require('express');
const fs = require('fs');
const path = require('path');

// Manually load .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
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

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'menu_db.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'HidarAdmin2026';
const TOKEN_SECRET = 'hidar-secret-auth-token-12345';

// In-memory caches for performance optimization
let menuCache = null;
let ordersCache = null;
let itemMap = new Map(); // O(1) lookup for menu items by ID

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the logo image from workspace root
app.get('/IMG000.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'IMG000.jpg'));
});

// Helper to build a flat map of menu items for O(1) lookup
function buildItemMap() {
  if (!menuCache || !menuCache.categories) return;
  itemMap.clear();
  for (const category of menuCache.categories) {
    for (const item of category.items) {
      itemMap.set(item.id, item);
    }
  }
}

// Helper to read menu database
function readMenu() {
  if (menuCache) return menuCache;
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    menuCache = JSON.parse(data);
    buildItemMap();
    return menuCache;
  } catch (error) {
    console.error('Error reading DB:', error);
    return { categories: [] };
  }
}

// Helper to write menu database
function writeMenu(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    menuCache = data;
    buildItemMap();
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
    return false;
  }
}

const ORDERS_FILE = path.join(__dirname, 'orders_db.json');
const STAFF_PIN = process.env.STAFF_PIN || '1234';

// Helper to read orders database
function readOrders() {
  if (ordersCache) return ordersCache;
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf8');
      ordersCache = [];
      return [];
    }
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    ordersCache = JSON.parse(data);
    return ordersCache;
  } catch (error) {
    console.error('Error reading Orders DB:', error);
    return [];
  }
}

// Helper to write orders database
function writeOrders(data) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
    ordersCache = data;
    return true;
  } catch (error) {
    console.error('Error writing Orders DB:', error);
    return false;
  }
}

// Get entire menu
app.get('/api/menu', (req, res) => {
  res.json(readMenu());
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: TOKEN_SECRET });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

// Admin menu update endpoint
app.post('/api/admin/menu', (req, res) => {
  const token = req.headers['authorization'];
  if (token !== `Bearer ${TOKEN_SECRET}`) {
    return res.status(403).json({ success: false, message: 'Unauthorized access' });
  }

  const { itemId, name, price, available } = req.body;
  const menu = readMenu();

  // Optimization: use O(1) itemMap lookup instead of O(N*M) nested loops
  const item = itemMap.get(itemId);

  if (item) {
    if (name !== undefined) item.name = name;
    if (price !== undefined) item.price = Number(price);
    if (available !== undefined) item.available = Boolean(available);

    if (writeMenu(menu)) {
      res.json({ success: true, message: 'Item updated successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to write to database' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Item not found' });
  }
});

// Place order
app.post('/api/orders', (req, res) => {
  const { table, items } = req.body; // items: [{ itemId, quantity }]
  if (!table || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid order parameters' });
  }

  const menu = readMenu();
  const orders = readOrders();
  const orderItems = [];
  let total = 0;

  for (let orderItem of items) {
    // Optimization: use O(1) itemMap lookup instead of O(N*M) nested loops
    const menuItem = itemMap.get(orderItem.itemId);

    if (!menuItem || !menuItem.available) {
      return res.status(400).json({ success: false, message: `Item ${orderItem.itemId} is unavailable` });
    }

    const qty = Number(orderItem.quantity) || 1;
    orderItems.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: qty
    });
    total += menuItem.price * qty;
  }

  const orderId = `HDR-${Math.floor(1000 + Math.random() * 9000)}`;
  const newOrder = {
    id: orderId,
    table: String(table),
    items: orderItems,
    status: 'pending', // pending, preparing, ready, served
    total: total,
    timestamp: new Date().toISOString()
  };

  orders.push(newOrder);
  if (writeOrders(orders)) {
    res.json({ success: true, orderId });
  } else {
    res.status(500).json({ success: false, message: 'Failed to save order' });
  }
});

// Staff PIN login
app.post('/api/staff/login', (req, res) => {
  const { pin } = req.body;
  if (pin === STAFF_PIN) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid Staff PIN' });
  }
});

// Get all orders (Staff Dashboard view)
app.get('/api/orders', (req, res) => {
  const pin = req.headers['x-staff-pin'];
  if (pin !== STAFF_PIN) {
    return res.status(403).json({ success: false, message: 'Unauthorized staff access' });
  }

  // Optimization: Server-side filtering to reduce payload size as order history grows
  const { tab } = req.query;
  let orders = readOrders();

  if (tab === 'active') {
    orders = orders.filter(order => order.status !== 'served');
  } else if (tab === 'served') {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    orders = orders.filter(order => {
      return order.status === 'served' && new Date(order.timestamp) >= twentyFourHoursAgo;
    });
  }

  res.json(orders);
});

// Get single order status (Customer view)
app.get('/api/orders/:orderId', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.orderId);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
});

// Update order status (Staff Dashboard action)
app.post('/api/orders/:orderId/status', (req, res) => {
  const pin = req.headers['x-staff-pin'];
  if (pin !== STAFF_PIN) {
    return res.status(403).json({ success: false, message: 'Unauthorized staff access' });
  }

  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'served'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.orderId);

  if (order) {
    order.status = status;
    if (writeOrders(orders)) {
      res.json({ success: true, message: 'Order status updated successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to save updates' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Order not found' });
  }
});

// Warm up the caches on startup
readMenu();
readOrders();

app.listen(PORT, () => {
  console.log(`Hidar Coffee server running at http://localhost:${PORT}`);
});
