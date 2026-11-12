const Order = require("../model/Order");
const User = require("../model/User");
const Product = require("../model/Product");

const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});

    const orders = await Order.find({});

    const totalRevenue = orders.reduce((acc, order) => {
      return acc + (order.totalAmount || 0);
    }, 0);

    res.status(200).json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching stats",
      error: error.message,
    });
  }
};

module.exports = { getAdminStats };