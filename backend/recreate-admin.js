const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatbot_ai');

async function recreateAdmin() {
  try {
    console.log('🔧 Recreating admin user with correct permissions...');

    // Delete existing admin user
    await User.deleteOne({ email: 'admin@chatbot.ai' });
    console.log('🗑️ Deleted existing admin user');

    // Create new admin user
    const admin = new User({
      email: 'admin@chatbot.ai',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      profile: {
        firstName: 'System',
        lastName: 'Administrator'
      }
    });

    await admin.save();
    console.log('✅ Created new admin user');

    // Check the result
    const newAdmin = await User.findOne({ email: 'admin@chatbot.ai' });
    console.log('🔍 New user role:', newAdmin.role);
    console.log('🔍 New user marketing permissions:', newAdmin.permissions?.marketing);
    console.log('🔍 New effective marketing permissions:', newAdmin.getEffectivePermissions().marketing);

  } catch (error) {
    console.error('❌ Error recreating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

recreateAdmin();