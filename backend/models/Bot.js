const mongoose = require('mongoose');

// Bot Node Schema - represents individual nodes in the conversation flow
const botNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['message', 'question', 'condition', 'action', 'webhook', 'handoff']
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  data: {
    title: { type: String, required: true },
    content: { type: String },
    options: [String], // For question nodes
    conditions: [{
      field: String,
      operator: { type: String, enum: ['equals', 'contains', 'greater', 'less'] },
      value: String,
      nextNode: String
    }], // For condition nodes
    webhook: {
      url: String,
      method: { type: String, enum: ['GET', 'POST'], default: 'POST' },
      headers: mongoose.Schema.Types.Mixed,
      body: mongoose.Schema.Types.Mixed
    }, // For webhook nodes
    variables: [String], // Variables to collect/store
    metadata: mongoose.Schema.Types.Mixed // Additional node-specific data
  }
}, { _id: false });

// Bot Connection Schema - represents connections between nodes
const botConnectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: String,
  targetHandle: String,
  condition: String, // Optional condition for the connection
  label: String // Optional label for the connection
}, { _id: false });

// Bot Flow Schema - represents the complete conversation flow
const botFlowSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  nodes: [botNodeSchema],
  connections: [botConnectionSchema],
  version: { type: String, default: '1.0.0' },
  isActive: { type: Boolean, default: true }
}, { _id: false });

// Bot Settings Schema
const botSettingsSchema = new mongoose.Schema({
  personality: {
    tone: { type: String, enum: ['friendly', 'professional', 'casual', 'formal'], default: 'friendly' },
    style: { type: String, enum: ['conversational', 'direct', 'helpful', 'empathetic'], default: 'conversational' },
    language: { type: String, default: 'en' }
  },
  behavior: {
    responseDelay: { type: Number, default: 1000 }, // milliseconds
    typingIndicator: { type: Boolean, default: true },
    fallbackMessage: { type: String, default: "I didn't understand that. Can you rephrase?" },
    maxRetries: { type: Number, default: 3 },
    handoffTriggers: { type: [String], default: ['human', 'agent', 'speak to someone'] },
    sessionTimeout: { type: Number, default: 1800000 } // 30 minutes in milliseconds
  },
  appearance: {
    avatar: String,
    name: String,
    welcomeMessage: { type: String, default: 'Hello! How can I help you today?' },
    theme: {
      primaryColor: { type: String, default: '#3B82F6' },
      backgroundColor: { type: String, default: '#FFFFFF' },
      textColor: { type: String, default: '#1F2937' },
      borderRadius: { type: String, default: '12px' },
      fontFamily: { type: String, default: 'Inter, sans-serif' }
    },
    position: { type: String, enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'], default: 'bottom-right' },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' }
  },
  integrations: {
    platforms: { type: [String], default: ['website'] },
    webhooks: [{
      name: String,
      url: String,
      events: [String], // Events that trigger the webhook
      headers: mongoose.Schema.Types.Mixed
    }],
    crm: {
      enabled: { type: Boolean, default: false },
      provider: String,
      apiKey: String,
      settings: mongoose.Schema.Types.Mixed
    },
    analytics: {
      googleAnalytics: String,
      customEvents: { type: Boolean, default: false }
    }
  },
  ai: {
    provider: { type: String, enum: ['openai', 'ollama'], default: 'openai' },
    model: { type: String, default: 'gpt-3.5-turbo' },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 1000 },
    useRAG: { type: Boolean, default: true },
    ragSettings: {
      topK: { type: Number, default: 5 },
      scoreThreshold: { type: Number, default: 0.7 }
    }
  }
}, { _id: false });

// Bot Analytics Schema
const botAnalyticsSchema = new mongoose.Schema({
  totalConversations: { type: Number, default: 0 },
  activeConversations: { type: Number, default: 0 },
  completedConversations: { type: Number, default: 0 },
  averageSessionDuration: { type: Number, default: 0 }, // in seconds
  totalMessages: { type: Number, default: 0 },
  averageMessagesPerSession: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 }, // percentage
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 }, // for lead generation bots
  lastActivity: { type: Date, default: Date.now },
  dailyStats: [{
    date: { type: Date, required: true },
    conversations: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  }]
}, { _id: false });

