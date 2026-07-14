/**
 * seed.js — Run once to populate MongoDB with the initial menu.
 * Usage: node seed.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Load .env
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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Sample menu data (200–300 ETB range)
// ---------------------------------------------------------------------------
const menuData = {
  _id: 'menu',
  categories: [
    {
      id: 'cat-breakfast',
      name: 'Breakfast',
      items: [
        { id: 'item-001', name: 'Firfir with Egg',        price: 210, available: true },
        { id: 'item-002', name: 'Chechebsa (Kita Firfir)', price: 200, available: true },
        { id: 'item-003', name: 'Full Breakfast Platter',  price: 280, available: true },
        { id: 'item-004', name: 'Scrambled Eggs & Toast',  price: 220, available: true },
        { id: 'item-005', name: 'Genfo (Porridge)',        price: 200, available: true },
      ]
    },
    {
      id: 'cat-main',
      name: 'Main Dishes',
      items: [
        { id: 'item-006', name: 'Tibs (Mixed Meat)',       price: 290, available: true },
        { id: 'item-007', name: 'Kitfo (Minced Beef)',     price: 300, available: true },
        { id: 'item-008', name: 'Doro Wat (Chicken Stew)', price: 280, available: true },
        { id: 'item-009', name: 'Misir Wat (Lentils)',     price: 220, available: true },
        { id: 'item-010', name: 'Shiro Wat',               price: 210, available: true },
        { id: 'item-011', name: 'Gomen (Collard Greens)',  price: 200, available: true },
        { id: 'item-012', name: 'Asa Tibs (Fish Tibs)',    price: 295, available: true },
      ]
    },
    {
      id: 'cat-pasta',
      name: 'Pasta & Rice',
      items: [
        { id: 'item-013', name: 'Spaghetti Bolognese',    price: 240, available: true },
        { id: 'item-014', name: 'Spaghetti Vegetarian',   price: 220, available: true },
        { id: 'item-015', name: 'Fried Rice with Chicken',price: 260, available: true },
        { id: 'item-016', name: 'Macaroni Baked',         price: 230, available: true },
      ]
    },
    {
      id: 'cat-salads',
      name: 'Salads & Sides',
      items: [
        { id: 'item-017', name: 'Green Salad',            price: 200, available: true },
        { id: 'item-018', name: 'Avocado Salad',          price: 230, available: true },
        { id: 'item-019', name: 'Tomato & Onion Salad',   price: 200, available: true },
        { id: 'item-020', name: 'French Fries',           price: 210, available: true },
      ]
    },
    {
      id: 'cat-beverages',
      name: 'Beverages',
      items: [
        { id: 'item-021', name: 'Ethiopian Coffee (Buna)', price: 200, available: true },
        { id: 'item-022', name: 'Fresh Avocado Juice',    price: 230, available: true },
        { id: 'item-023', name: 'Mango Juice',            price: 210, available: true },
        { id: 'item-024', name: 'Mixed Fruit Juice',      price: 240, available: true },
        { id: 'item-025', name: 'Soft Drink (Pepsi/7Up)', price: 200, available: true },
        { id: 'item-026', name: 'Mineral Water',          price: 200, available: true },
      ]
    },
    {
      id: 'cat-desserts',
      name: 'Desserts',
      items: [
        { id: 'item-027', name: 'Baklava',                price: 220, available: true },
        { id: 'item-028', name: 'Chocolate Cake Slice',   price: 250, available: true },
        { id: 'item-029', name: 'Fruit Salad with Cream', price: 230, available: true },
        { id: 'item-030', name: 'Ice Cream (2 scoops)',   price: 210, available: true },
      ]
    }
  ]
};

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas...');
    const db = client.db();

    // Upsert the menu document
    await db.collection('menu').replaceOne(
      { _id: 'menu' },
      menuData,
      { upsert: true }
    );
    console.log('✅ Menu seeded successfully!');

    // Optionally clear old test orders
    const ordersCount = await db.collection('orders').countDocuments();
    console.log(`ℹ️  Orders collection has ${ordersCount} document(s). Not cleared.`);

    console.log('\nDone. You can now run: node server.js');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await client.close();
  }
}

seed();
