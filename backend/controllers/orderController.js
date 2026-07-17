const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const PAYMENT_METHODS = {
  "cash on delivery": "Cash on Delivery",
  "scan & pay": "Scan & Pay",
};

const ALLOWED_PAYMENT_METHODS = Object.values(PAYMENT_METHODS);

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      address,
      amount,
      paymentMethod,
      paymentStatus,
      transactionId,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "No items in order" });
    }

    const normalizedMethodKey = String(paymentMethod || "").trim().toLowerCase();
    const normalizedPaymentMethod = PAYMENT_METHODS[normalizedMethodKey] || String(paymentMethod || "").trim();

    if (!ALLOWED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        message: `Invalid payment method: ${paymentMethod}. Allowed values: ${ALLOWED_PAYMENT_METHODS.join(", ")}`,
      });
    }

    if (normalizedPaymentMethod === "Scan & Pay" && !transactionId) {
      return res.status(400).json({ message: "Transaction ID is required for Scan & Pay" });
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      address,
      amount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus,
      transactionId: transactionId || null,
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message, errors: err.errors });
    }
    res.status(500).json({ message: "Failed to place order" });
  }
};

// GET /api/orders/my-orders  (logged-in user's own orders)
exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("myOrders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// GET /api/orders/admin  (admin: view all orders, to manually verify Scan & Pay transactions)
exports.getAllOrdersForAdmin = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email phone").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("getAllOrdersForAdmin error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// PATCH /api/orders/:id/verify  (admin marks payment as verified after checking bank/UPI statement)
exports.verifyPayment = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "Verified" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("verifyPayment error:", err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};
// GET /api/admin/summary  (admin dashboard stats)
exports.summary = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const orders = await Order.find();
    const today = orders.filter((o) => o.createdAt >= start);

    res.json({
      todayTotalOrders: today.length,
      totalIncome: orders.reduce((s, o) => s + (o.amount || 0), 0),
      totalProducts: await Product.countDocuments(),
      totalUsers: await User.countDocuments(),
      pendingOrders: orders.filter((o) => !["Delivered", "Cancelled"].includes(o.orderStatus)).length,
      deliveredOrders: orders.filter((o) => o.orderStatus === "Delivered").length,
      cancelledOrders: orders.filter((o) => o.orderStatus === "Cancelled").length,
    });
  } catch (err) {
    console.error("summary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};
// DELETE /api/admin/orders/:id  (admin: delete a test/dummy order)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("deleteOrder error:", err);
    res.status(500).json({ message: "Failed to delete order" });
  }
};