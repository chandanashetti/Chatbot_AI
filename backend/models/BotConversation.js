const mongoose = require('mongoose');

// Message Schema for bot conversations
const botMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  sender: { 
    type: String, 
    required: true,
    enum: ['user', 'bot', 'system']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'quick_reply', 'card', 'button', 'handoff'],
    default: 'text'
  },
  nodeId: String, // The flow node that generated this message
  metadata: {
    currentNode: String, // Current position in the flow
    nextNode: String, // Next node to process
    variables: mongoose.Schema.Types.Mixed, // Variables collected so far
    intent: String, // Detected user intent
    confidence: Number, // Confidence score for intent detection
    entities: [{
      entity: String,
      value: String,
      confidence: Number
    }],
    processingTime: Number, // Time taken to process this message
    aiModel: String, // AI model used for response
    temperature: Number,
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    ragUsed: Boolean,
    documentsReferenced: [String]
  },
  attachments: [{
    name: String,
    type: String,
    size: Number,
    url: String
  }],
  reactions: [{
    type: { type: String, enum: ['like', 'dislike', 'love', 'angry'] },
    timestamp: { type: Date, default: Date.now },
    userId: String
  }],
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  _id: false
});

// User information for bot conversations
const conversationUserSchema = new mongoose.Schema({
  sessionId: { type: String, required: true }, // Unique session identifier
  userId: String, // Optional registered user ID
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    city: String,
    region: String,
    timezone: String
  },
  referrer: String, // Page where the conversation started
  utm: { // UTM parameters for marketing attribution
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },
  customData: mongoose.Schema.Types.Mixed // Additional custom user data
}, { _id: false });

// Bot Conversation Schema
const botConversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  botId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for registered users
  
  // Session and user information
  sessionId: { type: String, required: true },
  user: conversationUserSchema,
  
  // Conversation metadata
  title: { type: String, default: 'New Conversation' },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'transferred', 'archived'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  category: String, // Category of the conversation (e.g., 'support', 'sales')
  tags: [String], // Tags for categorization
  
  // Messages in the conversation
  messages: [botMessageSchema],
  
  // Flow state
  flowState: {
    currentNode: String, // Current position in the bot flow
    nextNode: String, // Next node to process
    completedNodes: [String], // Nodes that have been processed
    variables: mongoose.Schema.Types.Mixed, // Variables collected during conversation
    context: mongoose.Schema.Types.Mixed, // Additional context data
    loopCount: { type: Number, default: 0 }, // Prevent infinite loops
    isCompleted: { type: Boolean, default: false }
  },
  
  // Analytics and metrics
  metrics: {
    totalMessages: { type: Number, default: 0 },
    userMessages: { type: Number, default: 0 },
    botMessages: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }, // Average bot response time in ms
    totalDuration: { type: Number, default: 0 }, // Total conversation duration in ms
    bounceRate: { type: Number, default: 0 }, // User engagement score
    satisfactionScore: Number, // User satisfaction rating (1-5)
    conversionGoalMet: { type: Boolean, default: false }, // Whether conversion goal was achieved
    handoffRequested: { type: Boolean, default: false },
    handoffReason: String
  },
  
  // Lead/Customer data (for lead generation bots)
  leadData: {
    name: String,
    email: String,
    phone: String,
    company: String,
    jobTitle: String,
    requirements: String,
    budget: String,
    timeline: String,
    source: String,
    score: Number, // Lead quality score
    isQualified: { type: Boolean, default: false },
    followUpRequired: { type: Boolean, default: false },
    notes: String
  },
  
  // Integration data
  integrations: {
    crm: {
      provider: String,
      contactId: String,
      dealId: String,
      syncStatus: { type: String, enum: ['pending', 'synced', 'failed'], default: 'pending' },
      lastSyncAt: Date,
      error: String
    },
    webhooks: [{
      url: String,
      event: String,
      status: { type: String, enum: ['pending', 'sent', 'failed'] },
      response: mongoose.Schema.Types.Mixed,
      sentAt: Date
    }],
    notifications: {
      email: { type: Boolean, default: false },
      slack: { type: Boolean, default: false },
      webhook: { type: Boolean, default: false }
    }
  },
  
  // Conversation settings
  settings: {
    language: { type: String, default: 'en' },
    timezone: String,
    notifications: { type: Boolean, default: true },
    dataRetention: {
      deleteAfterDays: Number,
      anonymizeAfterDays: Number
    }
  },
  
  // Timestamps
  startedAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
  completedAt: Date,
  archivedAt: Date,
  
  // Flags
  isTest: { type: Boolean, default: false }, // Test conversations
  isAnonymous: { type: Boolean, default: true },
  requiresAttention: { type: Boolean, default: false }, // Flagged for human review
  
  // GDPR and privacy
  privacy: {
    dataProcessingConsent: { type: Boolean, default: false },
    marketingConsent: { type: Boolean, default: false },
    consentTimestamp: Date,
    anonymizationRequested: { type: Boolean, default: false },
    deletionRequested: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  collection: 'bot_conversations'
});

