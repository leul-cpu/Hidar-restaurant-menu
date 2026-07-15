/**
 * seed.js — Populates MongoDB Atlas with the real Madiga Cafe & Restaurant menu.
 * Run once: node seed.js
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
if (!MONGODB_URI) { console.error('ERROR: MONGODB_URI not found in .env'); process.exit(1); }

const menuData = {
  _id: 'menu',
  categories: [
    // ─────────────────────────────────────────────────────────────
    // 1. BREAKFAST & BRUNCH
    // ─────────────────────────────────────────────────────────────
    {
      id: 'breakfast-brunch',
      name: 'Breakfast & Brunch',
      items: [
        { id: 'bb-001', name: 'Chicken Pesto Croissant',          price: 800,  available: true, image: '/Chicken Pesto Croissant.jpeg' },
        { id: 'bb-002', name: 'Avocado Boiled Egg Croissant',     price: 520,  available: true },
        { id: 'bb-003', name: 'Cheese Croissant Sandwich',        price: 480,  available: true },
        { id: 'bb-004', name: 'Egg Croissant Sandwich',           price: 450,  available: true },
        { id: 'bb-005', name: 'Plain Omelet',                     price: 520,  available: true },
        { id: 'bb-006', name: 'Cheese Omelet',                    price: 480,  available: true },
        { id: 'bb-007', name: 'Veggie Omelet',                    price: 480,  available: true },
        { id: 'bb-008', name: 'Avocado Sandwich',                 price: 480,  available: true },
        { id: 'bb-009', name: 'Scrambled Egg',                    price: 480,  available: true },
        { id: 'bb-010', name: 'Eat Your Protein',                 price: 750,  available: true },
        { id: 'bb-011', name: 'Vegan Foul',                       price: 480,  available: true },
        { id: 'bb-012', name: 'Special Foul',                     price: 550,  available: true },
        { id: 'bb-013', name: 'Foul with Avocado',                price: 530,  available: true },
        { id: 'bb-014', name: 'Teff Pancake',                     price: 480,  available: true },
        { id: 'bb-015', name: 'Teff Pancake with Oats',           price: 520,  available: true },
        { id: 'bb-016', name: 'Wheat Pancake',                    price: 480,  available: true },
        { id: 'bb-017', name: 'Oats',                             price: 520,  available: true },
      ]
    },

    // ─────────────────────────────────────────────────────────────
    // 2. SANDWICH & BURGER
    // ─────────────────────────────────────────────────────────────
    {
      id: 'sandwich-burger',
      name: 'Sandwich & Burger',
      items: [
        // Wraps
        { id: 'sb-001', name: 'Tuna Wrap',                        price: 800,  available: true },
        { id: 'sb-002', name: 'Pesto Chicken Wrap',               price: 1200, available: true },
        { id: 'sb-003', name: 'Sweet Chili Chicken Wrap',         price: 1100, available: true },
        { id: 'sb-004', name: 'B.B.Q Chicken Wrap',               price: 1200, available: true },
        // Sandwiches
        { id: 'sb-005', name: 'Chicken Sandwich',                 price: 1200, available: true },
        { id: 'sb-006', name: 'Steak Sandwich',                   price: 1350, available: true },
        { id: 'sb-007', name: 'Beef Bacon, Avocado & Chicken Sandwich', price: 1500, available: true },
        { id: 'sb-008', name: 'Club Sandwich',                    price: 1450, available: true },
        { id: 'sb-009', name: 'Smoked Salmon Sandwich',           price: 1800, available: true },
        { id: 'sb-010', name: 'Vegetable Sandwich',               price: 680,  available: true },
        { id: 'sb-011', name: 'Tuna Sandwich',                    price: 750,  available: true },
        // Burgers
        { id: 'sb-012', name: 'Cheese Burger',                    price: 1250, available: true },
        { id: 'sb-013', name: 'Beef Burger',                      price: 900,  available: true },
        { id: 'sb-014', name: 'Double Cheese Burger',             price: 1700, available: true },
        // Extras
        { id: 'sb-015', name: 'Extra: Cheese',                    price: 160,  available: true },
        { id: 'sb-016', name: 'Extra: Egg',                       price: 120,  available: true },
        { id: 'sb-017', name: 'Extra: Avocado',                   price: 180,  available: true },
        { id: 'sb-018', name: 'Extra: Salad',                     price: 180,  available: true },
        { id: 'sb-019', name: 'Extra: Wedge Potato',              price: 300,  available: true },
        { id: 'sb-020', name: 'Extra: Yogurt',                    price: 180,  available: true },
      ]
    },

    // ─────────────────────────────────────────────────────────────
    // 3. PASTA & GRILLED
    // ─────────────────────────────────────────────────────────────
    {
      id: 'pasta-grilled',
      name: 'Pasta & Grilled',
      items: [
        { id: 'pg-001', name: 'Bologna Sauce',                    price: 750,  available: true },
        { id: 'pg-002', name: 'Light Pomodoro Sauce',             price: 500,  available: true },
        { id: 'pg-003', name: 'Pesto Sauce',                      price: 890,  available: true },
        { id: 'pg-004', name: 'Vegetable Sauce',                  price: 590,  available: true },
        { id: 'pg-005', name: 'Fettuccine Alfredo',               price: 1200, available: true },
        { id: 'pg-006', name: 'Fettuccine Chicken Alfredo',       price: 1600, available: true },
        { id: 'pg-007', name: 'Chicken Lasagna',                  price: 1300, available: true },
        { id: 'pg-008', name: 'Beef Lasagna',                     price: 1300, available: true },
      ]
    },

    // ─────────────────────────────────────────────────────────────
    // 4. SALADS
    // ─────────────────────────────────────────────────────────────
    {
      id: 'salads',
      name: 'Salads',
      items: [
        { id: 'sal-001', name: 'Grilled Chicken Salad',           price: 1250, available: true },
        { id: 'sal-002', name: 'Protein Salad',                   price: 1400, available: true },
        { id: 'sal-003', name: 'Tuna Salad',                      price: 1050, available: true },
        { id: 'sal-004', name: 'Salmon Salad',                    price: 2100, available: true },
        { id: 'sal-005', name: 'Green Healthy Salad + Juice',     price: 790,  available: true },
        { id: 'sal-006', name: 'Cooked Veggie Salad',             price: 650,  available: true },
        { id: 'sal-007', name: 'Classic',                         price: 480,  available: true },
        { id: 'sal-008', name: 'Hummus',                          price: 480,  available: true },
      ]
    },

    // ─────────────────────────────────────────────────────────────
    // 5. JUICE & SMOOTHIE
    // ─────────────────────────────────────────────────────────────
    {
      id: 'juice-smoothie',
      name: 'Juice & Smoothie',
      items: [
        // Smoothies
        { id: 'js-001', name: 'Green One Smoothie',               price: 480,  available: true },
        { id: 'js-002', name: 'Avocado Almond Smoothie',          price: 600,  available: true },
        { id: 'js-003', name: 'Apple Almond Smoothie',            price: 610,  available: true },
        { id: 'js-004', name: 'Mango Lovers Smoothie',            price: 490,  available: true },
        { id: 'js-005', name: 'Carrot Smoothie',                  price: 400,  available: true },
        { id: 'js-006', name: 'Peanut Smoothie',                  price: 490,  available: true },
        { id: 'js-007', name: 'Coffee Smoothie',                  price: 500,  available: true },
        { id: 'js-008', name: 'Drink Your Oats',                  price: 450,  available: true },
        { id: 'js-009', name: 'Banana Smoothie',                  price: 380,  available: true },
        { id: 'js-010', name: 'Strawberry Smoothie',              price: 450,  available: true },
        { id: 'js-011', name: 'Papaya Smoothie',                  price: 480,  available: true },
        { id: 'js-012', name: 'Sweet & Spicy Mango Avocado Blend', price: 480, available: true },
        { id: 'js-013', name: 'Tropical Smoothie',                price: 490,  available: true },
        { id: 'js-014', name: 'Healthy Green Blend',              price: 490,  available: true },
        { id: 'js-015', name: 'Sugarcane Lemonade',               price: 490,  available: true },
        // Cleansing Juices
        { id: 'js-016', name: 'Green Apple Detox',                price: 480,  available: true },
        { id: 'js-017', name: 'Pineapple Detox',                  price: 480,  available: true },
        { id: 'js-018', name: 'Celery Aid',                       price: 480,  available: true },
        { id: 'js-019', name: 'Beetroot Juice',                   price: 400,  available: true },
        { id: 'js-020', name: 'Glow',                             price: 490,  available: true },
        // Fresh Juices
        { id: 'js-021', name: 'Avocado Juice',                    price: 490,  available: true },
        { id: 'js-022', name: 'Mango Juice',                      price: 400,  available: true },
        { id: 'js-023', name: 'Papaya Juice',                     price: 490,  available: true },
        { id: 'js-024', name: 'Orange Juice',                     price: 400,  available: true },
        { id: 'js-025', name: 'Pineapple Juice',                  price: 550,  available: true },
        { id: 'js-026', name: 'Watermelon Juice',                 price: 400,  available: true },
        { id: 'js-027', name: 'Carrot Juice',                     price: 400,  available: true },
        { id: 'js-028', name: 'Flax-seed Juice',                  price: 480,  available: true },
        { id: 'js-029', name: 'Fruit Salad',                      price: 700,  available: true },
        { id: 'js-030', name: 'Muesli',                           price: 300,  available: true },
      ]
    },

    // ─────────────────────────────────────────────────────────────
    // 6. BEVERAGE
    // ─────────────────────────────────────────────────────────────
    {
      id: 'beverage',
      name: 'Beverage',
      items: [
        { id: 'bev-001', name: 'Espresso (Single)',               price: 160,  available: true },
        { id: 'bev-002', name: 'Espresso (Double)',               price: 190,  available: true },
        { id: 'bev-003', name: 'Macchiato (Single)',              price: 120,  available: true },
        { id: 'bev-004', name: 'Macchiato (Double)',              price: 160,  available: true },
        { id: 'bev-005', name: 'Americano (Single)',              price: 170,  available: true },
        { id: 'bev-006', name: 'Americano (Double)',              price: 230,  available: true },
        { id: 'bev-007', name: 'Fasting Macchiato (Single)',      price: 220,  available: true },
        { id: 'bev-008', name: 'Fasting Macchiato (Double)',      price: 270,  available: true },
        { id: 'bev-009', name: 'Cafe Latte',                     price: 230,  available: true },
        { id: 'bev-010', name: 'Fasting Latte',                  price: 270,  available: true },
        { id: 'bev-011', name: 'Cappuccino',                     price: 240,  available: true },
        { id: 'bev-012', name: 'Cappuccino with Cinnamon',       price: 240,  available: true },
        { id: 'bev-013', name: 'Hot Chocolate',                  price: 310,  available: true },
        { id: 'bev-014', name: 'Steamed Milk',                   price: 210,  available: true },
        { id: 'bev-015', name: 'Ginger Tea',                     price: 80,   available: true },
        { id: 'bev-016', name: 'Tea',                            price: 130,  available: true },
        { id: 'bev-017', name: 'Green Tea / Herbal Tea',         price: 130,  available: true },
        { id: 'bev-018', name: 'Tea with Lemon',                 price: 125,  available: true },
        { id: 'bev-019', name: 'Special Tea',                    price: 350,  available: true },
        { id: 'bev-020', name: 'Tea with Coffee (Sprees)',       price: 220,  available: true },
        { id: 'bev-021', name: 'Tea Latte',                      price: 150,  available: true },
        { id: 'bev-022', name: 'Caramel Macchiato',              price: 270,  available: true },
        { id: 'bev-023', name: 'Caramel Latte',                  price: 220,  available: true },
        { id: 'bev-024', name: 'Iced Coffee',                    price: 190,  available: true },
        { id: 'bev-025', name: 'Iced Tea',                       price: 170,  available: true },
        { id: 'bev-026', name: 'Iced Latte',                     price: 320,  available: true },
        { id: 'bev-027', name: 'Iced Cinnamon Coffee',           price: 190,  available: true },
        { id: 'bev-028', name: 'Iced Caramel Latte',             price: 330,  available: true },
      ]
    },

    // ─────────────────────────────────────────────────────────────
    // 7. PASTRY & BAKERY
    // ─────────────────────────────────────────────────────────────
    {
      id: 'pastry-bakery',
      name: 'Pastry & Bakery',
      items: [
        { id: 'pb-001', name: 'Chocolate Croissant',              price: 280,  available: true },
        { id: 'pb-002', name: 'Plain Croissant',                  price: 250,  available: true },
        { id: 'pb-003', name: 'English Cake',                     price: 160,  available: true },
        { id: 'pb-004', name: 'Banana Cake',                      price: 140,  available: true },
        { id: 'pb-005', name: 'Cream Puff (3 pcs)',               price: 280,  available: true },
      ]
    },
  ]
};

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas...');
    const db = client.db();

    await db.collection('menu').replaceOne(
      { _id: 'menu' },
      menuData,
      { upsert: true }
    );
    console.log('✅ Madiga menu seeded successfully!');
    console.log(`   Categories: ${menuData.categories.length}`);
    console.log(`   Total items: ${menuData.categories.reduce((s, c) => s + c.items.length, 0)}`);

    const orderCount = await db.collection('orders').countDocuments();
    console.log(`ℹ️  Orders collection has ${orderCount} document(s). Not cleared.`);
    console.log('\nDone. You can now run: node server.js');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await client.close();
  }
}

seed();
