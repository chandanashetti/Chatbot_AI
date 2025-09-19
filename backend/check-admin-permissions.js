const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatbot_ai');

async function checkAdminPermissions() {
  try {
    console.log('🔍 Checking admin user permissions...');

    // Find the admin user
    const admin = await User.findOne({
      email: 'admin@chatbot.ai'
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Found admin user:', admin.email);
    console.log('🔍 Role:', admin.role);
    console.log('🔍 User-specific permissions:', JSON.stringify(admin.permissions, null, 2));
    console.log('🔍 Role permissions:', JSON.stringify(admin.getRolePermissions(), null, 2));
    console.log('🔍 Effective permissions:', JSON.stringify(admin.getEffectivePermissions(), null, 2));

  } catch (error) {
    console.error('❌ Error checking admin permissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdminPermissions();