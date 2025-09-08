const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// User Permissions Schema
const permissionsSchema = new mongoose.Schema({
  // Dashboard permissions
  dashboard: {
    view: { type: Boolean, default: false },
    export: { type: Boolean, default: false }
  },
  
  // User management permissions
  users: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    manageRoles: { type: Boolean, default: false }
  },
  
  // Bot management permissions
  bots: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    publish: { type: Boolean, default: false }
  },
  
  // Agent management permissions
  agents: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    assign: { type: Boolean, default: false }
  },
  
  // Analytics permissions
  analytics: {
    view: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    advanced: { type: Boolean, default: false }
  },
  
  // Knowledge base permissions
  knowledgeBase: {
    view: { type: Boolean, default: false },
    upload: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false }
  },
  
  // Settings permissions
  settings: {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    system: { type: Boolean, default: false }
  },
  
  // Chat management permissions
  chat: {
    view: { type: Boolean, default: false },
    moderate: { type: Boolean, default: false },
    export: { type: Boolean, default: false }
  }
}, { _id: false });

// User Profile Schema
const profileSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  avatar: { type: String, default: null },
  phone: { type: String, trim: true },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  bio: { type: String, maxlength: 500 },
  department: { type: String, trim: true },
  jobTitle: { type: String, trim: true },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: {
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  socialLinks: {
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    github: { type: String, trim: true }
  }
}, { _id: false });

// Security Settings Schema
const securitySchema = new mongoose.Schema({
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  backupCodes: [{ type: String, select: false }],
  passwordChangedAt: { type: Date, default: Date.now },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  ipWhitelist: [{ type: String }],
  sessionTimeout: { type: Number, default: 24 }, // hours
  forcePasswordChange: { type: Boolean, default: false }
}, { _id: false });

// Preferences Schema
const preferencesSchema = new mongoose.Schema({
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
  notifications: {
    email: { type: Boolean, default: true },
    browser: { type: Boolean, default: true },
    mobile: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false }
  },
  dashboard: {
    defaultView: { type: String, default: 'overview' },
    refreshInterval: { type: Number, default: 30 }, // seconds
    showWelcome: { type: Boolean, default: true }
  },
  privacy: {
    profileVisibility: { type: String, enum: ['public', 'team', 'private'], default: 'team' },
    activityTracking: { type: Boolean, default: true }
  }
}, { _id: false });

// Main User Schema
const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  
  // Role and Status
  role: {
    type: String,
    default: 'viewer'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended', 'deleted'],
    default: 'pending'
  },
  
  // Detailed Profile
  profile: {
    type: profileSchema,
    required: true
  },
  
  // Permissions
  permissions: {
    type: permissionsSchema,
    default: () => ({})
  },
  
  // Security Settings
  security: {
    type: securitySchema,
    default: () => ({})
  },
  
  // User Preferences
  preferences: {
    type: preferencesSchema,
    default: () => ({})
  },
  
  // Authentication Tokens
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  
  // Activity Tracking
  lastLogin: { type: Date },
  lastActivity: { type: Date },
  loginCount: { type: Number, default: 0 },
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes (email and username indexes are created automatically by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ isDeleted: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (!this.profile || !this.profile.firstName || !this.profile.lastName) {
    return 'Unknown User';
  }
  return `${this.profile.firstName} ${this.profile.lastName}`.trim();
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.security && this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.security.passwordChangedAt = Date.now();
  }
  
  // Update lastActivity
  if (this.isModified('lastLogin')) {
    this.lastActivity = Date.now();
  }
  
  // Validate role exists and set permissions based on role
  if (this.isModified('role')) {
    await this.validateAndSetRolePermissions();
  }
  
  next();
});

// Instance Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

userSchema.methods.incrementFailedLogin = function() {
  // Increment failed attempts
  this.security.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.security.failedLoginAttempts >= 5) {
    this.security.lockUntil = Date.now() + 2 * 60 * 60 * 1000;
  }
  
  return this.save();
};

userSchema.methods.resetFailedLogin = function() {
  this.security.failedLoginAttempts = 0;
  this.security.lockUntil = undefined;
  return this.save();
};

