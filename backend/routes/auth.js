const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { populateUserPermissions, getRolePermissions } = require('../middleware/rbac');

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Helper function to set secure cookie
const setTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  res.cookie('jwt', token, cookieOptions);
};

// POST /api/auth/register - Register new user (public registration)
router.post('/register', async (req, res) => {
  try {
    console.log('👤 Processing user registration...');
    
    const { email, password, firstName, lastName, username } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, password, first name, and last name are required'
        }
      });
    }
    
    // Check if user already exists
    const searchConditions = [{ email: email.toLowerCase() }];
    if (username) {
      searchConditions.push({ username: username });
    }
    
    const existingUser = await User.findOne({
      $or: searchConditions,
      isDeleted: false
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email or username already exists'
        }
      });
    }
    
    // Create user with default viewer role
    const user = new User({
      email: email.toLowerCase(),
      username,
      password,
      role: 'viewer', // Default role for public registration
      profile: {
        firstName,
        lastName
      },
      status: 'pending' // Requires email verification
    });
    
    await user.save();
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // TODO: Send verification email
    console.log(`📧 Verification email should be sent to ${email} with token: ${verificationToken}`);
    
    console.log(`✅ User registered successfully: ${user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('❌ Error during registration:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_USER',
          message: 'User with this email or username already exists'
        }
      });
    }
    
    res.status(400).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Registration failed',
        details: error.message
      }
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Processing user login...');
    
    const { email, password, rememberMe = false } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }
    
    // Find user and include password for comparison
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      isDeleted: false 
    }).select('+password +security');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to multiple failed login attempts'
        }
      });
    }
    
    // Check if account is active
    if (user.status !== 'active') {
      if (user.status === 'pending') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_PENDING',
            message: 'Account is pending verification. Please check your email.'
          }
        });
      }
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is not active. Please contact an administrator.'
        }
      });
    }
    
    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      await user.incrementFailedLogin();
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }
    
    // Reset failed login attempts on successful login
    if (user.security.failedLoginAttempts > 0) {
      await user.resetFailedLogin();
    }
    
    // Update login statistics
    user.lastLogin = new Date();
    user.loginCount += 1;
    user.lastActivity = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set secure cookie if remember me is enabled
    if (rememberMe) {
      setTokenCookie(res, token);
    }
    
    // Populate user data for response
    await user.populate('profile.manager', 'profile.firstName profile.lastName email');
    
    // Get effective permissions (role + user-specific)
    const effectivePermissions = user.getEffectivePermissions();
    
    console.log(`✅ User logged in successfully: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          profile: user.profile,
          permissions: effectivePermissions,
          preferences: user.preferences,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('❌ Error during login:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Login failed',
        details: error.message
      }
    });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', (req, res) => {
  console.log('🚪 Processing user logout...');
  
  // Clear JWT cookie
  res.clearCookie('jwt');
  
  console.log('✅ User logged out successfully');
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('🔒 Processing forgot password request...');
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      });
    }
    
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      isDeleted: false,
      status: { $in: ['active', 'pending'] }
    });
    
    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`⚠️ Password reset requested for non-existent email: ${email}`);
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    
    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    // TODO: Send password reset email
    console.log(`📧 Password reset email should be sent to ${email} with token: ${resetToken}`);
    
    console.log(`✅ Password reset token generated for: ${user.email}`);
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('❌ Error processing forgot password:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FORGOT_PASSWORD_ERROR',
        message: 'Failed to process forgot password request',
        details: error.message
      }
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    console.log('🔑 Processing password reset...');
    
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Token and new password are required'
        }
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password must be at least 8 characters long'
        }
      });
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isDeleted: false
    }).select('+passwordResetToken +passwordResetExpires');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Password reset token is invalid or has expired'
        }
      });
    }
    
    // Update password and clear reset token
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.security.forcePasswordChange = false;
    
    await user.save();
    
    console.log(`✅ Password reset successfully for: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_PASSWORD_ERROR',
        message: 'Failed to reset password',
        details: error.message
      }
    });
  }
});

// POST /api/auth/verify-email - Verify email address
router.post('/verify-email', async (req, res) => {
  try {
    console.log('✉️ Processing email verification...');
    
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Verification token is required'
        }
      });
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
      isDeleted: false
    }).select('+emailVerificationToken +emailVerificationExpires');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Email verification token is invalid or has expired'
        }
      });
    }
    
    // Activate user and clear verification token
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save();
    
    console.log(`✅ Email verified successfully for: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Email verified successfully. Your account is now active.'
    });
  } catch (error) {
    console.error('❌ Error verifying email:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_VERIFICATION_ERROR',
        message: 'Failed to verify email',
        details: error.message
      }
    });
  }
});

// POST /api/auth/change-password - Change password (authenticated)
router.post('/change-password', async (req, res) => {
  try {
    console.log('🔐 Processing password change...');
    
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current password and new password are required'
        }
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'New password must be at least 8 characters long'
        }
      });
    }
    
    const user = await User.findOne({ 
      _id: userId, 
      isDeleted: false 
    }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect'
        }
      });
    }
    
    // Update password
    user.password = newPassword;
    user.security.forcePasswordChange = false;
    
    await user.save();
    
    console.log(`✅ Password changed successfully for: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHANGE_PASSWORD_ERROR',
        message: 'Failed to change password',
        details: error.message
      }
    });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, populateUserPermissions, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }
    
    const user = await User.findOne({ _id: userId, isDeleted: false })
      .populate('profile.manager', 'profile.firstName profile.lastName email')
      .lean();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to fetch user profile',
        details: error.message
      }
    });
  }
});

// PUT /api/auth/profile - Update current user profile
router.put('/profile', async (req, res) => {
  try {
    console.log('👤 Updating user profile...');
    
    const userId = req.user?.id;
    const { profile, preferences } = req.body;
    
    const user = await User.findOne({ _id: userId, isDeleted: false });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Update profile
    if (profile) {
      user.profile = { ...user.profile.toObject(), ...profile };
    }
    
    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences.toObject(), ...preferences };
    }
    
    user.lastActivity = new Date();
    await user.save();
    
    // Populate for response
    await user.populate('profile.manager', 'profile.firstName profile.lastName email');
    
    console.log(`✅ Profile updated for: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Failed to update profile',
        details: error.message
      }
    });
  }
});

module.exports = router;
