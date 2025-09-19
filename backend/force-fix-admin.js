const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatbot_ai');

async function forceFixAdmin() {
  try {
    console.log('🔧 Force fixing admin user marketing permissions...');

    // Find the admin user
    const admin = await User.findOne({
      email: 'admin@chatbot.ai'
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Found admin user:', admin.email);

    // Set marketing permissions to undefined so role permissions take effect
    admin.permissions.marketing = undefined;

    // Mark the permissions field as modified
    admin.markModified('permissions');

    await admin.save();

    console.log('✅ Set marketing permissions to undefined');

    // Check the result
    const updatedAdmin = await User.findOne({ email: 'admin@chatbot.ai' });
    console.log('🔍 Updated user-specific permissions:', updatedAdmin.permissions?.marketing);
    console.log('🔍 Updated effective permissions:', updatedAdmin.getEffectivePermissions().marketing);

  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

forceFixAdmin();