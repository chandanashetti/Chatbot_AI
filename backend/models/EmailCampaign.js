const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'bounced', 'unsubscribed'],
    default: 'pending'
  },
  sentAt: { type: Date },
  openedAt: { type: Date },
  clickedAt: { type: Date },
  errorMessage: { type: String }
}, { _id: false });

const emailCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  content: {
    html: { type: String, required: true },
    text: { type: String } // Plain text version
  },
  type: {
    type: String,
    enum: ['newsletter', 'promotional', 'transactional', 'welcome', 'follow_up'],
    default: 'newsletter'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'failed', 'cancelled'],
    default: 'draft'
  },

  // Email Provider Configuration
  emailProvider: {
    type: String,
    enum: ['sendgrid', 'mailgun', 'ses', 'smtp'],
    required: true
  },
  providerConfig: {
    fromEmail: { type: String, required: true },
    fromName: { type: String, required: true },
    replyTo: { type: String }
  },

  // Recipients
  recipients: [recipientSchema],
  recipientList: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecipientList'
  },

  // Scheduling
  scheduledAt: { type: Date },
  sendAt: { type: Date }, // For timezone-specific scheduling
  timezone: { type: String, default: 'UTC' },

  // Tracking & Analytics
  tracking: {
    opens: { type: Boolean, default: true },
    clicks: { type: Boolean, default: true },
    unsubscribes: { type: Boolean, default: true }
  },

  analytics: {
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    bounceCount: { type: Number, default: 0 },
    unsubscribeCount: { type: Number, default: 0 },

    openRate: { type: Number, default: 0 }, // Percentage
    clickRate: { type: Number, default: 0 }, // Percentage
    bounceRate: { type: Number, default: 0 }, // Percentage

    lastCalculatedAt: { type: Date }
  },

  // Template & Design
  template: {
    id: { type: String },
    name: { type: String },
    customCss: { type: String },
    variables: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },

  // Segmentation
  segments: [{
    name: { type: String },
    criteria: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  }],

  // A/B Testing
  abTest: {
    enabled: { type: Boolean, default: false },
    variants: [{
      name: { type: String },
      subject: { type: String },
      content: { html: String, text: String },
      percentage: { type: Number, min: 0, max: 100 }
    }],
    winnerCriteria: {
      type: String,
      enum: ['open_rate', 'click_rate', 'conversion_rate'],
      default: 'open_rate'
    },
    testDuration: { type: Number, default: 24 }, // Hours
    winnerSentAt: { type: Date }
  },

  // Automation
  automation: {
    isAutomated: { type: Boolean, default: false },
    trigger: {
      type: String,
      enum: ['user_signup', 'user_action', 'date_based', 'api_trigger']
    },
    conditions: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },

  // Delivery Settings
  deliverySettings: {
    throttle: {
      enabled: { type: Boolean, default: false },
      emailsPerHour: { type: Number, default: 1000 }
    },
    retrySettings: {
      maxRetries: { type: Number, default: 3 },
      retryDelay: { type: Number, default: 60 } // Minutes
    }
  },

  // Compliance & Legal
  compliance: {
    includeUnsubscribeLink: { type: Boolean, default: true },
    gdprCompliant: { type: Boolean, default: true },
    canSpamCompliant: { type: Boolean, default: true }
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{ type: String, trim: true }],
  notes: { type: String, maxlength: 1000 },

  // Execution Tracking
  execution: {
    startedAt: { type: Date },
    completedAt: { type: Date },
    failedAt: { type: Date },
    errorMessage: { type: String },
    batchesSent: { type: Number, default: 0 },
    currentBatch: { type: Number, default: 0 }
  }

}, {
  timestamps: true,
  collection: 'emailCampaigns'
});

// Indexes for performance
emailCampaignSchema.index({ status: 1 });
emailCampaignSchema.index({ createdBy: 1 });
emailCampaignSchema.index({ scheduledAt: 1 });
emailCampaignSchema.index({ type: 1 });
emailCampaignSchema.index({ emailProvider: 1 });
emailCampaignSchema.index({ 'recipients.email': 1 });
emailCampaignSchema.index({ createdAt: -1 });

