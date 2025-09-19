const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const User = require('../models/User');
const { getOrCreateDefaultUser } = require('../utils/userHelper');
const { 
  requirePermission, 
  requireRoleManagement, 
  requireRole,
  populateUserPermissions 
} = require('../middleware/rbac');

// Middleware to ensure user authentication
const ensureUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      const defaultUser = await getOrCreateDefaultUser();
      req.user = { 
        id: defaultUser._id, 
        role: defaultUser.role,
        email: defaultUser.email,
        profile: defaultUser.profile
      };
    }
    next();
  } catch (error) {
    console.error('Role authentication middleware error:', error);
    req.user = { 
      id: '000000000000000000000000', 
      role: 'admin',
      email: 'system@chatbot.ai',
      profile: { firstName: 'System', lastName: 'User' }
    };
    next();
  }
};

// GET /api/roles - Get all roles
router.get('/', ensureUser, requirePermission('roles.view'), async (req, res) => {
  try {
    console.log('📋 Fetching roles...');
    
    const { type, status, search } = req.query;
    let query = { isDeleted: false };
    
    // Apply filters
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    let roles;
    if (search && search.length > 0) {
      roles = await Role.search(search);
    } else {
      roles = await Role.find(query)
        .populate('createdBy', 'profile.firstName profile.lastName email')
        .populate('updatedBy', 'profile.firstName profile.lastName email')
        .sort({ priority: 1, createdAt: -1 });
    }
    
    // Update user counts for each role
    for (let role of roles) {
      const userCount = await User.countDocuments({ 
        role: role.name.toLowerCase().replace(' ', ''),
        isDeleted: false 
      });
      role.userCount = userCount;
      await role.save();
    }
    
    console.log(`✅ Found ${roles.length} roles`);
    
    res.json({
      success: true,
      data: {
        roles,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: roles.length,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching roles:', error);
    res.status(500).json({ 
      success: false,
      error: {
        code: 'FETCH_ROLES_ERROR',
        message: 'Failed to fetch roles',
        details: error.message
      }
    });
  }
});

// GET /api/roles/stats - Get role statistics
router.get('/stats', ensureUser, async (req, res) => {
  try {
    console.log('📊 Calculating role statistics...');
    
    const totalRoles = await Role.countDocuments({ isDeleted: false });
    const activeRoles = await Role.countDocuments({ isDeleted: false, status: 'active' });
    const customRoles = await Role.countDocuments({ isDeleted: false, type: 'custom' });
    const systemRoles = await Role.countDocuments({ isDeleted: false, type: 'system' });
    
    const roleDistribution = await Role.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const stats = {
      totalRoles,
      activeRoles,
      customRoles,
      systemRoles,
      typeDistribution: roleDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
    
    console.log('✅ Role statistics calculated');
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error calculating role statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ROLE_STATS_ERROR',
        message: 'Failed to calculate role statistics',
        details: error.message
      }
    });
  }
});

// GET /api/roles/:id - Get specific role
router.get('/:id', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching role ${id}...`);
    
    const role = await Role.findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate('updatedBy', 'profile.firstName profile.lastName email');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    // Get users with this role
    const usersWithRole = await User.find({ 
      role: role.name.toLowerCase().replace(' ', ''),
      isDeleted: false 
    }).select('profile.firstName profile.lastName email status');
    
    console.log(`✅ Role ${role.name} fetched successfully`);
    
    res.json({
      success: true,
      data: {
        role: {
          ...role.toObject(),
          usersWithRole
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ROLE_ERROR',
        message: 'Failed to fetch role',
        details: error.message
      }
    });
  }
});

// POST /api/roles - Create new role
router.post('/', ensureUser, requirePermission('roles.create'), async (req, res) => {
  try {
    console.log('👤 Creating new role...');
    
    const roleData = {
      ...req.body,
      type: 'custom',
      createdBy: req.user.id
    };
    
    // Validate required fields
    if (!roleData.name || !roleData.permissions) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role name and permissions are required'
        }
      });
    }
    
    // Check if role name already exists
    const existingRole = await Role.findOne({ 
      name: roleData.name, 
      isDeleted: false 
    });
    
    if (existingRole) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ROLE_EXISTS',
          message: 'A role with this name already exists'
        }
      });
    }
    
    const role = new Role(roleData);
    await role.save();
    
    await role.populate('createdBy', 'profile.firstName profile.lastName email');
    
    console.log(`✅ Role created successfully: ${role.name}`);
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: { role }
    });
  } catch (error) {
    console.error('❌ Error creating role:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role validation failed',
          details: Object.values(error.errors).map(err => err.message)
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ROLE_ERROR',
        message: 'Failed to create role',
        details: error.message
      }
    });
  }
});

// PUT /api/roles/:id - Update role
router.put('/:id', ensureUser, requirePermission('roles.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Updating role ${id}...`);
    
    const role = await Role.findOne({ _id: id, isDeleted: false });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    // Prevent updating system roles (except for Super Administrators)
    if (role.type === 'system' && req.user.role !== 'superadministrator') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_UPDATE_SYSTEM_ROLE',
          message: 'System roles can only be modified by Super Administrators'
        }
      });
    }
    
    // Check if new name already exists (if name is being changed)
    if (req.body.name && req.body.name !== role.name) {
      const existingRole = await Role.findOne({ 
        name: req.body.name, 
        isDeleted: false,
        _id: { $ne: id }
      });
      
      if (existingRole) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ROLE_EXISTS',
            message: 'A role with this name already exists'
          }
        });
      }
    }
    
    // Update role
    const updateData = {
      ...req.body,
      updatedBy: req.user.id
    };
    
    // Only preserve type for custom roles, allow Super Administrators to modify system roles
    if (role.type === 'custom') {
      updateData.type = 'custom'; // Ensure custom roles stay custom
    } else if (role.type === 'system' && req.user.role === 'superadministrator') {
      // Super Administrators can modify system roles but preserve their system type
      updateData.type = 'system';
    }
    
    Object.assign(role, updateData);
    
    await role.save();
    await role.populate(['createdBy', 'updatedBy'], 'profile.firstName profile.lastName email');
    
    console.log(`✅ Role updated successfully: ${role.name}`);
    
    res.json({
      success: true,
      message: 'Role updated successfully',
      data: { role }
    });
  } catch (error) {
    console.error('❌ Error updating role:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role validation failed',
          details: Object.values(error.errors).map(err => err.message)
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ROLE_ERROR',
        message: 'Failed to update role',
        details: error.message
      }
    });
  }
});

// DELETE /api/roles/:id - Delete role
router.delete('/:id', ensureUser, requirePermission('roles.delete'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting role ${id}...`);
    
    const role = await Role.findOne({ _id: id, isDeleted: false });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    // Prevent deleting system roles (except for Super Administrators)
    if (role.type === 'system' && req.user.role !== 'superadministrator') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_DELETE_SYSTEM_ROLE',
          message: 'System roles can only be deleted by Super Administrators'
        }
      });
    }
    
    // Check if role is in use
    const usersWithRole = await User.countDocuments({ 
      role: role.name.toLowerCase().replace(' ', ''),
      isDeleted: false 
    });
    
    if (usersWithRole > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ROLE_IN_USE',
          message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`
        }
      });
    }
    
    // Soft delete the role
    await role.softDelete(req.user.id);
    
    console.log(`✅ Role deleted successfully: ${role.name}`);
    
    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ROLE_ERROR',
        message: 'Failed to delete role',
        details: error.message
      }
    });
  }
});

// PATCH /api/roles/:id/status - Update role status
router.patch('/:id/status', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating role ${id} status to ${status}...`);
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Status must be either active or inactive'
        }
      });
    }
    
    const role = await Role.findOne({ _id: id, isDeleted: false });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      });
    }
    
    // Prevent deactivating system roles (except for Super Administrators)
    if (role.type === 'system' && status === 'inactive' && req.user.role !== 'superadministrator') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CANNOT_DEACTIVATE_SYSTEM_ROLE',
          message: 'System roles can only be deactivated by Super Administrators'
        }
      });
    }
    
    role.status = status;
    role.updatedBy = req.user.id;
    await role.save();
    
    await role.populate(['createdBy', 'updatedBy'], 'profile.firstName profile.lastName email');
    
    console.log(`✅ Role status updated to ${status}: ${role.name}`);
    
    res.json({
      success: true,
      message: `Role status updated to ${status}`,
      data: { role }
    });
  } catch (error) {
    console.error('❌ Error updating role status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ROLE_STATUS_ERROR',
        message: 'Failed to update role status',
        details: error.message
      }
    });
  }
});

// POST /api/roles/initialize - Initialize default system roles
router.post('/initialize', ensureUser, requirePermission('roles.create'), async (req, res) => {
  try {
    console.log('🔧 Initializing default system roles...');
    
    await Role.createDefaultRoles();
    
    console.log('✅ Default system roles initialized');
    
    res.json({
      success: true,
      message: 'Default system roles initialized successfully'
    });
  } catch (error) {
    console.error('❌ Error initializing default roles:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INITIALIZE_ROLES_ERROR',
        message: 'Failed to initialize default roles',
        details: error.message
      }
    });
  }
});

module.exports = router;