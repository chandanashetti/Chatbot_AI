const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },

  // Custom fields for segmentation
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Subscription status
  subscriptionStatus: {
    type: String,
    enum: ['subscribed', 'unsubscribed', 'bounced', 'complained'],
    default: 'subscribed'
  },

  // Engagement tracking
  engagement: {
    totalEmailsSent: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    lastOpenedAt: { type: Date },
    lastClickedAt: { type: Date },
    lastEmailSentAt: { type: Date }
  },

  // Source tracking
  source: {
    type: String,
    enum: ['manual', 'import', 'signup', 'api', 'form'],
    default: 'manual'
  },
  sourceDetails: { type: String }, // Additional info about the source

  // Demographics
  demographics: {
    country: { type: String },
    city: { type: String },
    timezone: { type: String },
    language: { type: String, default: 'en' }
  },

  // Tags for organization
  tags: [{ type: String, trim: true }],

  // Subscription preferences
  preferences: {
    emailTypes: [{
      type: String,
      enum: ['newsletter', 'promotional', 'transactional', 'welcome', 'follow_up']
    }],
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly'
    }
  },

  // Compliance
  consents: {
    marketing: {
      given: { type: Boolean, default: false },
      givenAt: { type: Date },
      ipAddress: { type: String }
    },
    terms: {
      accepted: { type: Boolean, default: false },
      acceptedAt: { type: Date },
      version: { type: String }
    }
  },

  // Import metadata
  importedAt: { type: Date },
  importBatch: { type: String }

}, {
  timestamps: true,
  _id: false
});

const recipientListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    maxlength: 1000
  },

  // Recipients in this list
  recipients: [recipientSchema],

  // List metadata
  type: {
    type: String,
    enum: ['static', 'dynamic', 'segment'],
    default: 'static'
  },

  // For dynamic lists - criteria for auto-population
  dynamicCriteria: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // List statistics
  stats: {
    totalRecipients: { type: Number, default: 0 },
    subscribedCount: { type: Number, default: 0 },
    unsubscribedCount: { type: Number, default: 0 },
    bouncedCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },

  // Import settings
  importSettings: {
    allowDuplicates: { type: Boolean, default: false },
    updateExisting: { type: Boolean, default: true },
    defaultTags: [{ type: String }],
    fieldMapping: {
      type: Map,
      of: String
    }
  },

  // Access control
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permissions: {
      type: [String],
      enum: ['read', 'write', 'delete'],
      default: ['read']
    }
  }],

  // Organization
  tags: [{ type: String, trim: true }],
  folder: { type: String, default: 'default' },

  // Archive status
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date }

}, {
  timestamps: true,
  collection: 'recipientLists'
});

// Indexes
recipientListSchema.index({ createdBy: 1 });
recipientListSchema.index({ type: 1 });
recipientListSchema.index({ isArchived: 1 });
recipientListSchema.index({ 'recipients.email': 1 });
recipientListSchema.index({ 'recipients.subscriptionStatus': 1 });
recipientListSchema.index({ tags: 1 });

// Virtual for active recipient count
recipientListSchema.virtual('activeRecipientCount').get(function() {
  if (!this.recipients) return 0;
  return this.recipients.filter(r => r.subscriptionStatus === 'subscribed').length;
});

// Methods
recipientListSchema.methods.addRecipient = function(recipientData) {
  // Check for duplicates if not allowed
  if (!this.importSettings.allowDuplicates) {
    const exists = this.recipients.find(r => r.email === recipientData.email.toLowerCase());
    if (exists) {
      if (this.importSettings.updateExisting) {
        // Update existing recipient
        Object.assign(exists, recipientData);
        exists.updatedAt = new Date();
      }
      return exists;
    }
  }

  // Add new recipient
  this.recipients.push({
    ...recipientData,
    email: recipientData.email.toLowerCase(),
    importedAt: new Date()
  });

  this.updateStats();
  return this.recipients[this.recipients.length - 1];
};