// Virtual for recipient count
emailCampaignSchema.virtual('recipientCount').get(function() {
  return this.recipients ? this.recipients.length : 0;
});

// Virtual for open rate calculation
emailCampaignSchema.virtual('calculatedOpenRate').get(function() {
  if (this.analytics.sentCount === 0) return 0;
  return Math.round((this.analytics.openCount / this.analytics.sentCount) * 100 * 100) / 100;
});

// Virtual for click rate calculation
emailCampaignSchema.virtual('calculatedClickRate').get(function() {
  if (this.analytics.sentCount === 0) return 0;
  return Math.round((this.analytics.clickCount / this.analytics.sentCount) * 100 * 100) / 100;
});

// Methods
emailCampaignSchema.methods.updateAnalytics = function() {
  const recipients = this.recipients || [];

  this.analytics.totalRecipients = recipients.length;
  this.analytics.sentCount = recipients.filter(r => r.status === 'sent').length;
  this.analytics.openCount = recipients.filter(r => r.openedAt).length;
  this.analytics.clickCount = recipients.filter(r => r.clickedAt).length;
  this.analytics.bounceCount = recipients.filter(r => r.status === 'bounced').length;
  this.analytics.unsubscribeCount = recipients.filter(r => r.status === 'unsubscribed').length;

  // Calculate rates
  if (this.analytics.sentCount > 0) {
    this.analytics.openRate = Math.round((this.analytics.openCount / this.analytics.sentCount) * 100 * 100) / 100;
    this.analytics.clickRate = Math.round((this.analytics.clickCount / this.analytics.sentCount) * 100 * 100) / 100;
    this.analytics.bounceRate = Math.round((this.analytics.bounceCount / this.analytics.sentCount) * 100 * 100) / 100;
  }

  this.analytics.lastCalculatedAt = new Date();
  return this.save();
};

emailCampaignSchema.methods.canEdit = function() {
  return ['draft', 'scheduled', 'paused'].includes(this.status);
};

emailCampaignSchema.methods.canSend = function() {
  return this.status === 'draft' && this.recipients.length > 0;
};

emailCampaignSchema.methods.canPause = function() {
  return this.status === 'sending';
};

emailCampaignSchema.methods.canResume = function() {
  return this.status === 'paused';
};

// Static methods
emailCampaignSchema.statics.findByProvider = function(provider) {
  return this.find({ emailProvider: provider });
};

emailCampaignSchema.statics.findScheduled = function() {
  return this.find({
    status: 'scheduled',
    scheduledAt: { $lte: new Date() }
  });
};

emailCampaignSchema.statics.getCampaignStats = function(userId) {
  const matchStage = userId ? { createdBy: mongoose.Types.ObjectId(userId) } : {};

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCampaigns: { $sum: 1 },
        totalRecipients: { $sum: '$analytics.totalRecipients' },
        totalSent: { $sum: '$analytics.sentCount' },
        totalOpens: { $sum: '$analytics.openCount' },
        totalClicks: { $sum: '$analytics.clickCount' },
        averageOpenRate: { $avg: '$analytics.openRate' },
        averageClickRate: { $avg: '$analytics.clickRate' }
      }
    }
  ]);
};

// Pre-save middleware
emailCampaignSchema.pre('save', function(next) {
  // Update recipient count
  if (this.recipients) {
    this.analytics.totalRecipients = this.recipients.length;
  }

  // Validate scheduling
  if (this.status === 'scheduled' && !this.scheduledAt) {
    return next(new Error('Scheduled campaigns must have a scheduledAt date'));
  }

  // Validate recipients
  if (this.status !== 'draft' && (!this.recipients || this.recipients.length === 0)) {
    return next(new Error('Cannot send campaign without recipients'));
  }

  next();
});

// Ensure virtual fields are serialized
emailCampaignSchema.set('toJSON', { virtuals: true });
emailCampaignSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);