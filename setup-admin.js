const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

const DB_PATH = "mongodb+srv://root:root@nandeesh.3tbg3gi.mongodb.net/?appName=Nandeesh";

async function setupAdmin() {
  try {
    console.log('\n📌 Connecting to MongoDB...');
    await mongoose.connect(DB_PATH);
    console.log('✓ Connected\n');

    // Check existing admin
    console.log('📌 Checking for existing admin...');
    let admin = await User.findOne({ email: 'admin@admin.com' });
    
    if (admin) {
      console.log('✓ Admin user exists');
      console.log('  Email:', admin.email);
      console.log('  Name:', admin.firstName, admin.lastName);
      console.log('  Type:', admin.userType);
      console.log('\n📌 Deleting old admin...');
      await User.deleteOne({ email: 'admin@admin.com' });
      console.log('✓ Deleted\n');
    } else {
      console.log('✓ No existing admin found\n');
    }

    // Create new admin
    console.log('📌 Creating new admin account...');
    const password = 'root';
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✓ Password hashed with 12 rounds\n');

    const newAdmin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@admin.com',
      phoneNumber: '9999999999',
      password: hashedPassword,
      userType: 'admin'
    });

    await newAdmin.save();
    console.log('✓ Admin account created\n');

    // Verify the hashed password
    console.log('📌 Verifying password hash...');
    const savedAdmin = await User.findOne({ email: 'admin@admin.com' });
    const passwordMatch = await bcrypt.compare(password, savedAdmin.password);
    console.log('✓ Password verification:', passwordMatch ? 'SUCCESS ✓' : 'FAILED ✗\n');

    // Show credentials
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ ADMIN ACCOUNT READY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@admin.com');
    console.log('Password: root');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔗 Login URL: http://localhost:5001/admin/login\n');

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
    process.exit(0);

  } catch (err) {
    console.error('\n✗ ERROR:', err.message);
    console.error(err);
    process.exit(1);
  }
}

setupAdmin();
