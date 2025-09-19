const mongoose = require('mongoose');

// Role Permissions Schema (same as User permissions but for role templates)
const rolePermissionsSchema = new mongoose.Schema({
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
  },

  // Handoff management permissions
  handoffs: {
    view: { type: Boolean, default: false },
    accept: { type: Boolean, default: false },
    reject: { type: Boolean, default: false },
    manage: { type: Boolean, default: false }
  },

  // Marketing/Email Campaign permissions
  marketing: {
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    send: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false }
  }
}, { _id: false });

// Main Role Schema
const roleSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    match: [/^[a-zA-Z0-9\s_-]+$/, 'Role name can only contain letters, numbers, spaces, underscores, and hyphens']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Role Type
  type: {
    type: String,
    enum: ['system', 'custom'],
    default: 'custom'
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Permissions
  permissions: {
    type: rolePermissionsSchema,
    required: true
  },
  
  // Role hierarchy/priority (lower number = higher priority)
  priority: {
    type: Number,
    default: 100,
    min: 1,
    max: 1000
  },
  
  // Color for UI display
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color']
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Usage tracking
  userCount: {
    type: Number,
    default: 0
  },
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date
  },
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
// name index is created automatically by unique: true
roleSchema.index({ type: 1 });
roleSchema.index({ status: 1 });
roleSchema.index({ priority: 1 });
roleSchema.index({ isDeleted: 1 });
roleSchema.index({ createdAt: -1 });

// Virtual for checking if role is system role
roleSchema.virtual('isSystemRole').get(function() {
  return this.type === 'system';
});

// Pre-save middleware
roleSchema.pre('save', function(next) {
  // Update priority based on permissions if not explicitly set
  if (this.isNew && this.priority === 100) {
    this.priority = this.calculatePriority();
  }
  
  next();
});

// Instance Methods
roleSchema.methods.hasPermission = function(module, action) {
  return this.permissions[module] && this.permissions[module][action];
};

roleSchema.methods.calculatePriority = function() {
  let score = 0;
  const permissions = this.permissions.toObject();
  
  // Calculate priority based on permission count and type
  Object.keys(permissions).forEach(module => {
    Object.keys(permissions[module]).forEach(action => {
      if (permissions[module][action]) {
        score += 1;
        // System permissions are weighted higher
        if (module === 'settings' && action === 'system') score += 5;
        if (module === 'users' && action === 'manageRoles') score += 3;
        if (action === 'delete') score += 2;
      }
    });
  });
  
  // Convert to priority (lower number = higher priority)
  return Math.max(1, 100 - score);
};

roleSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = Date.now();
  this.deletedBy = deletedBy;
  this.status = 'inactive';
  return this.save();
};

// Static Methods
roleSchema.statics.findActive = function() {
  return this.find({ isDeleted: false, status: 'active' });
};

roleSchema.statics.findByType = function(type) {
  return this.findActive().where('type').equals(type);
};

roleSchema.statics.findCustomRoles = function() {
  return this.findByType('custom');
};

roleSchema.statics.findSystemRoles = function() {
  return this.findByType('system');
};

roleSchema.statics.search = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.findActive().or([
    { name: searchRegex },
    { description: searchRegex }
  ]);
};

// Create default system roles
roleSchema.statics.createDefaultRoles = async function() {
  const systemRoles = [
    {
      name: 'Super Administrator',
      description: 'Full system access with all permissions including system administration',
      type: 'system',
      priority: 1,
      color: '#DC2626',
      permissions: {
        dashboard: { view: true, export: true },
        users: { view: true, create: true, edit: true, delete: true, manageRoles: true },
        bots: { view: true, create: true, edit: true, delete: true, publish: true },
        agents: { view: true, create: true, edit: true, delete: true, assign: true },
        analytics: { view: true, export: true, advanced: true },
        knowledgeBase: { view: true, upload: true, edit: true, delete: true },
        settings: { view: true, edit: true, system: true },
        chat: { view: true, moderate: true, export: true },
        handoffs: { view: true, accept: true, reject: true, manage: true },
        marketing: { view: true, create: true, edit: true, delete: true, send: true, analytics: true }
      }
    },
    {
      name: 'Administrator',
      description: 'Administrative access with limited system permissions',
      type: 'system',
      priority: 2,
      color: '#DC2626',
      permissions: {
        dashboard: { view: true, export: true },
        users: { view: true, create: true, edit: true, delete: false, manageRoles: false },
        bots: { view: true, create: true, edit: true, delete: true, publish: true },
        agents: { view: true, create: true, edit: true, delete: false, assign: true },
        analytics: { view: true, export: true, advanced: true },
        knowledgeBase: { view: true, upload: true, edit: true, delete: false },
        settings: { view: true, edit: true, system: false },
        chat: { view: true, moderate: true, export: true },
        handoffs: { view: true, accept: true, reject: true, manage: true },
        marketing: { view: true, create: true, edit: true, delete: false, send: true, analytics: true }
      }
    },
    {
      name: 'Manager',
      description: 'Management level access for team supervision',
      type: 'system',
      priority: 3,
      color: '#F59E0B',
      permissions: {
        dashboard: { view: true, export: false },
        users: { view: true, create: false, edit: false, delete: false, manageRoles: false },
        bots: { view: true, create: true, edit: true, delete: false, publish: false },
        agents: { view: true, create: false, edit: true, delete: false, assign: true },
        analytics: { view: true, export: false, advanced: false },
        knowledgeBase: { view: true, upload: true, edit: true, delete: false },
        settings: { view: true, edit: false, system: false },
        chat: { view: true, moderate: true, export: false },
        handoffs: { view: true, accept: false, reject: false, manage: true },
        marketing: { view: true, create: true, edit: true, delete: false, send: true, analytics: true }
      }
    },
    {
      name: 'Operator',
      description: 'Operational access for daily tasks',
      type: 'system',
      priority: 4,
      color: '#10B981',
      permissions: {
        dashboard: { view: true, export: false },
        users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
        bots: { view: true, create: false, edit: true, delete: false, publish: false },
        agents: { view: true, create: false, edit: false, delete: false, assign: false },
        analytics: { view: true, export: false, advanced: false },
        knowledgeBase: { view: true, upload: true, edit: false, delete: false },
        settings: { view: false, edit: false, system: false },
        chat: { view: true, moderate: false, export: false },
        handoffs: { view: true, accept: false, reject: false, manage: false },
        marketing: { view: true, create: false, edit: false, delete: false, send: false, analytics: true }
      }
    },
    {
      name: 'Viewer',
      description: 'Read-only access for viewing information',
      type: 'system',
      priority: 5,
      color: '#6B7280',
      permissions: {
        dashboard: { view: true, export: false },
        users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
        bots: { view: true, create: false, edit: false, delete: false, publish: false },
        agents: { view: false, create: false, edit: false, delete: false, assign: false },
        analytics: { view: true, export: false, advanced: false },
        knowledgeBase: { view: true, upload: false, edit: false, delete: false },
        settings: { view: false, edit: false, system: false },
        chat: { view: true, moderate: false, export: false },
        handoffs: { view: true, accept: false, reject: false, manage: false },
        marketing: { view: false, create: false, edit: false, delete: false, send: false, analytics: false }
      }
    },
    {
      name: 'Agent',
      description: 'Chat agent access for customer support',
      type: 'system',
      priority: 6,
      color: '#8B5CF6',
      permissions: {
        dashboard: { view: true, export: false },
        users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
        bots: { view: false, create: false, edit: false, delete: false, publish: false },
        agents: { view: false, create: false, edit: false, delete: false, assign: false },
        analytics: { view: true, export: false, advanced: false },
        knowledgeBase: { view: true, upload: false, edit: false, delete: false },
        settings: { view: false, edit: false, system: false },
        chat: { view: true, moderate: true, export: false },
        handoffs: { view: true, accept: true, reject: true, manage: false },
        marketing: { view: false, create: false, edit: false, delete: false, send: false, analytics: false }
      }
    }
  ];

  for (const roleData of systemRoles) {
    const existingRole = await this.findOne({ name: roleData.name, type: 'system' });
    if (!existingRole) {
      // Create system role with a system user ID
      const systemUserId = '000000000000000000000000';
      const role = new this({
        ...roleData,
        createdBy: systemUserId
      });
      await role.save();
    }
  }
};

// Create model
const Role = mongoose.model('Role', roleSchema);

module.exports = Role;