const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Validates JWT token format
 */
const isValidJWTFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Check if each part is base64url encoded (basic validation)
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => part.length > 0 && base64UrlRegex.test(part));
};

/**
 * Safely extracts token from request
 */
const extractToken = (req) => {
  let token = null;

  // Priority 1: Authorization header
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    if (authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.slice(7).trim(); // Remove 'Bearer '
      if (isValidJWTFormat(bearerToken)) {
        token = bearerToken;
      }
    }
  }

  // Priority 2: Cookie fallback (only if no valid header token)
  if (!token && req.cookies && req.cookies.jwt) {
    const cookieToken = req.cookies.jwt.trim();
    if (isValidJWTFormat(cookieToken)) {
      token = cookieToken;
    }
  }

  return token;
};

/**
 * Clears invalid tokens from cookies
 */
const clearInvalidTokens = (res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract and validate token format
    const token = extractToken(req);

    if (!token) {
      // Clear any invalid cookies
      if (req.cookies && req.cookies.jwt && !isValidJWTFormat(req.cookies.jwt)) {
        clearInvalidTokens(res);
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access denied. No valid token provided.'
        }
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get current user with permissions
    const user = await User.findById(decoded.id)
      .select('email role status isDeleted profile permissions +security');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Token is valid but user not found'
        }
      });
    }

    // Check if user is deleted
    if (user.isDeleted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_DELETED',
          message: 'User account has been deleted'
        }
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      let message = 'User account is not active';
      if (user.status === 'pending') {
        message = 'Please verify your email address to activate your account';
      } else if (user.status === 'suspended') {
        message = 'User account has been suspended';
      }

      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message
        }
      });
    }

    // Check if account is locked
    if (user.security && user.security.lockUntil && user.security.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to multiple failed login attempts'
        }
      });
    }

    // Check if password was changed after token was issued
    if (user.security && user.security.passwordChangedAt) {
      const passwordChangedTimestamp = parseInt(user.security.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < passwordChangedTimestamp) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Password was changed. Please login again.'
          }
        });
      }
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Clear invalid cookies for JWT-related errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      clearInvalidTokens(res);
    }

    // Log error for debugging (but not sensitive token data)
    console.error('Authentication middleware error:', {
      name: error.name,
      message: error.message,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: new Date().toISOString()
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Authentication token is invalid. Please login again.'
        }
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired. Please login again.'
        }
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_NOT_ACTIVE',
          message: 'Authentication token is not yet active. Please login again.'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Role-based Authorization Middleware Factory
 * Creates middleware that checks if user has required role(s)
 */
const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      const userRole = req.user.role;

      // Convert user role to normalized format for comparison
      const normalizedUserRole = userRole.toLowerCase().replace(/\s+/g, '');

      // Normalize allowed roles for comparison
      const normalizedAllowedRoles = allowedRoles.map(role =>
        role.toLowerCase().replace(/\s+/g, '')
      );

      // Check if user's role is in allowed roles
      if (normalizedAllowedRoles.includes(normalizedUserRole)) {
        return next();
      }

      // If direct role check fails, check role hierarchy from database
      try {
        const userRoleDoc = await Role.findOne({
          $or: [
            { name: userRole },
            { name: new RegExp(`^${userRole}$`, 'i') }
          ],
          isDeleted: false,
          status: 'active'
        });

        if (userRoleDoc) {
          // Check if any allowed role has lower or equal priority (higher privilege)
          const allowedRoleDocs = await Role.find({
            name: { $in: allowedRoles },
            isDeleted: false,
            status: 'active'
          });

          const userPriority = userRoleDoc.priority;
          const hasPermission = allowedRoleDocs.some(role => userPriority <= role.priority);

          if (hasPermission) {
            return next();
          }
        }
      } catch (dbError) {
        console.error('Role hierarchy check error:', dbError);
      }

      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}, your role: ${userRole}`
        }
      });
    } catch (error) {
      console.error('Authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization check failed',
          details: error.message
        }
      });
    }
  };
};

/**
 * Permission-based Authorization Middleware Factory
 * Creates middleware that checks if user has required permission(s)
 */
const requirePermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      // Check if user has the required permission
      const hasPermission = req.user.permissions &&
                           req.user.permissions[module] &&
                           req.user.permissions[module][action];

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Access denied. Required permission: ${module}.${action}`
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_ERROR',
          message: 'Permission check failed',
          details: error.message
        }
      });
    }
  };
};

/**
 * Multiple Permissions Check Middleware Factory
 * Creates middleware that checks if user has ALL required permissions
 */
const requirePermissions = (permissionChecks) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      const missingPermissions = [];

      for (const { module, action } of permissionChecks) {
        const hasPermission = req.user.permissions &&
                             req.user.permissions[module] &&
                             req.user.permissions[module][action];

        if (!hasPermission) {
          missingPermissions.push(`${module}.${action}`);
        }
      }

      if (missingPermissions.length > 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Access denied. Missing permissions: ${missingPermissions.join(', ')}`
          }
        });
      }

      next();
    } catch (error) {
      console.error('Multiple permissions middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_ERROR',
          message: 'Permission check failed',
          details: error.message
        }
      });
    }
  };
};

/**
 * Owner or Admin Authorization Middleware
 * Allows access if user owns the resource or has admin privileges
 */
const ownerOrAdmin = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      const userRole = req.user.role.toLowerCase().replace(/\s+/g, '');
      const userId = req.user._id.toString();

      // Allow if user is admin or super admin
      if (['admin', 'superadmin', 'administrator', 'superadministrator'].includes(userRole)) {
        return next();
      }

      // Allow if user owns the resource
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      if (resourceUserId && resourceUserId.toString() === userId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied. You can only access your own resources or need admin privileges.'
        }
      });
    } catch (error) {
      console.error('Owner or admin middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization check failed',
          details: error.message
        }
      });
    }
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Extract and validate token format
    const token = extractToken(req);

    if (!token) {
      // Clear any invalid cookies silently
      if (req.cookies && req.cookies.jwt && !isValidJWTFormat(req.cookies.jwt)) {
        clearInvalidTokens(res);
      }
      return next(); // No token, continue without user
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get current user with permissions
    const user = await User.findById(decoded.id)
      .select('email role status isDeleted profile permissions +security');

    if (user && !user.isDeleted && user.status === 'active') {
      // Check account lock status
      if (user.security && user.security.lockUntil && user.security.lockUntil > Date.now()) {
        return next(); // Account locked, continue without user
      }

      req.user = user;
    }

    next();
  } catch (error) {
    // Clear invalid cookies for JWT-related errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      clearInvalidTokens(res);
    }

    // Silently ignore authentication errors in optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  requirePermissions,
  ownerOrAdmin,
  optionalAuth
};