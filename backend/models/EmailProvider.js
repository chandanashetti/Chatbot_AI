const mongoose = require('mongoose');
const crypto = require('crypto');

const emailProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  provider: {
    type: String,
    required: true,
    enum: ['sendgrid', 'mailgun', 'ses', 'smtp'],
    lowercase: true
  },

  // Provider-specific configuration
  config: {
    // SendGrid
    apiKey: { type: String },

    // Mailgun
    domain: { type: String },

    // AWS SES
    accessKeyId: { type: String },
    secretAccessKey: { type: String },
    region: { type: String },

    // SMTP
    host: { type: String },
    port: { type: Number },
    username: { type: String },
    password: { type: String },
    secure: { type: Boolean, default: false }, // true for 465, false for other ports
    tls: { type: Boolean, default: true },

    // Common settings
    fromEmail: { type: String, required: true },
    fromName: { type: String, required: true },
    replyTo: { type: String }
  },

  // Status and health
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'testing'],
    default: 'inactive'
  },
  isDefault: { type: Boolean, default: false },

  // Connection testing
  lastTested: { type: Date },
  lastTestResult: {
    success: { type: Boolean },
    message: { type: String },
    responseTime: { type: Number }, // milliseconds
    testedAt: { type: Date }
  },

  // Usage statistics
  usage: {
    totalEmailsSent: { type: Number, default: 0 },
    totalDelivered: { type: Number, default: 0 },
    totalBounced: { type: Number, default: 0 },
    totalComplained: { type: Number, default: 0 },
    lastUsed: { type: Date },
    monthlyQuota: { type: Number }, // If applicable
    monthlyUsed: { type: Number, default: 0 },
    dailyQuota: { type: Number }, // If applicable
    dailyUsed: { type: Number, default: 0 }
  },

  // Rate limiting
  rateLimits: {
    emailsPerSecond: { type: Number, default: 10 },
    emailsPerMinute: { type: Number, default: 600 },
    emailsPerHour: { type: Number, default: 36000 },
    emailsPerDay: { type: Number, default: 100000 }
  },

  // Webhooks for tracking
  webhooks: {
    enabled: { type: Boolean, default: false },
    url: { type: String },
    events: [{
      type: String,
      enum: ['delivered', 'opened', 'clicked', 'bounced', 'spam', 'unsubscribed']
    }],
    secret: { type: String } // For webhook verification
  },

  // Templates and settings
  templates: [{
    id: { type: String },
    name: { type: String },
    isDefault: { type: Boolean, default: false }
  }],

  // Compliance settings
  compliance: {
    trackOpens: { type: Boolean, default: true },
    trackClicks: { type: Boolean, default: true },
    includeUnsubscribe: { type: Boolean, default: true },
    gdprCompliant: { type: Boolean, default: true },
    customUnsubscribeUrl: { type: String }
  },

  // Error handling
  errorHandling: {
    retryAttempts: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 300 }, // seconds
    fallbackProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailProvider' }
  },

  // Access control
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Organization
  tags: [{ type: String, trim: true }],
  notes: { type: String, maxlength: 1000 },

  // Archive status
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date }

}, {
  timestamps: true,
  collection: 'emailProviders'
});

// Indexes
emailProviderSchema.index({ provider: 1 });
emailProviderSchema.index({ status: 1 });
emailProviderSchema.index({ isDefault: 1 });
emailProviderSchema.index({ createdBy: 1 });
emailProviderSchema.index({ isArchived: 1 });

// Virtual for masked API key display
emailProviderSchema.virtual('maskedApiKey').get(function() {
  if (!this.config.apiKey) return null;
  const key = this.config.apiKey;
  if (key.length <= 8) return '***';
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
});

// Virtual for connection status
emailProviderSchema.virtual('connectionStatus').get(function() {
  if (!this.lastTestResult) return 'unknown';
  if (this.lastTestResult.success) return 'connected';
  return 'error';
});

// Virtual for usage percentage
emailProviderSchema.virtual('monthlyUsagePercentage').get(function() {
  if (!this.usage.monthlyQuota) return 0;
  return Math.round((this.usage.monthlyUsed / this.usage.monthlyQuota) * 100);
});

// Methods
emailProviderSchema.methods.encrypt = function(text) {
  if (!text) return text;
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

emailProviderSchema.methods.decrypt = function(text) {
  if (!text || !text.includes(':')) return text;
  const algorithm = 'aes-256-cbc';
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

emailProviderSchema.methods.testConnection = async function() {
  const startTime = Date.now();
  let result = { success: false, message: '', responseTime: 0 };

  try {
    this.status = 'testing';
    await this.save();

    switch (this.provider) {
      case 'sendgrid':
        result = await this.testSendGrid();
        break;
      case 'mailgun':
        result = await this.testMailgun();
        break;
      case 'ses':
        result = await this.testSES();
        break;
      case 'smtp':
        result = await this.testSMTP();
        break;
      default:
        result.message = 'Unknown provider type';
    }

  } catch (error) {
    result.success = false;
    result.message = error.message;
  }

  result.responseTime = Date.now() - startTime;
  result.testedAt = new Date();

  this.lastTested = new Date();
  this.lastTestResult = result;
  this.status = result.success ? 'active' : 'error';

  await this.save();
  return result;
};

emailProviderSchema.methods.testSendGrid = async function() {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(this.config.apiKey);

  try {
    // Test by getting account info
    const response = await sgMail.send({
      to: this.config.fromEmail,
      from: this.config.fromEmail,
      subject: 'SendGrid Test Email',
      text: 'This is a test email to verify SendGrid configuration.',
      mail_settings: {
        sandbox_mode: { enable: true } // Sandbox mode for testing
      }
    });

    return {
      success: true,
      message: 'SendGrid connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: `SendGrid error: ${error.message}`
    };
  }
};

emailProviderSchema.methods.testMailgun = async function() {
  const mailgun = require('mailgun-js');
  const mg = mailgun({
    apiKey: this.config.apiKey,
    domain: this.config.domain
  });

  try {
    const result = await mg.validate(this.config.fromEmail);
    return {
      success: result.is_valid,
      message: result.is_valid ? 'Mailgun connection successful' : 'Invalid email configuration'
    };
  } catch (error) {
    return {
      success: false,
      message: `Mailgun error: ${error.message}`
    };
  }
};

emailProviderSchema.methods.testSES = async function() {
  const AWS = require('aws-sdk');

  AWS.config.update({
    accessKeyId: this.config.accessKeyId,
    secretAccessKey: this.config.secretAccessKey,
    region: this.config.region
  });

  const ses = new AWS.SES();

  try {
    const result = await ses.getIdentityVerificationAttributes({
      Identities: [this.config.fromEmail]
    }).promise();

    return {
      success: true,
      message: 'AWS SES connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: `AWS SES error: ${error.message}`
    };
  }
};

emailProviderSchema.methods.testSMTP = async function() {
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransporter({
    host: this.config.host,
    port: this.config.port,
    secure: this.config.secure,
    auth: {
      user: this.config.username,
      pass: this.config.password
    },
    tls: {
      rejectUnauthorized: !this.config.tls
    }
  });

  try {
    await transporter.verify();
    return {
      success: true,
      message: 'SMTP connection successful'
    };
  } catch (error) {
    return {
      success: false,
      message: `SMTP error: ${error.message}`
    };
  }
};

emailProviderSchema.methods.updateUsage = function(delivered, bounced, complained) {
  this.usage.totalEmailsSent += 1;
  if (delivered) this.usage.totalDelivered += 1;
  if (bounced) this.usage.totalBounced += 1;
  if (complained) this.usage.totalComplained += 1;

  this.usage.lastUsed = new Date();

  // Update daily and monthly counters
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // This would need more sophisticated tracking for accurate daily/monthly counts
  this.usage.dailyUsed += 1;
  this.usage.monthlyUsed += 1;

  return this.save();
};

emailProviderSchema.methods.canSendEmail = function() {
  if (this.status !== 'active') return false;

  // Check quotas
  if (this.usage.dailyQuota && this.usage.dailyUsed >= this.usage.dailyQuota) return false;
  if (this.usage.monthlyQuota && this.usage.monthlyUsed >= this.usage.monthlyQuota) return false;

  return true;
};

// Static methods
emailProviderSchema.statics.getDefault = function() {
  return this.findOne({ isDefault: true, status: 'active', isArchived: false });
};

emailProviderSchema.statics.getByProvider = function(providerType) {
  return this.find({
    provider: providerType,
    status: 'active',
    isArchived: false
  }).sort({ isDefault: -1 });
};

emailProviderSchema.statics.getActive = function() {
  return this.find({
    status: 'active',
    isArchived: false
  }).sort({ isDefault: -1, createdAt: -1 });
};

// Pre-save middleware
emailProviderSchema.pre('save', function(next) {
  // Encrypt sensitive data
  if (this.isModified('config.apiKey') && this.config.apiKey) {
    this.config.apiKey = this.encrypt(this.config.apiKey);
  }
  if (this.isModified('config.secretAccessKey') && this.config.secretAccessKey) {
    this.config.secretAccessKey = this.encrypt(this.config.secretAccessKey);
  }
  if (this.isModified('config.password') && this.config.password) {
    this.config.password = this.encrypt(this.config.password);
  }

  // Generate webhook secret if webhooks are enabled and no secret exists
  if (this.webhooks.enabled && !this.webhooks.secret) {
    this.webhooks.secret = crypto.randomBytes(32).toString('hex');
  }

  // Ensure only one default provider per type
  if (this.isDefault) {
    this.constructor.updateMany(
      { provider: this.provider, _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }

  next();
});

// Ensure virtual fields are serialized
emailProviderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Don't expose sensitive data in JSON
    if (ret.config) {
      delete ret.config.apiKey;
      delete ret.config.secretAccessKey;
      delete ret.config.password;
    }
    return ret;
  }
});

emailProviderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EmailProvider', emailProviderSchema);