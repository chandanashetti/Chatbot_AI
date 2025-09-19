const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatbot_ai');

async function fixAdminPermissions() {
  try {
    console.log('🔧 Fixing admin user marketing permissions...');

    // Find the admin user
    const admin = await User.findOne({
      email: 'admin@chatbot.ai'
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Found admin user:', admin.email);
    console.log('🔍 Current marketing permissions:', admin.permissions?.marketing);

    // Remove user-specific marketing permissions so role permissions take effect
    if (admin.permissions && admin.permissions.marketing) {
      delete admin.permissions.marketing;

      // Mark the permissions field as modified
      admin.markModified('permissions');

      await admin.save();

      console.log('✅ Removed user-specific marketing permissions');
    } else {
      console.log('ℹ️ No user-specific marketing permissions found');
    }

    console.log('🔍 New effective permissions:', JSON.stringify(admin.getEffectivePermissions().marketing, null, 2));

  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAdminPermissions();