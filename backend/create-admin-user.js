const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatbot_ai');

async function createAdminUser() {
  try {
    console.log('🔍 Checking for existing admin user...');

    // Check if admin user already exists
    let admin = await User.findOne({
      email: 'admin@chatbot.ai'
    });

    if (admin) {
      console.log('✅ Admin user already exists:', admin.email);
      console.log('🔍 Current role:', admin.role);

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
      console.log('✅ Updated existing admin user with marketing permissions');
    } else {
      console.log('📝 Creating new admin user...');

      // Create new admin user
      admin = new User({
        email: 'admin@chatbot.ai',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        profile: {
          firstName: 'System',
          lastName: 'Administrator'
        },
        permissions: {
          marketing: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            send: true,
            analytics: true
          }
        }
      });

      await admin.save();
      console.log('✅ Created new admin user with marketing permissions');
    }

    console.log('🔍 Final admin user details:');
    console.log('  - Email:', admin.email);
    console.log('  - Role:', admin.role);
    console.log('  - Status:', admin.status);
    console.log('  - Marketing permissions:', admin.permissions?.marketing);

  } catch (error) {
    console.error('❌ Error creating/updating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();