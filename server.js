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

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the logo image from workspace root
app.get('/IMG000.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'IMG000.jpg'));
});

// Helper to read menu database
function readMenu() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return { categories: [] };
  }
}

// Helper to write menu database
function writeMenu(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing DB:', error);
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
  let found = false;

  for (let cat of menu.categories) {
    const item = cat.items.find(i => i.id === itemId);
    if (item) {
      if (name !== undefined) item.name = name;
      if (price !== undefined) item.price = Number(price);
      if (available !== undefined) item.available = Boolean(available);
      found = true;
      break;
    }
  }

  if (found) {
    if (writeMenu(menu)) {
      res.json({ success: true, message: 'Item updated successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to write to database' });
    }
  } else {
    res.status(404).json({ success: false, message: 'Item not found' });
  }
});


app.listen(PORT, () => {
  console.log(`Madiga Cafe & Restaurant server running at http://localhost:${PORT}`);
});
