require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./model/User');
const bcrypt = require('bcryptjs');

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    // Do not create duplicate admin accounts
    const exists = await User.findOne({ email: 'admin@example.com' });
    if (exists) {
      console.log('Admin already exists');
      process.exit();
    }

    const admin = new User({
      name: 'Admin',
      email: 'admin@example.com',
      password: bcrypt.hashSync('admin123', 10), // plain password = admin123
      role: 'admin',
      verified: true,
    });

    await admin.save();
    console.log('✅ Admin user created (admin@example.com / admin123)');
    process.exit();
  })
  .catch((e) => {
    console.error('❌ DB error', e);
    process.exit(1);
  });
