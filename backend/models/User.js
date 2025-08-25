const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const permissionsSchema = new mongoose.Schema({
  admin: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  bots: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    deploy: { type: Boolean, default: false }
  },
  knowledgeBase: {
    upload: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: false }
  },
  analytics: {
    view: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    advanced: { type: Boolean, default: false }
  },
  settings: {
    view: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    system: { type: Boolean, default: false }
  },
  users: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    permissions: { type: Boolean, default: false }
  },
  integrations: {
    view: { type: Boolean, default: false },
    configure: { type: Boolean, default: false },
    connect: { type: Boolean, default: false }
  },
  chat: {
    view: { type: Boolean, default: false },
    moderate: { type: Boolean, default: false },
    export: { type: Boolean, default: false }
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  avatar: { type: String },
  role: { 
    type: String, 
    required: true,
    enum: ['superadmin', 'admin', 'manager', 'operator', 'viewer'],
    default: 'viewer'
  },
  status: { 
    type: String, 
    default: 'active',
    enum: ['active', 'inactive', 'suspended', 'pending']
  },
  permissions: { type: permissionsSchema, default: () => ({}) },
  profile: {
    department: { type: String },
    phoneNumber: { type: String },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    bio: { type: String },
    socialLinks: {
      linkedin: { type: String },
      twitter: { type: String },
      github: { type: String }
    }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    loginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
    lastPasswordChange: { type: Date, default: Date.now },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
  },
  activity: {
    lastLogin: { type: Date },
    lastIpAddress: { type: String },
    lastUserAgent: { type: String },
    loginCount: { type: Number, default: 0 }
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    defaultModel: { type: String },
    autoSave: { type: Boolean, default: true }
  },
  apiKeys: [{
    name: { type: String, required: true },
    key: { type: String, required: true },
    permissions: [String],
    lastUsed: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'activity.lastLogin': -1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.security.lastPasswordChange = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.security.lockoutUntil && this.security.lockoutUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockoutUntil && this.security.lockoutUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockoutUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { 'security.lockoutUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'security.lockoutUntil': 1, 'security.loginAttempts': 1 }
  });
};

// Update last login
userSchema.methods.updateLastLogin = function(ipAddress, userAgent) {
  return this.updateOne({
    $set: {
      'activity.lastLogin': new Date(),
      'activity.lastIpAddress': ipAddress,
      'activity.lastUserAgent': userAgent
    },
    $inc: { 'activity.loginCount': 1 }
  });
};

module.exports = mongoose.model('User', userSchema);
