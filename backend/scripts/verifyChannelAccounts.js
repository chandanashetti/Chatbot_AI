const mongoose = require('mongoose');
require('dotenv').config();

const ChannelAccount = require('../models/ChannelAccount');
const Bot = require('../models/Bot');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot_ai';

async function verifyChannelAccounts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const accounts = await ChannelAccount.find({})
      .populate('botId', 'name')
      .populate('userId', 'email')
      .sort({ platform: 1, name: 1 });

    console.log(`\n📊 Found ${accounts.length} channel accounts:`);

    if (accounts.length === 0) {
      console.log('❌ No channel accounts found!');
      return;
    }

    // Group by platform
    const byPlatform = accounts.reduce((acc, account) => {
      if (!acc[account.platform]) acc[account.platform] = [];
      acc[account.platform].push(account);
      return acc;
    }, {});

    Object.keys(byPlatform).forEach(platform => {
      console.log(`\n📱 ${platform.toUpperCase()} (${byPlatform[platform].length} accounts):`);
      byPlatform[platform].forEach(account => {
        console.log(`  • ${account.name} (${account.accountId})`);
        console.log(`    Status: ${account.status}, Verified: ${account.details.verified || false}`);
        console.log(`    Followers: ${account.details.followerCount || 'N/A'}`);
        console.log(`    Username: ${account.details.username || 'N/A'}`);
        console.log(`    Bot: ${account.botId?.name || account.botId || 'N/A'}`);
        console.log(`    User: ${account.userId?.email || account.userId || 'N/A'}`);
      });
    });

    console.log('\n✅ Channel accounts verification complete!');

  } catch (error) {
    console.error('❌ Error verifying channel accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

verifyChannelAccounts();