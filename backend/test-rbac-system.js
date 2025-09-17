const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const { 
  hasPermission, 
  canManageRole, 
  getRolePermissions,
  ROLE_HIERARCHY,
  PERMISSIONS 
} = require('./middleware/rbac');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_ai',
  testUsers: [
    {
      email: 'superadmin@test.com',
      password: 'Test123!',
      role: 'superadministrator',
      profile: { firstName: 'Super', lastName: 'Admin' }
    },
    {
      email: 'admin@test.com',
      password: 'Test123!',
      role: 'admin',
      profile: { firstName: 'Regular', lastName: 'Admin' }
    },
    {
      email: 'agent@test.com',
      password: 'Test123!',
      role: 'agent',
      profile: { firstName: 'Test', lastName: 'Agent' }
    }
  ]
};

async function connectDB() {
  try {
    await mongoose.connect(TEST_CONFIG.mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function cleanup() {
  try {
    // Clean up test users
    await User.deleteMany({ 
      email: { $in: TEST_CONFIG.testUsers.map(u => u.email) } 
    });
    console.log('🧹 Cleaned up test users');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

async function createTestUsers() {
  console.log('\n👥 Creating test users...');
  
  const createdUsers = [];
  
  for (const userData of TEST_CONFIG.testUsers) {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`ℹ️  User already exists: ${user.email} (${user.role})`);
      }
      
      createdUsers.push(user);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
}

async function testRoleHierarchy() {
  console.log('\n🔐 Testing role hierarchy...');
  
  const roles = Object.keys(ROLE_HIERARCHY);
  
  for (let i = 0; i < roles.length; i++) {
    for (let j = i + 1; j < roles.length; j++) {
      const higherRole = roles[i];
      const lowerRole = roles[j];
      const canManage = canManageRole(higherRole, lowerRole);
      
      console.log(`${canManage ? '✅' : '❌'} ${higherRole} can${canManage ? '' : 'not'} manage ${lowerRole}`);
    }
  }
}

async function testPermissions() {
  console.log('\n🔑 Testing permissions...');
  
  const testCases = [
    { role: 'superadministrator', permission: 'users.delete', expected: true },
    { role: 'superadministrator', permission: 'settings.system', expected: true },
    { role: 'admin', permission: 'users.delete', expected: false },
    { role: 'admin', permission: 'users.view', expected: true },
    { role: 'agent', permission: 'users.view', expected: false },
    { role: 'agent', permission: 'chat.view', expected: true },
    { role: 'viewer', permission: 'dashboard.view', expected: true },
    { role: 'viewer', permission: 'users.create', expected: false }
  ];
  
  for (const testCase of testCases) {
    const result = hasPermission(testCase.role, testCase.permission);
    const status = result === testCase.expected ? '✅' : '❌';
    console.log(`${status} ${testCase.role}.${testCase.permission}: ${result} (expected: ${testCase.expected})`);
  }
}

async function testUserPermissions() {
  console.log('\n👤 Testing user permissions...');
  
  const users = await User.find({ 
    email: { $in: TEST_CONFIG.testUsers.map(u => u.email) } 
  });
  
  for (const user of users) {
    console.log(`\n📋 Testing permissions for ${user.email} (${user.role}):`);
    
    const rolePermissions = getRolePermissions(user.role);
    const effectivePermissions = user.getEffectivePermissions();
    
    // Test specific permissions
    const testPermissions = [
      'dashboard.view',
      'users.view',
      'users.create',
      'users.delete',
      'settings.system',
      'chat.moderate'
    ];
    
    for (const permission of testPermissions) {
      const [module, action] = permission.split('.');
      const hasAccess = effectivePermissions[module] && effectivePermissions[module][action];
      console.log(`  ${hasAccess ? '✅' : '❌'} ${permission}: ${hasAccess}`);
    }
  }
}

async function testRoleManagement() {
  console.log('\n👥 Testing role management...');
  
  const users = await User.find({ 
    email: { $in: TEST_CONFIG.testUsers.map(u => u.email) } 
  });
  
  for (const user of users) {
    console.log(`\n🔐 Role management capabilities for ${user.email} (${user.role}):`);
    
    const roles = Object.keys(ROLE_HIERARCHY);
    
    for (const targetRole of roles) {
      const canManage = user.canManageRole(targetRole);
      console.log(`  ${canManage ? '✅' : '❌'} Can manage ${targetRole}: ${canManage}`);
    }
  }
}

async function testUserManagement() {
  console.log('\n👥 Testing user management...');
  
  const users = await User.find({ 
    email: { $in: TEST_CONFIG.testUsers.map(u => u.email) } 
  });
  
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j) {
        const manager = users[i];
        const target = users[j];
        const canManage = manager.canManageUser(target);
        
        console.log(`${canManage ? '✅' : '❌'} ${manager.email} (${manager.role}) can${canManage ? '' : 'not'} manage ${target.email} (${target.role})`);
      }
    }
  }
}

async function testRoleInitialization() {
  console.log('\n🔧 Testing role initialization...');
  
  try {
    await Role.createDefaultRoles();
    console.log('✅ Default roles initialized successfully');
    
    const roles = await Role.find({ type: 'system' });
    console.log(`📋 Found ${roles.length} system roles:`);
    
    for (const role of roles) {
      console.log(`  - ${role.name} (priority: ${role.priority})`);
    }
  } catch (error) {
    console.error('❌ Role initialization error:', error.message);
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API endpoints...');
  
  const axios = require('axios');
  const baseURL = 'http://localhost:3001/api';
  
  try {
    // Test login endpoint
    console.log('🔐 Testing login endpoint...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'superadmin@test.com',
      password: 'Test123!'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.data.token;
      
      // Test protected endpoint
      console.log('🔒 Testing protected endpoint...');
      const meResponse = await axios.get(`${baseURL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (meResponse.data.success) {
        console.log('✅ Protected endpoint accessible');
        console.log(`👤 User: ${meResponse.data.data.user.email} (${meResponse.data.data.user.role})`);
      } else {
        console.log('❌ Protected endpoint failed');
      }
      
      // Test roles endpoint
      console.log('📋 Testing roles endpoint...');
      const rolesResponse = await axios.get(`${baseURL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (rolesResponse.data.success) {
        console.log('✅ Roles endpoint accessible');
        console.log(`📊 Found ${rolesResponse.data.data.roles.length} roles`);
      } else {
        console.log('❌ Roles endpoint failed');
      }
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.log('❌ API test failed:', error.response?.data?.error?.message || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting RBAC System Tests...\n');
  
  try {
    await connectDB();
    await cleanup();
    await createTestUsers();
    
    await testRoleHierarchy();
    await testPermissions();
    await testUserPermissions();
    await testRoleManagement();
    await testUserManagement();
    await testRoleInitialization();
    await testAPIEndpoints();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testRoleHierarchy,
  testPermissions,
  testUserPermissions,
  testRoleManagement,
  testUserManagement,
  testRoleInitialization,
  testAPIEndpoints
};
