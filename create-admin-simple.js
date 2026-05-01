const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://root:root@nandeesh.3tbg3gi.mongodb.net/?appName=Nandeesh', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✓ Connected\n');

    // Get the User model
    const User = require('./models/user');

    // Delete existing admin
    console.log('🗑️  Removing old admin account...');
    await User.deleteMany({ email: 'admin@admin.com' });
    console.log('✓ Done\n');

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('root', 12);
    console.log('✓ Done\n');

    // Insert directly
    console.log('📝 Creating admin user...');
    const result = await User.collection.insertOne({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@admin.com',
      phoneNumber: '9999999999',
      password: hashedPassword,
      userType: 'admin'
    });
    console.log('✓ Created with ID:', result.insertedId, '\n');

    // Verify
    console.log('✔️ Verifying...');
    const admin = await User.findOne({ email: 'admin@admin.com' });
    if (admin) {
      console.log('✓ Admin verified in database');
      console.log('  Email:', admin.email);
      console.log('  Name:', admin.firstName, admin.lastName);
      console.log('  Type:', admin.userType, '\n');

      // Test password
      const passwordTest = await bcrypt.compare('root', admin.password);
      console.log('  Password test:', passwordTest ? '✓ WORKS' : '✗ FAILS', '\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ ADMIN CREATED SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@admin.com');
    console.log('Password: root');
    console.log('URL:      http://localhost:5001/admin/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    console.log('✓ Disconnected\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR:');
    console.error(err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  }
}

main();