// Main Bot Schema
const botSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { 
    type: String, 
    required: true,
    enum: ['lead_generation', 'customer_support', 'sales', 'faq', 'booking', 'survey', 'custom'],
    default: 'custom'
  },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'inactive', 'archived'], 
    default: 'draft' 
  },
  flow: { type: botFlowSchema, required: true },
  settings: { type: botSettingsSchema, default: () => ({}) },
  analytics: { type: botAnalyticsSchema, default: () => ({}) },
  
  // Metadata
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'BotTemplate' },
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  version: { type: String, default: '1.0.0' },
  
  // Access and ownership
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who can edit this bot
  
  // Deployment
  deployment: {
    isDeployed: { type: Boolean, default: false },
    deployedAt: Date,
    domains: [String], // Allowed domains for the widget
    widgetId: { type: String, unique: true, sparse: true }, // Unique ID for the widget
    apiKey: String, // API key for the widget
    embedCode: String, // Generated embed code
    customCSS: String // Custom CSS for the widget
  },
  
  // Performance and limits
  limits: {
    maxConversationsPerDay: { type: Number, default: 1000 },
    maxMessagesPerConversation: { type: Number, default: 100 },
    rateLimitPerMinute: { type: Number, default: 60 }
  },
  
  // Backup and versioning
  previousVersions: [{
    version: String,
    flow: botFlowSchema,
    settings: botSettingsSchema,
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, {
  timestamps: true,
  collection: 'bots'
});

// Indexes for performance
botSchema.index({ createdBy: 1 });
botSchema.index({ status: 1 });
botSchema.index({ type: 1 });
botSchema.index({ isPublished: 1 });
botSchema.index({ 'deployment.widgetId': 1 });
botSchema.index({ 'deployment.domains': 1 });
botSchema.index({ createdAt: -1 });

// Pre-save middleware to generate widget ID and API key
botSchema.pre('save', function(next) {
  if (this.isNew || (this.isModified('isPublished') && this.isPublished)) {
    if (!this.deployment.widgetId) {
      this.deployment.widgetId = require('crypto').randomBytes(16).toString('hex');
    }
    if (!this.deployment.apiKey) {
      this.deployment.apiKey = require('crypto').randomBytes(32).toString('hex');
    }
  }
  next();
});

// Instance methods
botSchema.methods.generateEmbedCode = function() {
  const widgetId = this.deployment.widgetId;
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const embedCode = `<!-- Chatbot Widget -->
<script>
  (function() {
    var chatbot = document.createElement('script');
    chatbot.type = 'text/javascript';
    chatbot.async = true;
    chatbot.src = '${baseUrl}/widget.js';
    chatbot.setAttribute('data-bot-id', '${widgetId}');
    chatbot.setAttribute('data-api-url', '${process.env.API_URL || 'http://localhost:5000'}');
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(chatbot, s);
  })();
</script>
<!-- End Chatbot Widget -->`;

  this.deployment.embedCode = embedCode;
  return embedCode;
};

botSchema.methods.createBackup = function() {
  this.previousVersions.push({
    version: this.version,
    flow: this.flow,
    settings: this.settings,
    createdBy: this.createdBy
  });
  
  // Keep only last 10 versions
  if (this.previousVersions.length > 10) {
    this.previousVersions = this.previousVersions.slice(-10);
  }
};

botSchema.methods.updateAnalytics = function(data) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Update overall analytics
  if (data.newConversation) {
    this.analytics.totalConversations += 1;
    this.analytics.activeConversations += 1;
  }
  
  if (data.newMessage) {
    this.analytics.totalMessages += 1;
  }
  
  if (data.conversationCompleted) {
    this.analytics.completedConversations += 1;
    this.analytics.activeConversations = Math.max(0, this.analytics.activeConversations - 1);
  }
  
  if (data.rating) {
    this.analytics.totalRatings += 1;
    this.analytics.averageRating = 
      ((this.analytics.averageRating * (this.analytics.totalRatings - 1)) + data.rating) / 
      this.analytics.totalRatings;
  }
  
  this.analytics.lastActivity = new Date();
  
  // Update daily stats
  let dailyStat = this.analytics.dailyStats.find(stat => 
    stat.date.getTime() === today.getTime()
  );
  
  if (!dailyStat) {
    dailyStat = {
      date: today,
      conversations: 0,
      messages: 0,
      uniqueUsers: 0,
      averageRating: 0
    };
    this.analytics.dailyStats.push(dailyStat);
  }
  
  if (data.newConversation) dailyStat.conversations += 1;
  if (data.newMessage) dailyStat.messages += 1;
  if (data.uniqueUser) dailyStat.uniqueUsers += 1;
  if (data.rating) {
    dailyStat.averageRating = 
      ((dailyStat.averageRating * (dailyStat.conversations - 1)) + data.rating) / 
      dailyStat.conversations;
  }
  
  // Keep only last 30 days of stats
  if (this.analytics.dailyStats.length > 30) {
    this.analytics.dailyStats = this.analytics.dailyStats.slice(-30);
  }
};

// Static methods
botSchema.statics.findByWidgetId = function(widgetId) {
  return this.findOne({ 'deployment.widgetId': widgetId, isPublished: true });
};

botSchema.statics.findActiveByUser = function(userId) {
  return this.find({ 
    createdBy: userId, 
    status: { $in: ['active', 'draft'] } 
  }).sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Bot', botSchema);
