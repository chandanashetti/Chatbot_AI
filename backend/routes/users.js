const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to build query filters
const buildFilters = (query) => {
  const filters = { isDeleted: false };
  
  if (query.status && query.status !== 'all') {
    filters.status = query.status;
  }
  
  if (query.role && query.role !== 'all') {
    filters.role = query.role;
  }
  
  if (query.department) {
    filters['profile.department'] = new RegExp(query.department, 'i');
  }
  
  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filters.$or = [
      { email: searchRegex },
      { username: searchRegex },
      { 'profile.firstName': searchRegex },
      { 'profile.lastName': searchRegex },
      { 'profile.department': searchRegex },
      { 'profile.jobTitle': searchRegex }
    ];
  }
  
  return filters;
};

// Helper function to calculate user statistics
const calculateUserStats = async () => {
  const [totalUsers, activeUsers, pendingUsers, suspendedUsers, roleStats] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    User.countDocuments({ isDeleted: false, status: 'active' }),
    User.countDocuments({ isDeleted: false, status: 'pending' }),
    User.countDocuments({ isDeleted: false, status: 'suspended' }),
    User.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])
  ]);
  
  const roleStatsObj = {};
  roleStats.forEach(stat => {
    roleStatsObj[stat._id] = stat.count;
  });
  
  return {
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
    roleDistribution: roleStatsObj
  };
};

// GET /api/users - Get all users with filtering and pagination
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching users...');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const filters = buildFilters(req.query);
    
    const [users, totalCount] = await Promise.all([
      User.find(filters)
        .populate('createdBy', 'profile.firstName profile.lastName email')
        .populate('updatedBy', 'profile.firstName profile.lastName email')
        .populate('invitedBy', 'profile.firstName profile.lastName email')
        .populate('profile.manager', 'profile.firstName profile.lastName email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filters)
    ]);
    
    console.log(`✅ Found ${users.length} users (${totalCount} total)`);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_USERS_ERROR',
        message: 'Failed to fetch users',
        details: error.message
      }
    });
  }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Calculating user statistics...');
    const stats = await calculateUserStats();
    
    console.log('✅ User statistics calculated');
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error calculating user stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_STATS_ERROR',
        message: 'Failed to calculate user statistics',
        details: error.message
      }
    });
  }
});

// GET /api/users/search - Search users
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { users: [] }
      });
    }
    
    console.log(`🔍 Searching users for: "${q}"`);
    
    const users = await User.search(q)
      .select('email profile.firstName profile.lastName profile.avatar role status')
      .limit(parseInt(limit))
      .lean();
    
    console.log(`✅ Found ${users.length} users matching search`);
    
    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('❌ Error searching users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_SEARCH_ERROR',
        message: 'Failed to search users',
        details: error.message
      }
    });
  }
});

