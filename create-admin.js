const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DB_PATH = "mongodb+srv://root:root@nandeesh.3tbg3gi.mongodb.net/?appName=Nandeesh";

const User = require('./models/user');

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(DB_PATH);
    console.log('✓ Connected to MongoDB');

    // First delete any existing admin with this email
    const existing = await User.findOne({ email: 'admin@admin.com' });
    if (existing) {
      console.log('Removing existing admin account...');
      await User.deleteOne({ email: 'admin@admin.com' });
      console.log('✓ Removed existing admin');
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash('root', 12);
    console.log('✓ Password hashed');

    // Create admin user
    console.log('Creating new admin user...');
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@admin.com',
      phoneNumber: '9999999999',
      password: hashedPassword,
      userType: 'admin'
    });

    await admin.save();
    console.log('\n✓ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@admin.com');
    console.log('Password: root');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
