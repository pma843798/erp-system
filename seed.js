const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const adminExists = await User.findOne({ email: 'admin@erp.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@erp.com',
        password: '123456',
        role: 'admin',
      });
      console.log('Admin user created');
    } else {
      console.log('Admin already exists');
    }
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();