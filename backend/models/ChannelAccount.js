const mongoose = require('mongoose');

// Channel Account Schema for managing multiple accounts per platform
const channelAccountSchema = new mongoose.Schema({
  accountId: { type: String, required: true }, // External account ID (Facebook Page ID, Instagram Business Account ID, etc.)
  name: { type: String, required: true }, // Display name of the account
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'instagram', 'whatsapp', 'telegram', 'discord', 'line', 'web', 'other']
  },
  
  // Account details
  details: {
    displayName: String, // Public display name
    username: String, // Platform username (@handle)
    profilePicture: String, // Profile picture URL
    description: String, // Account description
    verified: { type: Boolean, default: false },
    followerCount: Number,
    category: String // Business category for business accounts
  },
  
  // Connection status
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'pending'],
    default: 'pending'
  },
  
  // Authentication/API details
  credentials: {
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
    permissions: [String], // List of granted permissions
    webhookUrl: String,
    webhookVerifyToken: String
  },
  
  // Settings specific to this account
  settings: {
    isActive: { type: Boolean, default: true },
    autoRespond: { type: Boolean, default: true },
    workingHours: {
      enabled: { type: Boolean, default: false },
      timezone: String,
      monday: { start: String, end: String, enabled: { type: Boolean, default: true } },
      tuesday: { start: String, end: String, enabled: { type: Boolean, default: true } },
      wednesday: { start: String, end: String, enabled: { type: Boolean, default: true } },
      thursday: { start: String, end: String, enabled: { type: Boolean, default: true } },
      friday: { start: String, end: String, enabled: { type: Boolean, default: true } },
      saturday: { start: String, end: String, enabled: { type: Boolean, default: false } },
      sunday: { start: String, end: String, enabled: { type: Boolean, default: false } }
    },
    responseDelay: { type: Number, default: 1000 }, // Delay in ms before responding
    maxMessagesPerUser: { type: Number, default: 100 }, // Rate limiting per user
    blockedUsers: [String], // List of blocked user IDs
    allowedUsers: [String], // Whitelist (if enabled)
    customGreeting: String,
    customFallback: String
  },
  
  // Bot assignment
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
  
  // Owner/Organization
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  
  // Analytics
  analytics: {
    totalConversations: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    satisfactionScore: { type: Number, default: 0 },
    lastActivity: Date
  },
  
  // Error tracking
  lastError: {
    message: String,
    code: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Flags
  isTest: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false }, // Default account for this platform
  
}, {
  timestamps: true,
  collection: 'channel_accounts'
});

// Indexes
channelAccountSchema.index({ platform: 1, userId: 1 });
channelAccountSchema.index({ accountId: 1, platform: 1 }, { unique: true });
channelAccountSchema.index({ botId: 1 });
channelAccountSchema.index({ status: 1 });
channelAccountSchema.index({ userId: 1, platform: 1 });

// Virtual for account identifier
channelAccountSchema.virtual('identifier').get(function() {
  return `${this.platform}_${this.accountId}`;
});

// Instance methods
channelAccountSchema.methods.updateAnalytics = function(metrics) {
  this.analytics = {
    ...this.analytics.toObject(),
    ...metrics,
    lastActivity: new Date()
  };
};

channelAccountSchema.methods.setError = function(error) {
  this.lastError = {
    message: error.message,
    code: error.code || 'UNKNOWN',
    timestamp: new Date(),
    details: error.details || null
  };
  this.status = 'error';
};

channelAccountSchema.methods.clearError = function() {
  this.lastError = undefined;
  this.status = 'connected';
};

channelAccountSchema.methods.isWithinWorkingHours = function() {
  if (!this.settings.workingHours.enabled) return true;
  
  const now = new Date();
  const timezone = this.settings.workingHours.timezone || 'UTC';
  const dayName = now.toLocaleDateString('en', { weekday: 'long', timeZone: timezone }).toLowerCase();
  const daySettings = this.settings.workingHours[dayName];
  
  if (!daySettings || !daySettings.enabled) return false;
  
  const currentTime = now.toLocaleTimeString('en-GB', { 
    hour12: false, 
    timeZone: timezone 
  }).substring(0, 5);
  
  return currentTime >= daySettings.start && currentTime <= daySettings.end;
};

// Static methods
channelAccountSchema.statics.findByPlatform = function(platform, userId) {
  return this.find({ 
    platform, 
    userId, 
    status: { $ne: 'disconnected' } 
  }).populate('botId', 'name status');
};

channelAccountSchema.statics.findActiveAccounts = function(userId) {
  return this.find({ 
    userId, 
    status: 'connected',
    'settings.isActive': true 
  }).populate('botId', 'name status');
};

channelAccountSchema.statics.getAccountByIdentifier = function(identifier) {
  const [platform, accountId] = identifier.split('_', 2);
  return this.findOne({ platform, accountId });
};

module.exports = mongoose.model('ChannelAccount', channelAccountSchema);