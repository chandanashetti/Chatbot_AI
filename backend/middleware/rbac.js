const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Role-Based Access Control Middleware
 * Provides comprehensive permission checking and role hierarchy validation
 */

// Role hierarchy levels (lower number = higher privilege)
const ROLE_HIERARCHY = {
  'superadministrator': 1,
  'admin': 2,
  'manager': 3,
  'operator': 4,
  'viewer': 5,
  'agent': 6
};

// Permission definitions
const PERMISSIONS = {
  // Dashboard permissions
  'dashboard.view': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
  'dashboard.export': ['superadministrator', 'admin', 'manager'],
  
  // User management permissions
  'users.view': ['superadministrator', 'admin'],
  'users.create': ['superadministrator', 'admin'],
  'users.edit': ['superadministrator', 'admin'],
  'users.delete': ['superadministrator'],
  'users.manageRoles': ['superadministrator'],
  
  // Bot management permissions
  'bots.view': ['superadministrator', 'admin', 'manager', 'operator', 'viewer'],
  'bots.create': ['superadministrator', 'admin'],
  'bots.edit': ['superadministrator', 'admin', 'manager'],
  'bots.delete': ['superadministrator', 'admin'],
  'bots.publish': ['superadministrator', 'admin'],
  
  // Agent management permissions
  'agents.view': ['superadministrator', 'admin'],
  'agents.create': ['superadministrator', 'admin'],
  'agents.edit': ['superadministrator', 'admin'],
  'agents.delete': ['superadministrator', 'admin'],
  'agents.assign': ['superadministrator', 'admin', 'manager'],
  
  // Analytics permissions
  'analytics.view': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
  'analytics.export': ['superadministrator', 'admin', 'manager'],
  'analytics.advanced': ['superadministrator', 'admin', 'manager'],
  
  // Knowledge base permissions
  'knowledgeBase.view': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
  'knowledgeBase.upload': ['superadministrator', 'admin', 'manager', 'operator'],
  'knowledgeBase.edit': ['superadministrator', 'admin', 'manager'],
  'knowledgeBase.delete': ['superadministrator', 'admin'],
  
  // Settings permissions
  'settings.view': ['superadministrator', 'admin', 'manager'],
  'settings.edit': ['superadministrator', 'admin'],
  'settings.system': ['superadministrator'],
  
  // Chat management permissions
  'chat.view': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
  'chat.moderate': ['superadministrator', 'admin', 'manager', 'agent'],
  'chat.export': ['superadministrator', 'admin', 'manager'],
  
  // Role management permissions
  'roles.view': ['superadministrator', 'admin'],
  'roles.create': ['superadministrator'],
  'roles.edit': ['superadministrator'],
  'roles.delete': ['superadministrator'],
  'roles.assign': ['superadministrator', 'admin'],

  // Handoff management permissions
  'handoffs.view': ['superadministrator', 'admin', 'manager', 'agent'],
  'handoffs.accept': ['superadministrator', 'admin', 'agent'],
  'handoffs.reject': ['superadministrator', 'admin', 'agent'],
  'handoffs.manage': ['superadministrator', 'admin', 'manager']
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(role);
};

/**
 * Check if a role can manage another role (role hierarchy)
 */
const canManageRole = (currentRole, targetRole) => {
  const currentLevel = ROLE_HIERARCHY[currentRole] || 999;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 999;
  return currentLevel < targetLevel;
};

/**
 * Get all permissions for a role
 */
const getRolePermissions = (role) => {
  const permissions = {};
  
  Object.keys(PERMISSIONS).forEach(permission => {
    const [module, action] = permission.split('.');
    if (!permissions[module]) {
      permissions[module] = {};
    }
    permissions[module][action] = hasPermission(role, permission);
  });
  
  return permissions;
};

/**
 * Middleware to check if user has specific permission
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }
      
      if (!hasPermission(req.user.role, permission)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Permission '${permission}' required`,
            required: permission,
            currentRole: req.user.role
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_ERROR',
          message: 'Failed to check permissions'
        }
      });
    }
  };
};

/**
 * Middleware to check if user can manage a specific role
 */
const requireRoleManagement = (targetRoleParam = 'role') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }
      
      const targetRole = req.body[targetRoleParam] || req.params[targetRoleParam] || req.query[targetRoleParam];
      
      if (!targetRole) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TARGET_ROLE',
            message: 'Target role is required'
          }
        });
      }
      
      if (!canManageRole(req.user.role, targetRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE_HIERARCHY',
            message: `Cannot manage role '${targetRole}' with current role '${req.user.role}'`,
            currentRole: req.user.role,
            targetRole: targetRole
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Role management check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ROLE_MANAGEMENT_CHECK_ERROR',
          message: 'Failed to check role management permissions'
        }
      });
    }
  };
};

/**
 * Middleware to check if user can manage another user
 */
const requireUserManagement = (targetUserIdParam = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }
      
      const targetUserId = req.body[targetUserIdParam] || req.params[targetUserIdParam] || req.query[targetUserIdParam];
      
      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TARGET_USER',
            message: 'Target user ID is required'
          }
        });
      }
      
      // Users cannot manage themselves
      if (req.user.id === targetUserId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'CANNOT_MANAGE_SELF',
            message: 'Cannot perform this action on yourself'
          }
        });
      }
      
      // Get target user to check role hierarchy
      const targetUser = await User.findById(targetUserId).select('role');
      
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Target user not found'
          }
        });
      }
      
      if (!canManageRole(req.user.role, targetUser.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE_HIERARCHY',
            message: `Cannot manage user with role '${targetUser.role}' with current role '${req.user.role}'`,
            currentRole: req.user.role,
            targetRole: targetUser.role
          }
        });
      }
      
      req.targetUser = targetUser;
      next();
    } catch (error) {
      console.error('User management check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'USER_MANAGEMENT_CHECK_ERROR',
          message: 'Failed to check user management permissions'
        }
      });
    }
  };
};

/**
 * Middleware to require specific role(s)
 */
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_ROLE',
            message: `Required role: ${roles.join(' or ')}`,
            currentRole: req.user.role,
            requiredRoles: roles
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ROLE_CHECK_ERROR',
          message: 'Failed to check role'
        }
      });
    }
  };
};

/**
 * Middleware to populate user permissions from role
 */
const populateUserPermissions = async (req, res, next) => {
  try {
    if (req.user && req.user.role) {
      // Get role permissions
      const rolePermissions = getRolePermissions(req.user.role);
      
      // Get user-specific permissions from database
      const user = await User.findById(req.user.id).select('permissions');
      const userPermissions = user?.permissions || {};
      
      // Merge role permissions with user-specific permissions
      const effectivePermissions = {};
      
      Object.keys(rolePermissions).forEach(module => {
        effectivePermissions[module] = { ...rolePermissions[module] };
        
        if (userPermissions[module]) {
          Object.keys(userPermissions[module]).forEach(action => {
            if (userPermissions[module][action] !== undefined) {
              effectivePermissions[module][action] = userPermissions[module][action];
            }
          });
        }
      });
      
      req.user.permissions = effectivePermissions;
    }
    
    next();
  } catch (error) {
    console.error('Permission population error:', error);
    next(); // Continue without permissions if there's an error
  }
};

module.exports = {
  ROLE_HIERARCHY,
  PERMISSIONS,
  hasPermission,
  canManageRole,
  getRolePermissions,
  requirePermission,
  requireRoleManagement,
  requireUserManagement,
  requireRole,
  populateUserPermissions
};
