const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  sender: { 
    type: String, 
    required: true,
    enum: ['user', 'bot', 'system']
  },
  metadata: {
    model: { type: String },
    temperature: { type: Number },
    tokens: {
      prompt: { type: Number },
      completion: { type: Number },
      total: { type: Number }
    },
    ragUsed: { type: Boolean, default: false },
    documentsReferenced: [String], // Document IDs
    processingTime: { type: Number }, // in milliseconds
    error: { type: String }
  },
  attachments: [{
    name: { type: String },
    type: { type: String },
    size: { type: Number },
    url: { type: String }
  }]
}, {
  timestamps: true,
  _id: false
});

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  userId: { type: String }, // For user tracking if authentication is added
  title: { type: String, default: 'New Chat' },
  messages: [messageSchema],
  settings: {
    model: { type: String },
    temperature: { type: Number },
    maxTokens: { type: Number },
    ragEnabled: { type: Boolean }
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'archived', 'deleted']
  },
  metadata: {
    totalMessages: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    averageResponseTime: { type: Number },
    userSatisfaction: { type: Number, min: 1, max: 5 } // Optional rating
  },
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'chat_sessions'
});

// Indexes for performance
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ lastActivity: -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ createdAt: -1 });

// Update metadata when messages are added
sessionSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.metadata.totalMessages = this.messages.length;
    this.metadata.totalTokens = this.messages.reduce((total, msg) => {
      return total + (msg.metadata?.tokens?.total || 0);
    }, 0);
    this.lastActivity = new Date();
  }
  next();
});

module.exports = mongoose.model('ChatSession', sessionSchema);
