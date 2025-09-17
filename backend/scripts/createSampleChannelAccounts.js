const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ChannelAccount = require('../models/ChannelAccount');
const Bot = require('../models/Bot');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot_ai';

async function createSampleChannelAccounts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a user and bot to associate with accounts
    const user = await User.findOne({ role: { $in: ['admin', 'superadmin', 'superadministrator'] } });
    const bot = await Bot.findOne({});

    if (!user) {
      console.error('❌ No admin user found. Please create a user first.');
      return;
    }

    if (!bot) {
      console.error('❌ No bot found. Please create a bot first.');
      return;
    }

    console.log(`📝 Using user: ${user.email} and bot: ${bot.name || bot._id}`);

    // Sample Facebook accounts
    const facebookAccounts = [
      {
        accountId: 'page_123456789',
        name: 'TechCorp Official',
        platform: 'facebook',
        details: {
          displayName: 'TechCorp',
          username: '@techcorp',
          verified: true,
          followerCount: 15420,
          category: 'Technology Company'
        },
        status: 'connected',
        settings: { isActive: true },
        analytics: { totalConversations: 450, totalMessages: 1240, lastActivity: new Date() },
        botId: bot._id,
        userId: user._id
      },
      {
        accountId: 'page_987654321',
        name: 'TechCorp Support',
        platform: 'facebook',
        details: {
          displayName: 'TechCorp Support',
          username: '@techcorp_support',
          verified: false,
          followerCount: 8320,
          category: 'Customer Service'
        },
        status: 'connected',
        settings: { isActive: true },
        analytics: { totalConversations: 280, totalMessages: 890, lastActivity: new Date() },
        botId: bot._id,
        userId: user._id
      },
      {
        accountId: 'page_555666777',
        name: 'TechCorp Marketing',
        platform: 'facebook',
        details: {
          displayName: 'TechCorp Marketing',
          username: '@techcorp_marketing',
          verified: true,
          followerCount: 22100,
          category: 'Marketing Agency'
        },
        status: 'connected',
        settings: { isActive: true },
        analytics: { totalConversations: 320, totalMessages: 980, lastActivity: new Date() },
        botId: bot._id,
        userId: user._id
      },
      {
        accountId: 'page_111222333',
        name: 'TechCorp Sales',
        platform: 'facebook',
        details: {
          displayName: 'TechCorp Sales',
          username: '@techcorp_sales',
          verified: false,
          followerCount: 12500,
          category: 'Sales'
        },
        status: 'connected',
        settings: { isActive: true },
        analytics: { totalConversations: 180, totalMessages: 650, lastActivity: new Date() },
        botId: bot._id,
        userId: user._id
      }
    ];

    // Sample Instagram accounts
    const instagramAccounts = [
      {
        accountId: 'ig_111222333',
        name: 'TechCorp',
        platform: 'instagram',
        details: {
          displayName: 'TechCorp',
          username: '@techcorp_official',
          verified: true,
          followerCount: 25800,
          category: 'Technology Company'
        },
        status: 'connected',
        settings: { isActive: true },
        analytics: { totalConversations: 320, totalMessages: 756, lastActivity: new Date() },
        botId: bot._id,
        userId: user._id
      },
      {
        accountId: 'ig_444555666',
        name: 'TechCorp Lifestyle',
        platform: 'instagram',
        details: {
          displayName: 'TechCorp Lifestyle',
          username: '@techcorp_lifestyle',
          verified: false,
          followerCount: 18200,
          category: 'Lifestyle'
        },
        status: 'connected',
        settings: { isActive: true },
        analytics: { totalConversations: 220, totalMessages: 540, lastActivity: new Date() },
        botId: bot._id,
        userId: user._id
      }
    ];

    // Sample WhatsApp accounts
    const whatsappAccounts = [
      {
        accountId: 'wa_business_456',
        name: 'TechCorp WhatsApp',
        platform: 'whatsapp',
        details: {
          displayName: 'TechCorp Business',
          verified: true,
          category: 'Business'
        },
        status: 'connected',
        settings: { isActive: true },
        analytics: { totalConversations: 180, totalMessages: 520, lastActivity: new Date() },
        botId: bot._id,
        userId: user._id
      }
    ];

    // Sample Discord accounts
    const discordAccounts = [
      {
        accountId: 'discord_789012345',
        name: 'TechCorp Community Server',
        platform: 'discord',
        details: {
          displayName: 'TechCorp Community',
          verified: false,
          followerCount: 5600, // member count
          category: 'Gaming/Tech Community'
        },
        status: 'connected',
        settings: { isActive: true },
        analytics: { totalConversations: 890, totalMessages: 2340, lastActivity: new Date() },
        botId: bot._id,
        userId: user._id
      }
    ];

    const allAccounts = [
      ...facebookAccounts,
      ...instagramAccounts,
      ...whatsappAccounts,
      ...discordAccounts
    ];

    console.log(`📦 Creating ${allAccounts.length} sample channel accounts...`);

    // Clear existing accounts first
    await ChannelAccount.deleteMany({});
    console.log('🗑️ Cleared existing channel accounts');

    // Insert new accounts
    const createdAccounts = await ChannelAccount.insertMany(allAccounts);
    console.log(`✅ Created ${createdAccounts.length} channel accounts successfully!`);

    // Display summary
    const summary = {
      facebook: createdAccounts.filter(a => a.platform === 'facebook').length,
      instagram: createdAccounts.filter(a => a.platform === 'instagram').length,
      whatsapp: createdAccounts.filter(a => a.platform === 'whatsapp').length,
      discord: createdAccounts.filter(a => a.platform === 'discord').length
    };

    console.log('📊 Account summary:');
    console.log(`   Facebook: ${summary.facebook} accounts`);
    console.log(`   Instagram: ${summary.instagram} accounts`);
    console.log(`   WhatsApp: ${summary.whatsapp} accounts`);
    console.log(`   Discord: ${summary.discord} accounts`);

    console.log('\n🎉 Sample channel accounts created successfully!');
    console.log('💡 Now the Chat Review page should show the multiple account view functionality.');

  } catch (error) {
    console.error('❌ Error creating sample channel accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSampleChannelAccounts();