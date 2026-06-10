//CodeAlpha
//Backend Development
//Hachemaoui Khadija

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(express.json());  
app.use(express.static('public'));

const db = new Database('restaurant.db');


db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        available INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tables_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER UNIQUE NOT NULL,
        capacity INTEGER NOT NULL,
        is_reserved INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ingredient_name TEXT NOT NULL UNIQUE,
        quantity INTEGER NOT NULL DEFAULT 0,
        unit TEXT DEFAULT 'units'
    );

    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER,
        status TEXT DEFAULT 'pending',
        total_price REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (table_id) REFERENCES tables_table(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        reservation_time TEXT NOT NULL,
        guests INTEGER NOT NULL,
        status TEXT DEFAULT 'confirmed',
        FOREIGN KEY (table_id) REFERENCES tables_table(id)
    );
`);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API

app.get('/api/menu', (req, res) => {
    const items = db.prepare('SELECT * FROM menu_items WHERE available = 1').all();
    res.json(items);
});

// Add a menu item
app.post('/api/menu', (req, res) => {
    const { name, description, price, category } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required.' });
    }

    const result = db.prepare(
        'INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)'
    ).run(name, description, price, category);

    res.json({ message: 'Menu item added!', id: result.lastInsertRowid });
});

// Update a menu item
app.put('/api/menu/:id', (req, res) => {
    const { name, description, price, category, available } = req.body;

    db.prepare(`
        UPDATE menu_items SET name=?, description=?, price=?, category=?, available=?
        WHERE id=?
    `).run(name, description, price, category, available !== undefined ? available : 1, req.params.id);

    res.json({ message: 'Menu item updated!' });
});

// Delete a menu item
app.delete('/api/menu/:id', (req, res) => {
    db.prepare('DELETE FROM menu_items WHERE id=?').run(req.params.id);
    res.json({ message: 'Menu item deleted!' });
});

// ORDERS API

// View all orders
app.get('/api/orders', (req, res) => {
    const orders = db.prepare(`
        SELECT o.*, t.table_number
        FROM orders o
        LEFT JOIN tables_table t ON o.table_id = t.id
        ORDER BY o.created_at DESC
    `).all();

    // Get items for each order
    for (let order of orders) {
        order.items = db.prepare(`
            SELECT oi.*, m.name, m.price
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE oi.order_id = ?
        `).all(order.id);
    }

    res.json(orders);
});

// Place a new order
app.post('/api/orders', (req, res) => {
    const { table_id, items } = req.body;  // items = [{menu_item_id, quantity}, ...]

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Order must have at least one item.' });
    }

    // Calculate total
    let total = 0;
    for (let item of items) {
        const menuItem = db.prepare('SELECT price FROM menu_items WHERE id=?').get(item.menu_item_id);
        if (!menuItem) {
            return res.status(404).json({ error: `Menu item ${item.menu_item_id} not found.` });
        }
        total += menuItem.price * item.quantity;
    }

    // Create order
    const orderResult = db.prepare(
        'INSERT INTO orders (table_id, status, total_price) VALUES (?, ?, ?)'
    ).run(table_id || null, 'pending', total);

    const orderId = orderResult.lastInsertRowid;

    // Add order items
    for (let item of items) {
        db.prepare(
            'INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?)'
        ).run(orderId, item.menu_item_id, item.quantity);
    }

    // Update table status to reserved
    if (table_id) {
        db.prepare('UPDATE tables_table SET is_reserved=1 WHERE id=?').run(table_id);
    }

    res.json({ message: 'Order placed!', order_id: orderId, total: total });
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Use: ${validStatuses.join(', ')}` });
    }

    db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);

    // If cancelled, free the table
    if (status === 'cancelled') {
        const order = db.prepare('SELECT table_id FROM orders WHERE id=?').get(req.params.id);
        if (order && order.table_id) {
            db.prepare('UPDATE tables_table SET is_reserved=0 WHERE id=?').run(order.table_id);
        }
    }

    // If served, free the table
    if (status === 'served') {
        const order = db.prepare('SELECT table_id FROM orders WHERE id=?').get(req.params.id);
        if (order && order.table_id) {
            db.prepare('UPDATE tables_table SET is_reserved=0 WHERE id=?').run(order.table_id);
        }
    }

    res.json({ message: `Order status updated to: ${status}` });
});

// TABLES API

// View all tables
app.get('/api/tables', (req, res) => {
    const tables = db.prepare('SELECT * FROM tables_table ORDER BY table_number').all();
    res.json(tables);
});

// Add a table
app.post('/api/tables', (req, res) => {
    const { table_number, capacity } = req.body;

    if (!table_number || !capacity) {
        return res.status(400).json({ error: 'Table number and capacity are required.' });
    }

    try {
        db.prepare(
            'INSERT INTO tables_table (table_number, capacity) VALUES (?, ?)'
        ).run(table_number, capacity);
        res.json({ message: 'Table added!' });
    } catch (err) {
        res.status(400).json({ error: 'Table number already exists.' });
    }
});