recipientListSchema.methods.removeRecipient = function(email) {
  const index = this.recipients.findIndex(r => r.email === email.toLowerCase());
  if (index > -1) {
    this.recipients.splice(index, 1);
    this.updateStats();
    return true;
  }
  return false;
};

recipientListSchema.methods.updateStats = function() {
  const recipients = this.recipients || [];

  this.stats.totalRecipients = recipients.length;
  this.stats.subscribedCount = recipients.filter(r => r.subscriptionStatus === 'subscribed').length;
  this.stats.unsubscribedCount = recipients.filter(r => r.subscriptionStatus === 'unsubscribed').length;
  this.stats.bouncedCount = recipients.filter(r => r.subscriptionStatus === 'bounced').length;
  this.stats.lastUpdated = new Date();

  return this;
};

recipientListSchema.methods.exportToCSV = function() {
  const recipients = this.recipients || [];
  if (recipients.length === 0) return '';

  // Get all unique custom fields
  const customFieldKeys = new Set();
  recipients.forEach(recipient => {
    if (recipient.customFields) {
      Object.keys(recipient.customFields).forEach(key => customFieldKeys.add(key));
    }
  });

  // Create headers
  const headers = [
    'email', 'firstName', 'lastName', 'subscriptionStatus',
    'source', 'country', 'city', 'language', 'tags',
    ...Array.from(customFieldKeys)
  ];

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...recipients.map(recipient => {
      const row = [
        recipient.email,
        recipient.firstName || '',
        recipient.lastName || '',
        recipient.subscriptionStatus,
        recipient.source || '',
        recipient.demographics?.country || '',
        recipient.demographics?.city || '',
        recipient.demographics?.language || '',
        recipient.tags ? recipient.tags.join(';') : '',
        ...Array.from(customFieldKeys).map(key =>
          recipient.customFields?.get(key) || ''
        )
      ];
      return row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    })
  ].join('\n');

  return csvContent;
};

recipientListSchema.methods.getSegment = function(criteria) {
  const recipients = this.recipients || [];

  return recipients.filter(recipient => {
    // Basic filtering logic - can be extended
    for (const [field, value] of Object.entries(criteria)) {
      if (field === 'tags') {
        if (!recipient.tags || !recipient.tags.some(tag => value.includes(tag))) {
          return false;
        }
      } else if (field === 'subscriptionStatus') {
        if (recipient.subscriptionStatus !== value) {
          return false;
        }
      } else if (field === 'customFields') {
        for (const [customField, customValue] of Object.entries(value)) {
          if (!recipient.customFields?.get(customField) === customValue) {
            return false;
          }
        }
      }
    }
    return true;
  });
};

// Static methods
recipientListSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { createdBy: userId },
      { 'sharedWith.user': userId }
    ],
    isArchived: false
  });
};

recipientListSchema.statics.importFromCSV = function(csvData, listId, mapping = {}) {
  // CSV import logic would go here
  // This is a placeholder for the actual implementation
  return Promise.resolve([]);
};

recipientListSchema.statics.getListStats = function(userId) {
  const matchStage = userId ? { createdBy: mongoose.Types.ObjectId(userId), isArchived: false } : { isArchived: false };

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalLists: { $sum: 1 },
        totalRecipients: { $sum: '$stats.totalRecipients' },
        totalSubscribed: { $sum: '$stats.subscribedCount' },
        totalUnsubscribed: { $sum: '$stats.unsubscribedCount' },
        totalBounced: { $sum: '$stats.bouncedCount' }
      }
    }
  ]);
};

// Pre-save middleware
recipientListSchema.pre('save', function(next) {
  // Update stats before saving
  this.updateStats();

  // Set default folder if not specified
  if (!this.folder) {
    this.folder = 'default';
  }

  next();
});

// Ensure virtual fields are serialized
recipientListSchema.set('toJSON', { virtuals: true });
recipientListSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RecipientList', recipientListSchema);