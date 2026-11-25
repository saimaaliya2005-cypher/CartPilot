const jwt = require('jsonwebtoken');
const User = require('../model/User');

const protect = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorised, no token' });
    }

    let user;
    try {
        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        user = await User.findById(decoded.id).select('-password');
    }
    catch (err) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // token was valid but the account no longer exists
    if (!user) {
        return res.status(401).json({ message: 'Not authorised, user not found' });
    }

    req.user = user;
    next();
};


module.exports = { protect }
