const mongoose = require('mongoose');

const HandoffRequestSchema = new mongoose.Schema({
  // Basic Information
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BotConversation',
    required: true
  },
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true
  },
  
  // User Information
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: String,
  platform: {
    type: String,
    enum: ['web', 'whatsapp', 'facebook', 'instagram', 'telegram', 'discord', 'line', 'other'],
    required: true
  },
  
  // Request Details
  reason: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'sales', 'complaint', 'general', 'urgent', 'other'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // AI Context
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  lastBotResponse: String,
  conversationSummary: String,
  detectedIntent: String,
  suggestedActions: [String],
  
  // Status & Assignment
  status: {
    type: String,
    enum: ['pending', 'assigned', 'accepted', 'declined', 'completed', 'expired'],
    default: 'pending'
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null
  },
  assignedAt: Date,
  acceptedAt: Date,
  completedAt: Date,
  
  // Queue Information
  queuePosition: {
    type: Number,
    default: 0
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  
  // Agent Selection Criteria
  requiredSkills: [String],
  requiredDepartments: [String],
  requiredLanguages: [String],
  preferredAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  
  // Escalation History
  escalationLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  previousAgents: [{
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent'
    },
    assignedAt: Date,
    reason: String, // Why it was escalated from this agent
    duration: Number // How long they handled it (minutes)
  }],
  
  // Timeout Settings
  responseTimeout: {
    type: Number,
    default: 300 // 5 minutes in seconds
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + (this.responseTimeout * 1000));
    }
  },
  
  // Customer Communication
  customerNotified: {
    type: Boolean,
    default: false
  },
  customerMessage: String, // Message sent to customer about handoff
  
  // Metrics & Analytics
  metrics: {
    timeToAssignment: Number, // milliseconds
    timeToAcceptance: Number, // milliseconds
    timeToCompletion: Number, // milliseconds
    customerWaitTime: Number, // milliseconds
    agentResponseTime: Number, // average response time during handoff
    resolutionTime: Number, // total time to resolve
    customerSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    wasResolved: {
      type: Boolean,
      default: false
    },
    requiresFollowup: {
      type: Boolean,
      default: false
    }
  },
  
  // Additional Context
  tags: [String],
  notes: [{
    author: {
      type: String,
      enum: ['system', 'bot', 'agent', 'supervisor']
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: true
    }
  }],
  
  // System Information
  createdBy: {
    type: String,
    enum: ['bot', 'user', 'agent', 'system'],
    default: 'bot'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }
}, {
  timestamps: true
});

// Indexes for performance
HandoffRequestSchema.index({ status: 1 });
HandoffRequestSchema.index({ assignedAgent: 1 });
HandoffRequestSchema.index({ conversationId: 1 });
HandoffRequestSchema.index({ botId: 1 });
HandoffRequestSchema.index({ priority: 1, createdAt: 1 });
HandoffRequestSchema.index({ category: 1 });
HandoffRequestSchema.index({ platform: 1 });
HandoffRequestSchema.index({ expiresAt: 1 });
HandoffRequestSchema.index({ queuePosition: 1 });

// TTL index to automatically remove expired requests
HandoffRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual fields
HandoffRequestSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && new Date() > this.expiresAt;
});

HandoffRequestSchema.virtual('waitTime').get(function() {
  if (this.acceptedAt) {
    return this.acceptedAt - this.createdAt;
  }
  return Date.now() - this.createdAt;
});

HandoffRequestSchema.virtual('totalDuration').get(function() {
  if (this.completedAt) {
    return this.completedAt - this.createdAt;
  }
  if (this.acceptedAt) {
    return Date.now() - this.acceptedAt;
  }
  return 0;
});

// Methods
HandoffRequestSchema.methods.assignToAgent = function(agentId, assignedBy = null) {
  this.assignedAgent = agentId;
  this.assignedAt = new Date();
  this.status = 'assigned';
  this.lastUpdatedBy = assignedBy;
  
  // Calculate time to assignment
  this.metrics.timeToAssignment = this.assignedAt - this.createdAt;
  
  return this.save();
};

