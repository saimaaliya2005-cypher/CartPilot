const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d'})
};


//register a new user
const registerUser = async(req, res) => {
    const { name, email, password} = req.body;
    try{
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ message : 'User already exists' })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({name, email, password:hashedPassword });
        if(user) {
            const otp = Math.floor(10000 + Math.random() * 9000).toString();

            const message = `
            Welcome to CartPilot, ${name}! Thankyou for registering with us. We are excited to have you as part 
            of our community. To complete our registration, please use the following One-Time Password (OTP):
            Your OTP for CartPilot registration is : ${otp}`

            await sendEmail(email, 'Welcome to CartPilot -Your OTP for registration', message);

            res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });

    }
    else {
        res.status(400).json({ message: 'Server error' })
    }
}
    catch(err) {
         console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
}


// Login user
const loginUser = async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if( user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            })
        }
        else {
            res.status(400).json({ message: 'Invalid email or password '});
        }
    }
    catch(err) {
        res.status(500).json({ message: 'Server error '});
    }
}

const getUsers = async(req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    }
    catch(err) {
        res.status(500).json({ message: 'Server error '});
    }
}

module.exports = {
    registerUser,
    loginUser,
    getUsers
}