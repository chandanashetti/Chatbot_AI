const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');

async function fixSuperAdminPermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chatbot_ai');
    console.log('🔗 Connected to MongoDB');

    // Check the Super Administrator role
    const superAdminRole = await Role.findOne({ name: 'Super Administrator' });
    console.log('\n📋 Super Administrator Role Permissions:');
    console.log(JSON.stringify(superAdminRole.permissions, null, 2));

    // Check the Super Administrator user
    const superAdminUser = await User.findOne({ email: 'superadmin@test.com' });
    console.log('\n👤 Super Administrator User Permissions:');
    console.log(JSON.stringify(superAdminUser.permissions, null, 2));

    // Fix the user permissions by re-validating from role
    console.log('\n🔧 Refreshing Super Administrator permissions...');
    await superAdminUser.validateAndSetRolePermissions();
    await superAdminUser.save();

    console.log('\n✅ Updated Super Administrator User Permissions:');
    const updatedUser = await User.findOne({ email: 'superadmin@test.com' });
    console.log(JSON.stringify(updatedUser.permissions, null, 2));

    // Test all other users too
    console.log('\n🔧 Refreshing all user permissions...');
    const allUsers = await User.find({});

    for (const user of allUsers) {
      console.log(`Updating ${user.email}...`);
      await user.validateAndSetRolePermissions();
      await user.save();
    }

    console.log('\n✅ All user permissions updated');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixSuperAdminPermissions();