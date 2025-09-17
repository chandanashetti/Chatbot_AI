const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Initialize default system roles and create initial admin user
 */
const initializeSystem = async () => {
  try {
    console.log('🚀 Initializing system...');

    // Step 1: Create default roles
    console.log('📋 Creating default system roles...');
    await Role.createDefaultRoles();
    console.log('✅ Default roles created successfully');

    // Step 2: Create initial admin user if none exists
    console.log('👤 Checking for existing admin users...');

    const existingAdmin = await User.findOne({
      role: { $in: ['Super Administrator', 'Administrator', 'superadmin', 'admin'] },
      isDeleted: false,
      status: 'active'
    });

    if (!existingAdmin) {
      console.log('🔧 Creating initial admin user...');

      // Get the Super Administrator role
      const superAdminRole = await Role.findOne({
        name: 'Super Administrator',
        type: 'system',
        isDeleted: false,
        status: 'active'
      });

      if (!superAdminRole) {
        throw new Error('Super Administrator role not found. Cannot create admin user.');
      }

      // Create initial admin user
      const adminUser = new User({
        email: process.env.ADMIN_EMAIL || 'admin@chatbot.local',
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        username: 'admin',
        role: 'Super Administrator',
        status: 'active',
        profile: {
          firstName: 'System',
          lastName: 'Administrator'
        },
        permissions: superAdminRole.permissions.toObject(),
        // Set as system-created user
        createdBy: null
      });

      await adminUser.save();

      console.log('✅ Initial admin user created:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
      console.log('   ⚠️  Please change the default password after first login!');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('🎉 System initialization completed successfully');
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    throw error;
  }
};

/**
 * Update user count for all roles based on actual user data
 */
const updateRoleUserCounts = async () => {
  try {
    console.log('📊 Updating role user counts...');

    const roles = await Role.find({ isDeleted: false });

    for (const role of roles) {
      const userCount = await User.countDocuments({
        role: role.name,
        isDeleted: false,
        status: { $ne: 'deleted' }
      });

      // Update the role's user count
      role.userCount = userCount;
      await role.save();
    }

    console.log('✅ Role user counts updated successfully');
  } catch (error) {
    console.error('❌ Failed to update role user counts:', error);
    throw error;
  }
};

/**
 * Validate and fix user permissions based on their roles
 */
const validateUserPermissions = async () => {
  try {
    console.log('🔒 Validating user permissions...');

    const users = await User.find({ isDeleted: false });
    let updatedCount = 0;

    for (const user of users) {
      try {
        // Re-validate and set permissions based on current role
        await user.validateAndSetRolePermissions();
        await user.save();
        updatedCount++;
      } catch (error) {
        console.warn(`⚠️  Failed to update permissions for user ${user.email}:`, error.message);
      }
    }

    console.log(`✅ Updated permissions for ${updatedCount} users`);
  } catch (error) {
    console.error('❌ Failed to validate user permissions:', error);
    throw error;
  }
};

/**
 * Clean up orphaned or invalid data
 */
const cleanupSystem = async () => {
  try {
    console.log('🧹 Cleaning up system data...');

    // Remove users with invalid roles that don't exist in Role collection
    const validRoles = await Role.find({ isDeleted: false, status: 'active' }).select('name');
    const validRoleNames = validRoles.map(role => role.name);

    const usersWithInvalidRoles = await User.find({
      role: { $nin: validRoleNames },
      isDeleted: false
    });

    for (const user of usersWithInvalidRoles) {
      console.log(`⚠️  User ${user.email} has invalid role: ${user.role}. Setting to Viewer.`);
      user.role = 'Viewer';
      await user.validateAndSetRolePermissions();
      await user.save();
    }

    console.log('✅ System cleanup completed');
  } catch (error) {
    console.error('❌ System cleanup failed:', error);
    throw error;
  }
};

/**
 * Full system check and maintenance
 */
const performSystemMaintenance = async () => {
  try {
    console.log('🔧 Starting system maintenance...');

    await initializeSystem();
    await updateRoleUserCounts();
    await validateUserPermissions();
    await cleanupSystem();

    console.log('🎉 System maintenance completed successfully');
  } catch (error) {
    console.error('❌ System maintenance failed:', error);
    throw error;
  }
};

/**
 * Check if system is properly initialized
 */
const isSystemInitialized = async () => {
  try {
    // Check if default roles exist
    const roleCount = await Role.countDocuments({ type: 'system', isDeleted: false });

    // Check if admin user exists
    const adminExists = await User.findOne({
      role: { $in: ['Super Administrator', 'Administrator', 'superadmin', 'admin'] },
      isDeleted: false,
      status: 'active'
    });

    return roleCount >= 6 && adminExists; // 6 default system roles
  } catch (error) {
    console.error('Error checking system initialization:', error);
    return false;
  }
};

module.exports = {
  initializeSystem,
  updateRoleUserCounts,
  validateUserPermissions,
  cleanupSystem,
  performSystemMaintenance,
  isSystemInitialized
};