// GET /api/users/roles/list - Get available roles
router.get('/roles/list', (req, res) => {
  const roles = [
    { value: 'superadmin', label: 'Super Admin', description: 'Full system access' },
    { value: 'admin', label: 'Admin', description: 'Administrative access' },
    { value: 'manager', label: 'Manager', description: 'Management operations' },
    { value: 'operator', label: 'Operator', description: 'Operational tasks' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
    { value: 'agent', label: 'Agent', description: 'Agent-specific operations' }
  ];
  
  res.json({
    success: true,
    data: { roles }
  });
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`📋 Fetching user ${req.params.id}...`);
    
    const user = await User.findOne({ _id: req.params.id, isDeleted: false })
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('updatedBy', 'profile.firstName profile.lastName email')
      .populate('invitedBy', 'profile.firstName profile.lastName email')
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
    
    console.log(`✅ Found user: ${user.email}`);
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_USER_ERROR',
        message: 'Failed to fetch user',
        details: error.message
      }
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    console.log('👤 Creating new user...');
    
    const {
      email,
      username,
      password,
      role,
      profile,
      permissions,
      preferences,
      sendInvite = true
    } = req.body;
    
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
    
    // Generate temporary password if not provided
    const userPassword = password || crypto.randomBytes(8).toString('hex');
    
    // Create user
    const user = new User({
      email: email.toLowerCase(),
      username,
      password: userPassword,
      role: role || 'viewer',
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        department: profile.department,
        jobTitle: profile.jobTitle,
        manager: profile.manager,
        timezone: profile.timezone || 'UTC',
        language: profile.language || 'en'
      },
      permissions: permissions || undefined, // Will use role defaults
      preferences: preferences || undefined, // Will use defaults
      status: sendInvite ? 'pending' : 'active',
      createdBy: req.user?.id,
      invitedBy: req.user?.id
    });
    
    await user.save();
    
    // Generate email verification token if sending invite
    if (sendInvite) {
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();
      
      // TODO: Send invitation email with verification token
      console.log(`📧 Invitation email should be sent to ${email} with token: ${verificationToken}`);
    }
    
    // Populate references for response
    await user.populate('createdBy', 'profile.firstName profile.lastName email');
    
    console.log(`✅ User created successfully: ${user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { 
        user,
        temporaryPassword: !password ? userPassword : undefined
      }
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
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
        code: 'CREATE_USER_ERROR',
        message: 'Failed to create user',
        details: error.message
      }
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    console.log(`📝 Updating user ${req.params.id}...`);
    
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    const {
      email,
      username,
      role,
      status,
      profile,
      permissions,
      preferences,
      security
    } = req.body;
    
    // Update fields
    if (email && email !== user.email) {
      // Check if new email is already taken
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: user._id },
        isDeleted: false 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_TAKEN',
            message: 'Email is already taken by another user'
          }
        });
      }
      
      user.email = email.toLowerCase();
    }
    
    if (username && username !== user.username) {
      // Check if new username is already taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: user._id },
        isDeleted: false 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_TAKEN',
            message: 'Username is already taken by another user'
          }
        });
      }
      
      user.username = username;
    }
    
    if (role) user.role = role;
    if (status) user.status = status;
    
    // Update profile
    if (profile) {
      user.profile = { ...user.profile.toObject(), ...profile };
    }
    
    // Update permissions
    if (permissions) {
      user.permissions = { ...user.permissions.toObject(), ...permissions };
    }
    
    // Update preferences
    if (preferences) {
      user.preferences = { ...user.preferences.toObject(), ...preferences };
    }
    
    // Update security settings
    if (security) {
      user.security = { ...user.security.toObject(), ...security };
    }
    
    user.updatedBy = req.user?.id;
    
    await user.save();
    
    // Populate references for response
    await user.populate([
      { path: 'updatedBy', select: 'profile.firstName profile.lastName email' },
      { path: 'profile.manager', select: 'profile.firstName profile.lastName email' }
    ]);
    
    console.log(`✅ User updated successfully: ${user.email}`);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_USER_ERROR',
        message: 'Failed to update user',
        details: error.message
      }
    });
  }
});

// PATCH /api/users/:id/status - Update user status
router.patch('/:id/status', async (req, res) => {
  try {
    console.log(`🔄 Updating status for user ${req.params.id}...`);
    
    const { status } = req.body;
    
    if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid status value'
        }
      });
    }
    
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { 
        status,
        updatedBy: req.user?.id
      },
      { new: true, runValidators: true }
    ).populate('updatedBy', 'profile.firstName profile.lastName email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    console.log(`✅ User status updated to ${status}: ${user.email}`);
    
    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { user }
    });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_STATUS_ERROR',
        message: 'Failed to update user status',
        details: error.message
      }
    });
  }
});

// PATCH /api/users/:id/password - Update user password
router.patch('/:id/password', async (req, res) => {
  try {
    console.log(`🔒 Updating password for user ${req.params.id}...`);
    
    const { newPassword, currentPassword, forceChange = false } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password must be at least 8 characters long'
        }
      });
    }
    
    const user = await User.findOne({ _id: req.params.id, isDeleted: false }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Verify current password if not admin/superadmin
    if (currentPassword && req.user?.id !== req.params.id) {
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
    }
    
    user.password = newPassword;
    user.security.forcePasswordChange = forceChange;
    user.updatedBy = req.user?.id;
    
    await user.save();
    
    console.log(`✅ Password updated for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating password:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_PASSWORD_ERROR',
        message: 'Failed to update password',
        details: error.message
      }
    });
  }
});

// POST /api/users/:id/avatar - Upload user avatar
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    console.log(`🖼️ Uploading avatar for user ${req.params.id}...`);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No avatar file provided'
        }
      });
    }
    
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!user) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Delete old avatar if exists
    if (user.profile.avatar) {
      const oldAvatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.profile.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Update user with new avatar path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.profile.avatar = avatarUrl;
    user.updatedBy = req.user?.id;
    
    await user.save();
    
    console.log(`✅ Avatar uploaded for user: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { 
        avatarUrl,
        user: {
          id: user._id,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(400).json({
      success: false,
      error: {
        code: 'AVATAR_UPLOAD_ERROR',
        message: 'Failed to upload avatar',
        details: error.message
      }
    });
  }
});

// POST /api/users/:id/resend-invitation - Resend user invitation
router.post('/:id/resend-invitation', async (req, res) => {
  try {
    console.log(`📧 Resending invitation for user ${req.params.id}...`);
    
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_NOT_PENDING',
          message: 'User is not in pending status'
        }
      });
    }
    
    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // TODO: Send invitation email with verification token
    console.log(`📧 Invitation email should be sent to ${user.email} with token: ${verificationToken}`);
    
    console.log(`✅ Invitation resent to: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error('❌ Error resending invitation:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'RESEND_INVITATION_ERROR',
        message: 'Failed to resend invitation',
        details: error.message
      }
    });
  }
});

// DELETE /api/users/:id - Soft delete user
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Deleting user ${req.params.id}...`);
    
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Prevent self-deletion
    if (user._id.toString() === req.user?.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'You cannot delete your own account'
        }
      });
    }
    
    await user.softDelete(req.user?.id);
    
    console.log(`✅ User soft deleted: ${user.email}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'DELETE_USER_ERROR',
        message: 'Failed to delete user',
        details: error.message
      }
    });
  }
});

// POST /api/users/:id/restore - Restore soft deleted user
router.post('/:id/restore', async (req, res) => {
  try {
    console.log(`♻️ Restoring user ${req.params.id}...`);
    
    const user = await User.findOne({ _id: req.params.id, isDeleted: true });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Deleted user not found'
        }
      });
    }
    
    user.isDeleted = false;
    user.deletedAt = undefined;
    user.deletedBy = undefined;
    user.status = 'inactive'; // Restore as inactive for security
    user.updatedBy = req.user?.id;
    
    await user.save();
    
    console.log(`✅ User restored: ${user.email}`);
    
    res.json({
      success: true,
      message: 'User restored successfully',
      data: { user }
    });
  } catch (error) {
    console.error('❌ Error restoring user:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'RESTORE_USER_ERROR',
        message: 'Failed to restore user',
        details: error.message
      }
    });
  }
});

module.exports = router;