// Indexes for performance (conversationId index is created automatically by unique: true)
botConversationSchema.index({ botId: 1, createdAt: -1 });
botConversationSchema.index({ sessionId: 1 });
botConversationSchema.index({ userId: 1 });
botConversationSchema.index({ status: 1 });
botConversationSchema.index({ startedAt: -1 });
botConversationSchema.index({ lastMessageAt: -1 });
botConversationSchema.index({ 'user.ipAddress': 1 });
botConversationSchema.index({ 'leadData.email': 1 });
botConversationSchema.index({ 'flowState.currentNode': 1 });

// Pre-save middleware
botConversationSchema.pre('save', function(next) {
  // Generate conversation ID if not exists
  if (!this.conversationId) {
    this.conversationId = require('crypto').randomBytes(16).toString('hex');
  }
  
  // Update metrics
  this.metrics.totalMessages = this.messages.length;
  this.metrics.userMessages = this.messages.filter(m => m.sender === 'user').length;
  this.metrics.botMessages = this.messages.filter(m => m.sender === 'bot').length;
  
  // Update last message timestamp
  if (this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].createdAt || new Date();
  }
  
  // Calculate total duration
  if (this.completedAt) {
    this.metrics.totalDuration = this.completedAt.getTime() - this.startedAt.getTime();
  }
  
  // Auto-generate title from first user message
  if (!this.title || this.title === 'New Conversation') {
    const firstUserMessage = this.messages.find(m => m.sender === 'user');
    if (firstUserMessage) {
      this.title = firstUserMessage.content.substring(0, 50) + 
        (firstUserMessage.content.length > 50 ? '...' : '');
    }
  }
  
  next();
});

// Instance methods
botConversationSchema.methods.addMessage = function(messageData) {
  const message = {
    id: messageData.id || require('crypto').randomBytes(8).toString('hex'),
    content: messageData.content,
    sender: messageData.sender,
    type: messageData.type || 'text',
    nodeId: messageData.nodeId,
    metadata: messageData.metadata || {},
    attachments: messageData.attachments || []
  };
  
  this.messages.push(message);
  this.lastMessageAt = new Date();
  
  return message;
};

botConversationSchema.methods.updateFlowState = function(newState) {
  this.flowState = {
    ...this.flowState.toObject(),
    ...newState
  };
  
  // Track completed nodes
  if (newState.currentNode && !this.flowState.completedNodes.includes(newState.currentNode)) {
    this.flowState.completedNodes.push(newState.currentNode);
  }
};

botConversationSchema.methods.setLeadData = function(leadData) {
  this.leadData = {
    ...this.leadData.toObject(),
    ...leadData
  };
  
  // Calculate lead score based on provided data
  let score = 0;
  if (leadData.email) score += 20;
  if (leadData.phone) score += 15;
  if (leadData.company) score += 15;
  if (leadData.requirements) score += 25;
  if (leadData.budget) score += 25;
  
  this.leadData.score = score;
  this.leadData.isQualified = score >= 60;
};

botConversationSchema.methods.markCompleted = function(reason = 'flow_completed') {
  this.status = 'completed';
  this.completedAt = new Date();
  this.flowState.isCompleted = true;
  
  // Update metrics
  this.metrics.totalDuration = this.completedAt.getTime() - this.startedAt.getTime();
};

botConversationSchema.methods.requestHandoff = function(reason = 'user_request') {
  this.metrics.handoffRequested = true;
  this.metrics.handoffReason = reason;
  this.status = 'transferred';
  this.requiresAttention = true;
};

botConversationSchema.methods.addReaction = function(messageId, reaction, userId) {
  const message = this.messages.find(m => m.id === messageId);
  if (message) {
    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(r => r.userId !== userId);
    
    // Add new reaction
    if (reaction) {
      message.reactions.push({
        type: reaction,
        userId: userId,
        timestamp: new Date()
      });
    }
  }
};

// Static methods
botConversationSchema.statics.findActiveByBot = function(botId) {
  return this.find({ 
    botId, 
    status: 'active',
    lastMessageAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  });
};

botConversationSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ sessionId, status: { $ne: 'archived' } });
};

botConversationSchema.statics.getAnalytics = function(botId, startDate, endDate) {
  const matchStage = { botId: new mongoose.Types.ObjectId(botId) };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        completedConversations: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        averageDuration: { $avg: '$metrics.totalDuration' },
        averageMessages: { $avg: '$metrics.totalMessages' },
        averageSatisfaction: { $avg: '$metrics.satisfactionScore' },
        totalLeads: { $sum: { $cond: ['$leadData.isQualified', 1, 0] } },
        handoffRate: { 
          $avg: { $cond: ['$metrics.handoffRequested', 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('BotConversation', botConversationSchema);
