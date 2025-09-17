const mongoose = require('mongoose');
const User = require('./models/User');

async function testAuth() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chatbot_ai');

    console.log('🔍 Testing user auth query...');

    // Test the same query that auth middleware uses
    const user = await User.findById('68c9c524a2ba4db8c018a590')
      .select('email role status isDeleted profile permissions +security');

    if (user) {
      console.log('✅ User found:');
      console.log('- ID:', user._id);
      console.log('- Email:', user.email);
      console.log('- Status:', user.status);
      console.log('- IsDeleted:', user.isDeleted);
      console.log('- Status check (active):', user.status === 'active');
    } else {
      console.log('❌ User NOT found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAuth();