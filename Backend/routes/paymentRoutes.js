const express = require("express");
const { createdOrder, verifyPayment } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-order", protect, createdOrder);
router.post("/capture-order", protect, verifyPayment);

module.exports = router;