const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String, // URL to avatar image
    default: null
  },
  
  // Authentication
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['agent', 'supervisor', 'admin'],
    default: 'agent'
  },
  
  // Availability & Status
  status: {
    type: String,
    enum: ['available', 'busy', 'offline', 'break'],
    default: 'offline'
  },
  availability: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    maxConcurrentChats: {
      type: Number,
      default: 5
    },
    workingHours: {
      timezone: {
        type: String,
        default: 'UTC'
      },
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String, // Format: "09:00"
        endTime: String,   // Format: "17:00"
        isActive: {
          type: Boolean,
          default: true
        }
      }]
    }
  },
  
  // Skills & Specializations
  skills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    categories: [String] // e.g., ['technical', 'billing', 'sales']
  }],
  languages: [{
    code: String, // e.g., 'en', 'es', 'fr'
    name: String, // e.g., 'English', 'Spanish', 'French'
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native'],
      default: 'conversational'
    }
  }],
  departments: [String], // e.g., ['customer-service', 'technical-support', 'sales']
  
  // Performance Metrics
  metrics: {
    totalChatsHandled: {
      type: Number,
      default: 0
    },
    activeChats: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0 // in seconds
    },
    averageResolutionTime: {
      type: Number,
      default: 0 // in minutes
    },
    customerSatisfactionScore: {
      type: Number,
      default: 0, // 0-5 scale
      min: 0,
      max: 5
    },
    ratingsCount: {
      type: Number,
      default: 0
    },
    handoffAcceptanceRate: {
      type: Number,
      default: 0 // percentage
    },
    lastMonthStats: {
      chatsHandled: Number,
      avgResponseTime: Number,
      avgResolutionTime: Number,
      satisfactionScore: Number
    }
  },
  
  // Current Active Sessions
  activeSessions: [{
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BotConversation'
    },
    userId: String,
    userName: String,
    platform: String,
    startTime: {
      type: Date,
      default: Date.now
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  
  // Handoff Queue Settings
  handoffSettings: {
    autoAccept: {
      type: Boolean,
      default: false
    },
    acceptanceTimeout: {
      type: Number,
      default: 300 // 5 minutes in seconds
    },
    preferredCategories: [String], // Categories this agent prefers
    maxQueueSize: {
      type: Number,
      default: 10
    }
  },
  
  // Agent Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      browser: {
        type: Boolean,
        default: true
      },
      sound: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Audit Trail
  lastLoginAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance
AgentSchema.index({ email: 1 });
AgentSchema.index({ userId: 1 });
AgentSchema.index({ status: 1 });
AgentSchema.index({ 'availability.isOnline': 1 });
AgentSchema.index({ departments: 1 });
AgentSchema.index({ 'skills.categories': 1 });
AgentSchema.index({ isActive: 1 });

// Virtual for full name if we add firstName/lastName later
AgentSchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && 
         this.availability.isOnline && 
         this.metrics.activeChats < this.availability.maxConcurrentChats;
});

// Methods
AgentSchema.methods.updateLastSeen = function() {
  this.availability.lastSeen = new Date();
  return this.save();
};

AgentSchema.methods.setStatus = function(status) {
  this.status = status;
  this.availability.lastSeen = new Date();
  return this.save();
};

AgentSchema.methods.acceptHandoff = function(conversationId, userInfo) {
  // Add to active sessions
  this.activeSessions.push({
    conversationId,
    userId: userInfo.userId,
    userName: userInfo.userName,
    platform: userInfo.platform,
    priority: userInfo.priority || 'medium'
  });
  
  // Update metrics
  this.metrics.activeChats += 1;
  this.metrics.totalChatsHandled += 1;
  
  // Update status if needed
  if (this.metrics.activeChats >= this.availability.maxConcurrentChats) {
    this.status = 'busy';
  }
  
  return this.save();
};

AgentSchema.methods.completeHandoff = function(conversationId, metrics = {}) {
  // Remove from active sessions
  this.activeSessions = this.activeSessions.filter(
    session => !session.conversationId.equals(conversationId)
  );
  
  // Update metrics
  this.metrics.activeChats = Math.max(0, this.metrics.activeChats - 1);
  
  if (metrics.responseTime) {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + metrics.responseTime) / 2;
  }
  
  if (metrics.resolutionTime) {
    this.metrics.averageResolutionTime = 
      (this.metrics.averageResolutionTime + metrics.resolutionTime) / 2;
  }
  
  if (metrics.satisfaction) {
    const totalRatings = this.metrics.ratingsCount;
    const currentScore = this.metrics.customerSatisfactionScore;
    this.metrics.customerSatisfactionScore = 
      (currentScore * totalRatings + metrics.satisfaction) / (totalRatings + 1);
    this.metrics.ratingsCount += 1;
  }
  
  // Update status if no longer busy
  if (this.status === 'busy' && this.metrics.activeChats < this.availability.maxConcurrentChats) {
    this.status = 'available';
  }
  
  return this.save();
};

// Static methods
AgentSchema.statics.findAvailableAgents = function(criteria = {}) {
  const query = {
    isActive: true,
    'availability.isOnline': true,
    status: 'available',
    $expr: {
      $lt: ['$metrics.activeChats', '$availability.maxConcurrentChats']
    }
  };
  
  // Add skill/department filtering if provided
  if (criteria.skills && criteria.skills.length > 0) {
    query['skills.categories'] = { $in: criteria.skills };
  }
  
  if (criteria.departments && criteria.departments.length > 0) {
    query.departments = { $in: criteria.departments };
  }
  
  if (criteria.languages && criteria.languages.length > 0) {
    query['languages.code'] = { $in: criteria.languages };
  }
  
  return this.find(query)
    .sort({ 
      'metrics.activeChats': 1, // Prefer agents with fewer active chats
      'metrics.customerSatisfactionScore': -1, // Then by satisfaction score
      'metrics.averageResponseTime': 1 // Then by response time
    });
};

AgentSchema.statics.getAgentStats = function(agentId, dateRange = {}) {
  // This would typically aggregate data from BotConversation collection
  // For now, return basic stats from the agent document
  return this.findById(agentId).select('metrics');
};

module.exports = mongoose.model('Agent', AgentSchema);
