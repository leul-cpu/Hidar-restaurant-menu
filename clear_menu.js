/**
 * clear_menu.js — Run once to reset the database menu to empty.
 * Usage: node clear_menu.js
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

async function clearMenu() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas...');
    const db = client.db();

    // Set the menu to empty categories
    await db.collection('menu').replaceOne(
      { _id: 'menu' },
      { _id: 'menu', categories: [] },
      { upsert: true }
    );
    console.log('✅ Menu cleared successfully! It is now empty.');
  } catch (err) {
    console.error('❌ Clear failed:', err.message);
  } finally {
    await client.close();
  }
}

clearMenu();
