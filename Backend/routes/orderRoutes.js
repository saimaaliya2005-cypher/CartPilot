const express = require("express");
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const { getOrders, getOrderById, updateOrderStatus } = require("../controllers/orderController");

const router = express.Router();

router.route('/').get(protect, admin, getOrders);
router.route('/myorders').get(protect, getOrderById);
router.route('/:id/status').put(protect, admin, updateOrderStatus);


module.exports = router;