HandoffRequestSchema.methods.acceptByAgent = function(agentId) {
  if (this.assignedAgent && !this.assignedAgent.equals(agentId)) {
    throw new Error('Request is assigned to a different agent');
  }
  
  this.assignedAgent = agentId;
  this.acceptedAt = new Date();
  this.status = 'accepted';
  this.lastUpdatedBy = agentId;
  
  // Calculate metrics
  this.metrics.timeToAcceptance = this.acceptedAt - this.createdAt;
  this.metrics.customerWaitTime = this.acceptedAt - this.createdAt;
  
  return this.save();
};

HandoffRequestSchema.methods.decline = function(agentId, reason = '') {
  this.status = 'declined';
  this.lastUpdatedBy = agentId;
  
  // Add note about decline
  this.notes.push({
    author: 'agent',
    content: `Request declined${reason ? ': ' + reason : ''}`,
    timestamp: new Date()
  });
  
  // Reset assignment
  this.assignedAgent = null;
  this.assignedAt = null;
  
  return this.save();
};

HandoffRequestSchema.methods.complete = function(agentId, resolution = {}) {
  this.completedAt = new Date();
  this.status = 'completed';
  this.lastUpdatedBy = agentId;
  
  // Update metrics
  this.metrics.timeToCompletion = this.completedAt - this.createdAt;
  if (this.acceptedAt) {
    this.metrics.resolutionTime = this.completedAt - this.acceptedAt;
  }
  
  // Update resolution details
  if (resolution.wasResolved !== undefined) {
    this.metrics.wasResolved = resolution.wasResolved;
  }
  if (resolution.requiresFollowup !== undefined) {
    this.metrics.requiresFollowup = resolution.requiresFollowup;
  }
  if (resolution.satisfaction) {
    this.metrics.customerSatisfaction = resolution.satisfaction;
  }
  
  return this.save();
};

HandoffRequestSchema.methods.escalate = function(reason, escalatedBy) {
  // Move current agent to previous agents
  if (this.assignedAgent) {
    this.previousAgents.push({
      agentId: this.assignedAgent,
      assignedAt: this.assignedAt,
      reason: reason,
      duration: this.acceptedAt ? 
        Math.round((Date.now() - this.acceptedAt) / (1000 * 60)) : 0
    });
  }
  
  // Reset assignment and increase escalation level
  this.assignedAgent = null;
  this.assignedAt = null;
  this.acceptedAt = null;
  this.escalationLevel += 1;
  this.status = 'pending';
  this.priority = this.priority === 'critical' ? 'critical' : 
                  this.priority === 'high' ? 'critical' : 'high';
  
  // Add escalation note
  this.notes.push({
    author: 'system',
    content: `Escalated to level ${this.escalationLevel}: ${reason}`,
    timestamp: new Date()
  });
  
  this.lastUpdatedBy = escalatedBy;
  
  return this.save();
};

HandoffRequestSchema.methods.addNote = function(content, author = 'system', isInternal = true) {
  this.notes.push({
    author,
    content,
    timestamp: new Date(),
    isInternal
  });
  
  return this.save();
};

// Static methods
HandoffRequestSchema.statics.getQueueStats = function() {
  return this.aggregate([
    {
      $match: { status: 'pending' }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgWaitTime: { 
          $avg: { 
            $subtract: [new Date(), '$createdAt'] 
          } 
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1
          }
        }
      }
    }
  ]);
};

HandoffRequestSchema.statics.findNextInQueue = function(agentCriteria = {}) {
  const query = { status: 'pending' };
  
  // Add agent skill matching
  if (agentCriteria.skills) {
    query.requiredSkills = { $in: agentCriteria.skills };
  }
  
  if (agentCriteria.departments) {
    query.requiredDepartments = { $in: agentCriteria.departments };
  }
  
  return this.findOne(query)
    .sort({ 
      priority: -1, // Higher priority first
      escalationLevel: -1, // Higher escalation level first
      createdAt: 1 // Older requests first
    })
    .populate('assignedAgent')
    .populate('conversationId');
};

HandoffRequestSchema.statics.updateQueuePositions = function() {
  // Update queue positions for all pending requests
  return this.find({ status: 'pending' })
    .sort({ 
      priority: -1,
      escalationLevel: -1,
      createdAt: 1 
    })
    .then(requests => {
      const updates = requests.map((request, index) => ({
        updateOne: {
          filter: { _id: request._id },
          update: { queuePosition: index + 1 }
        }
      }));
      
      return this.bulkWrite(updates);
    });
};

module.exports = mongoose.model('HandoffRequest', HandoffRequestSchema);
