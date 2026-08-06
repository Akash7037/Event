const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

const seedAdmin = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pitch_competition';
    await mongoose.connect(connStr);
    console.log('[Seed] Connected to MongoDB...');

    const existingAdmin = await Admin.findOne({
      $or: [{ username: 'admin' }, { email: 'admin@ecell.edu' }]
    });

    if (existingAdmin) {
      console.log('[Seed] Admin user already exists:', existingAdmin.email);
    } else {
      const admin = await Admin.create({
        username: 'admin',
        email: 'admin@ecell.edu',
        password: 'admin123'
      });
      console.log('====================================================');
      console.log('[Seed] Default Admin Created Successfully!');
      console.log('Username: admin');
      console.log('Email:    admin@ecell.edu');
      console.log('Password: admin123');
      console.log('====================================================');
    }
  } catch (error) {
    console.error('[Seed Error]', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Seed] MongoDB Disconnected.');
  }
};

seedAdmin();
