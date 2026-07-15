const r = require('express').Router();
const c = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Place a new order (Cash on Delivery / Scan & Pay)
r.post('/', protect, c.createOrder);

// Logged-in user's own orders
r.get('/my-orders', protect, c.myOrders);

// Admin: view all orders (to manually verify Scan & Pay transactions)
r.get('/admin', protect, c.getAllOrdersForAdmin);

// Admin: mark a payment as verified after checking bank/UPI statement
r.patch('/:id/verify', protect, c.verifyPayment);

module.exports = r;