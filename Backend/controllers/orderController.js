const Order = require('../model/Order');

const sendEmail = require('../utils/sendEmail');

//Create a new Order
const createOrder = async (req, res) => {
    const { items, totalAmount, address } = req.body;
    try {
        const { items, totalAmount, address, paymentId } = req.body;

        if(!items || items.length === 0 || !totalAmount || !address) {
            return res.status(400).json({ message: 'Invalid order data'})
        }

        else {
            const order = new Order ({
                user: req.user._id,
                items,
                totalAmount,
                address,
                paymentId
            });
            await order.save();
            const message = `Dear ${req.user.name}, \n\nThank you for your order! Your order has been successfully created with the following details:\n\nOrder ID: ${order._id}\n Total Amount: ${totalAmount}\nShipping Address: ${address}\n\nWe will notify you once your order is shipped.\n\nBest regards, \nCartPilot Team`;
            await sendEmail(req.user.email, 'Order created', message)
            res.status(201).json({ message: 'Order created successfully ', order })
        }
    }

    catch(err) {
        res.status(500).json({ message: 'Error creating order', err })
    }
}

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
        const orders = await Order.find({}).populate('user', 'name email');
        res.json(orders);
    }
    catch(err) {
        res.status(500).json({ message: 'Error fetching orders ', err })
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
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
    createOrder,
    getOrderById,
    getOrders,
    updateOrderStatus
}