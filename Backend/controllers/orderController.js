const Order = require('../model/Order');

const getOrderById = async(req, res) => {
    try{
        const orders = await Order.find({ user: req.user._id }).populate('items.productId', 'name price')
        res.json(orders)
    }
    catch(err) {
        res.status(500).json({ message: 'Error fetching orders', err });
    }
}

const getOrders = async(req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email')
            .populate('items.productId', 'name')
            .sort({ createdAt: -1 });
        res.json(orders);
    }
    catch(err) {
        res.status(500).json({ message: 'Error fetching orders ', err })
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'shipped', 'delivered'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const order = await Order.findById(req.params.id);
        if(order) {
            order.status = status;
            await order.save();
            res.json({ message: 'Order status updated', order })
        }
        else {
            res.status(404).json({message: 'Order not found'})
        }
    }
    catch(err) {
        res.status(500).json({message: 'error uploading order status', err})
    }
}

module.exports = {
    getOrderById,
    getOrders,
    updateOrderStatus
}