// Check table availability
app.get('/api/tables/available', (req, res) => {
    const tables = db.prepare(
        'SELECT * FROM tables_table WHERE is_reserved=0 ORDER BY table_number'
    ).all();
    res.json(tables);
});

// RESERVATIONS API

// View all reservations
app.get('/api/reservations', (req, res) => {
    const reservations = db.prepare(`
        SELECT r.*, t.table_number, t.capacity
        FROM reservations r
        JOIN tables_table t ON r.table_id = t.id
        ORDER BY r.reservation_time DESC
    `).all();
    res.json(reservations);
});

// Make a reservation
app.post('/api/reservations', (req, res) => {
    const { table_id, customer_name, customer_phone, reservation_time, guests } = req.body;

    if (!table_id || !customer_name || !reservation_time || !guests) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if table is already reserved
    const table = db.prepare('SELECT * FROM tables_table WHERE id=?').get(table_id);
    if (!table) {
        return res.status(404).json({ error: 'Table not found.' });
    }
    if (table.is_reserved) {
        return res.status(400).json({ error: 'This table is already reserved.' });
    }
    if (guests > table.capacity) {
        return res.status(400).json({ error: `Table capacity is ${table.capacity}, but ${guests} guests.` });
    }

    db.prepare(`
        INSERT INTO reservations (table_id, customer_name, customer_phone, reservation_time, guests)
        VALUES (?, ?, ?, ?, ?)
    `).run(table_id, customer_name, customer_phone, reservation_time, guests);

    db.prepare('UPDATE tables_table SET is_reserved=1 WHERE id=?').run(table_id);

    res.json({ message: 'Reservation confirmed!' });
});

// Cancel a reservation
app.delete('/api/reservations/:id', (req, res) => {
    const reservation = db.prepare('SELECT * FROM reservations WHERE id=?').get(req.params.id);
    if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found.' });
    }

    db.prepare('DELETE FROM reservations WHERE id=?').run(req.params.id);
    db.prepare('UPDATE tables_table SET is_reserved=0 WHERE id=?').run(reservation.table_id);

    res.json({ message: 'Reservation cancelled.' });
});


// ==========================================
// INVENTORY API
// ==========================================

// View inventory
app.get('/api/inventory', (req, res) => {
    const items = db.prepare('SELECT * FROM inventory ORDER BY ingredient_name').all();
    res.json(items);
});

// Add or update inventory item
app.post('/api/inventory', (req, res) => {
    const { ingredient_name, quantity, unit } = req.body;

    if (!ingredient_name || quantity === undefined) {
        return res.status(400).json({ error: 'Name and quantity are required.' });
    }

    db.prepare(`
        INSERT INTO inventory (ingredient_name, quantity, unit) VALUES (?, ?, ?)
        ON CONFLICT(ingredient_name) DO UPDATE SET quantity=quantity+?
    `).run(ingredient_name, quantity, unit || 'units', quantity);

    res.json({ message: 'Inventory updated!' });
});

// Update stock
app.put('/api/inventory/:id', (req, res) => {
    const { quantity } = req.body;

    db.prepare('UPDATE inventory SET quantity=? WHERE id=?').run(quantity, req.params.id);

    // Check for low stock alerts
    const item = db.prepare('SELECT * FROM inventory WHERE id=?').get(req.params.id);
    if (item && item.quantity < 10) {
        return res.json({ message: 'Stock updated!', alert: `LOW STOCK: ${item.ingredient_name} (${item.quantity} ${item.unit} remaining)` });
    }

    res.json({ message: 'Stock updated!' });
});

// START SERVER

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Restaurant Management System running at http://localhost:${PORT}`);
    console.log('');
    console.log('API Endpoints:');
    console.log('  GET    /api/menu          - View menu');
    console.log('  POST   /api/menu          - Add menu item');
    console.log('  PUT    /api/menu/:id      - Update menu item');
    console.log('  DELETE /api/menu/:id      - Delete menu item');
    console.log('  GET    /api/orders        - View all orders');
    console.log('  POST   /api/orders        - Place order');
    console.log('  PUT    /api/orders/:id/status - Update order status');
    console.log('  GET    /api/tables        - View tables');
    console.log('  GET    /api/tables/available - Available tables');
    console.log('  POST   /api/tables        - Add table');
    console.log('  GET    /api/reservations  - View reservations');
    console.log('  POST   /api/reservations  - Make reservation');
    console.log('  DELETE /api/reservations/:id - Cancel reservation');
    console.log('  GET    /api/inventory     - View inventory');
    console.log('  POST   /api/inventory     - Add/update stock');
    console.log('  PUT    /api/inventory/:id - Update stock');
});