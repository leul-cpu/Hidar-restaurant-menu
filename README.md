# Hidar Restaurant Menu & Order Management System

An elegant, real-time digital restaurant menu and staff order tracking dashboard designed for **Hidar Coffee** (Bole, Addis Ababa). 

This system allows customers to order food/drinks directly from their tables using QR-code routed URLs (e.g. `http://localhost:3000/?table=5`), track their order status in real-time, and enables staff to manage the kitchen workflow from a password-protected dashboard.

---

## 📸 Screenshots & Previews

### 1. Customer Digital Menu Interface
This is the modern, premium interactive menu with category banners and floating action buttons.
![Customer Menu](./customer%20Menu.png)

### 2. Fast Track Order Progress Modal
Customers click the floating "Track Status" action button on the bottom left to overlay this live-updating quick timeline tracker.
![Track Order Modal](./Track%20order.png)

### 3. Dedicated Full-Page Order Timeline
Customers can choose to view their live cooking tracking page on a detailed full layout.
![Full Page Tracking](./check%20order%20status%20on%20full%20page.png)

### 4. Real-time Kitchen Staff Dashboard
Accessible securely via PIN code authentication. Staff can view, edit, prepare, and serve incoming table orders.
![Staff Dashboard](./Staff%20Dashboared.png)

---

## 🚀 Key Features

*   **Premium Interactive Menu**: Styled with a warm Ethiopian-modernist aesthetic (terracotta gradient accents, clean typography, category banners).
*   **Persistent Table ID Routing**: Simply append `?table=X` to the URL.
*   **One-Tap Order Status Tracking**: The "Track Status" button in the header remembers the customer's last order (via `localStorage`) and shows a horizontal, live-updating progress tracker (Placed → Preparing → Ready → Served).
*   **Staff Dashboard (`#/staff`)**:
    *   Protected by a secure 4-digit PIN (`1234`).
    *   Manages live orders using a clear Kanban workflow (Accept → Prepare → Serve).
    *   **Served History Tab**: Automatically filters and displays served orders from only the last 24 hours to keep the UI clean, while safely keeping older entries saved inside the database file.
*   **Zero-Dependency Light Database**: Uses JSON files for flat-file persistence.

---

## 🛠️ Tech Stack

*   **Frontend**: Plain HTML5, Vanilla CSS3 (Custom Variables), and modern Single-Page-App (SPA) Javascript.
*   **Backend**: Node.js & Express.
*   **Database**: File-based storage (`menu_db.json` & `orders_db.json`).

---

## 🌐 Live Deployment Links

The project is live and hosted on Render. You can access the interfaces using the links below:

*   **Customer Menu View (Table 5)**: [https://hidar-restaurant-menu.onrender.com/?table=5](https://hidar-restaurant-menu.onrender.com/?table=5)
*   **Staff Dashboard**: [https://hidar-restaurant-menu.onrender.com/#/staff](https://hidar-restaurant-menu.onrender.com/#/staff)
    *   *(Note: The Staff login PIN is securely set in the environment variables configuration on Render)*

---

## ⚙️ Installation & Local Setup

1.  **Clone or Open** this workspace directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Ensure your environment variables are configured in `.env` (refer to the environment setup instructions on deployment).
4.  Start the local server:
    ```bash
    npm start
    ```
5.  Open your browser and navigate to:
    *   **Customer View**: `http://localhost:3000/?table=5`
    *   **Staff Dashboard**: `http://localhost:3000/#/staff`

---

## 📂 Project Structure

```text
Hidar restaurant menu/
├── public/                 # Client assets
│   ├── index.html          # Main HTML structure (Menu, Tracking, and Staff views)
│   ├── style.css           # Vanilla CSS (custom properties, responsive layout)
│   └── app.js              # SPA router, API calls, state management, and real-time polling
├── .env.example            # Sample system configuration (excluding actual credentials)
├── server.js               # Node.js + Express backend server
├── menu_db.json            # Menu database (Categories, dishes, prices, and status tags)
└── orders_db.json          # Persistent order database (records customer orders)
```

---
Developed for **Hidar Coffee** — Addis Ababa, Ethiopia.