userSchema.methods.validateAndSetRolePermissions = async function() {
  const Role = require('./Role');
  
  // Convert role name to match Role model format (handle both display names and normalized names)
  const roleNormalizedName = this.role.toLowerCase().replace(/\s+/g, '');
  
  // Try to find role by name (both original and normalized formats)
  let role = await Role.findOne({ 
    $or: [
      { name: this.role, isDeleted: false, status: 'active' },
      { name: new RegExp(`^${this.role}$`, 'i'), isDeleted: false, status: 'active' }
    ]
  });
  
  // If role not found, try legacy hardcoded role mapping
  if (!role) {
    const legacyRoleMap = {
      'superadmin': 'Super Administrator',
      'admin': 'Administrator',
      'manager': 'Manager',
      'operator': 'Operator',
      'viewer': 'Viewer',
      'agent': 'Agent'
    };
    
    const mappedRoleName = legacyRoleMap[roleNormalizedName];
    if (mappedRoleName) {
      role = await Role.findOne({ 
        name: mappedRoleName, 
        isDeleted: false, 
        status: 'active' 
      });
    }
  }
  
  if (role) {
    // Update permissions from role
    this.permissions = role.permissions.toObject();
    // Store the role name as used in Role model for consistency
    this.role = roleNormalizedName;
  } else {
    // Fallback to default viewer permissions if role not found
    console.warn(`Role "${this.role}" not found, using viewer permissions`);
    this.role = 'viewer';
    this.permissions = this.getDefaultPermissions();
  }
};

userSchema.methods.getDefaultPermissions = function() {
  const rolePermissions = {
    superadmin: {
      dashboard: { view: true, export: true },
      users: { view: true, create: true, edit: true, delete: true, manageRoles: true },
      bots: { view: true, create: true, edit: true, delete: true, publish: true },
      agents: { view: true, create: true, edit: true, delete: true, assign: true },
      analytics: { view: true, export: true, advanced: true },
      knowledgeBase: { view: true, upload: true, edit: true, delete: true },
      settings: { view: true, edit: true, system: true },
      chat: { view: true, moderate: true, export: true }
    },
    admin: {
      dashboard: { view: true, export: true },
      users: { view: true, create: true, edit: true, delete: false, manageRoles: false },
      bots: { view: true, create: true, edit: true, delete: true, publish: true },
      agents: { view: true, create: true, edit: true, delete: false, assign: true },
      analytics: { view: true, export: true, advanced: true },
      knowledgeBase: { view: true, upload: true, edit: true, delete: false },
      settings: { view: true, edit: true, system: false },
      chat: { view: true, moderate: true, export: true }
    },
    manager: {
      dashboard: { view: true, export: false },
      users: { view: true, create: false, edit: false, delete: false, manageRoles: false },
      bots: { view: true, create: true, edit: true, delete: false, publish: false },
      agents: { view: true, create: false, edit: true, delete: false, assign: true },
      analytics: { view: true, export: false, advanced: false },
      knowledgeBase: { view: true, upload: true, edit: true, delete: false },
      settings: { view: true, edit: false, system: false },
      chat: { view: true, moderate: true, export: false }
    },
    operator: {
      dashboard: { view: true, export: false },
      users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
      bots: { view: true, create: false, edit: true, delete: false, publish: false },
      agents: { view: true, create: false, edit: false, delete: false, assign: false },
      analytics: { view: true, export: false, advanced: false },
      knowledgeBase: { view: true, upload: true, edit: false, delete: false },
      settings: { view: false, edit: false, system: false },
      chat: { view: true, moderate: false, export: false }
    },
    viewer: {
      dashboard: { view: true, export: false },
      users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
      bots: { view: true, create: false, edit: false, delete: false, publish: false },
      agents: { view: false, create: false, edit: false, delete: false, assign: false },
      analytics: { view: true, export: false, advanced: false },
      knowledgeBase: { view: true, upload: false, edit: false, delete: false },
      settings: { view: false, edit: false, system: false },
      chat: { view: true, moderate: false, export: false }
    },
    agent: {
      dashboard: { view: true, export: false },
      users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
      bots: { view: false, create: false, edit: false, delete: false, publish: false },
      agents: { view: false, create: false, edit: false, delete: false, assign: false },
      analytics: { view: false, export: false, advanced: false },
      knowledgeBase: { view: false, upload: false, edit: false, delete: false },
      settings: { view: false, edit: false, system: false },
      chat: { view: true, moderate: false, export: false }
    }
  };
  
  return rolePermissions[this.role] || rolePermissions.viewer;
};

userSchema.methods.hasPermission = function(module, action) {
  return this.permissions[module] && this.permissions[module][action];
};

userSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = Date.now();
  this.deletedBy = deletedBy;
  this.status = 'deleted';
  return this.save();
};

// Static Methods
userSchema.statics.findActive = function() {
  return this.find({ isDeleted: false, status: { $ne: 'deleted' } });
};

userSchema.statics.findByRole = function(role) {
  return this.findActive().where('role').equals(role);
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isDeleted: false });
};

userSchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.findActive().or([
    { email: searchRegex },
    { username: searchRegex },
    { 'profile.firstName': searchRegex },
    { 'profile.lastName': searchRegex },
    { 'profile.department': searchRegex },
    { 'profile.jobTitle': searchRegex }
  ]);
};

// Create model
const User = mongoose.model('User', userSchema);

module.exports = User;