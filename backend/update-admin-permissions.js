const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatbot_ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateAdminPermissions() {
  try {
    console.log('🔍 Looking for admin user...');

    // Find the admin user
    const admin = await User.findOne({
      email: 'admin@chatbot.ai'
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Found admin user:', admin.email);
    console.log('🔍 Current role:', admin.role);
    console.log('🔍 Current permissions:', admin.permissions);

    // Update permissions to include marketing
    if (!admin.permissions) {
      admin.permissions = {};
    }

    admin.permissions.marketing = {
      view: true,
      create: true,
      edit: true,
      delete: true,
      send: true,
      analytics: true
    };

    await admin.save();

    console.log('✅ Updated admin permissions with marketing access');
    console.log('🔍 New permissions:', admin.permissions);

  } catch (error) {
    console.error('❌ Error updating admin permissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateAdminPermissions();