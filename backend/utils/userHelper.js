const User = require('../models/User');

/**
 * Helper function to get or create a default user for development
 * This centralizes the user creation logic to avoid duplication
 */
const getOrCreateDefaultUser = async () => {
  try {
    // Try to find an existing user first
    let defaultUser = await User.findOne({ isDeleted: false });
    
    if (!defaultUser) {
      // Create a default user for development
      defaultUser = new User({
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      });
      await defaultUser.save();
      console.log('✅ Created default admin user for development');
    }
    
    return defaultUser;
  } catch (error) {
    console.error('Error creating default user:', error);
    // Return a fallback user object with a valid ObjectId format
    return {
      _id: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      },
      role: 'admin'
    };
  }
};

/**
 * Middleware to ensure user authentication with fallback to default user
 */
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
    console.error('User authentication middleware error:', error);
    // Fallback to a basic user object
    req.user = { 
      id: '507f1f77bcf86cd799439011', 
      role: 'admin',
      email: 'admin@example.com',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      }
    };
    next();
  }
};

module.exports = {
  getOrCreateDefaultUser,
  ensureUser
};