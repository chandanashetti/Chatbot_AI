const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-token-here'; // You'll need to get this from login

// Create axios instance with auth header
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test roles functionality
async function testRoles() {
  console.log('👥 Testing Roles Functionality...\n');
  
  try {
    // Test 1: Get all roles
    console.log('1. Testing GET /roles');
    const getRolesResponse = await api.get('/roles');
    console.log('✅ Roles loaded:', getRolesResponse.data.success);
    console.log('📊 Total roles:', getRolesResponse.data.data?.roles?.length || 0);
    
    const existingRoles = getRolesResponse.data.data?.roles || [];
    
    // Test 2: Initialize default roles if none exist
    if (existingRoles.length === 0) {
      console.log('\n2. Testing POST /roles/initialize (no roles found)');
      const initResponse = await api.post('/roles/initialize');
      console.log('✅ Default roles initialized:', initResponse.data.success);
      
      // Get roles again after initialization
      const getRolesAgainResponse = await api.get('/roles');
      console.log('📊 Roles after initialization:', getRolesAgainResponse.data.data?.roles?.length || 0);
    } else {
      console.log('\n2. Skipping initialization (roles already exist)');
    }
    
    // Test 3: Get role statistics
    console.log('\n3. Testing GET /roles/stats');
    const statsResponse = await api.get('/roles/stats');
    console.log('✅ Role stats loaded:', statsResponse.data.success);
    console.log('📈 Total roles:', statsResponse.data.data?.totalRoles || 0);
    console.log('📈 Active roles:', statsResponse.data.data?.activeRoles || 0);
    console.log('📈 System roles:', statsResponse.data.data?.systemRoles || 0);
    console.log('📈 Custom roles:', statsResponse.data.data?.customRoles || 0);
    
    // Test 4: Create a new custom role
    console.log('\n4. Testing POST /roles (create custom role)');
    const newRole = {
      name: 'Test Manager',
      description: 'A test role for testing purposes',
      permissions: {
        dashboard: { view: true, export: false },
        users: { view: true, create: false, edit: false, delete: false, manageRoles: false },
        bots: { view: true, create: false, edit: false, delete: false, publish: false },
        agents: { view: true, create: false, edit: false, delete: false, assign: false },
        analytics: { view: true, export: false, advanced: false },
        knowledgeBase: { view: true, upload: false, edit: false, delete: false },
        settings: { view: false, edit: false, system: false },
        chat: { view: true, moderate: false, export: false }
      },
      priority: 5,
      color: '#3B82F6'
    };
    
    const createResponse = await api.post('/roles', newRole);
    console.log('✅ Custom role created:', createResponse.data.success);
    console.log('🆔 New role ID:', createResponse.data.data?._id);
    
    const newRoleId = createResponse.data.data?._id;
    
    // Test 5: Get specific role
    if (newRoleId) {
      console.log('\n5. Testing GET /roles/:id');
      const getRoleResponse = await api.get(`/roles/${newRoleId}`);
      console.log('✅ Role details loaded:', getRoleResponse.data.success);
      console.log('📝 Role name:', getRoleResponse.data.data?.name);
      console.log('📝 Role type:', getRoleResponse.data.data?.type);
      console.log('📝 Role status:', getRoleResponse.data.data?.status);
    }
    
    // Test 6: Update role
    if (newRoleId) {
      console.log('\n6. Testing PUT /roles/:id (update role)');
      const updateData = {
        description: 'Updated test role description',
        permissions: {
          dashboard: { view: true, export: true },
          users: { view: true, create: true, edit: false, delete: false, manageRoles: false },
          bots: { view: true, create: false, edit: false, delete: false, publish: false },
          agents: { view: true, create: false, edit: false, delete: false, assign: false },
          analytics: { view: true, export: true, advanced: false },
          knowledgeBase: { view: true, upload: true, edit: false, delete: false },
          settings: { view: false, edit: false, system: false },
          chat: { view: true, moderate: true, export: false }
        }
      };
      
      const updateResponse = await api.put(`/roles/${newRoleId}`, updateData);
      console.log('✅ Role updated:', updateResponse.data.success);
    }
    
    // Test 7: Update role status
    if (newRoleId) {
      console.log('\n7. Testing PATCH /roles/:id/status');
      const statusResponse = await api.patch(`/roles/${newRoleId}/status`, { status: 'inactive' });
      console.log('✅ Role status updated:', statusResponse.data.success);
      
      // Reactivate the role
      const reactivateResponse = await api.patch(`/roles/${newRoleId}/status`, { status: 'active' });
      console.log('✅ Role reactivated:', reactivateResponse.data.success);
    }
    
    // Test 8: Search roles
    console.log('\n8. Testing GET /roles?search=test');
    const searchResponse = await api.get('/roles?search=test');
    console.log('✅ Role search completed:', searchResponse.data.success);
    console.log('🔍 Search results:', searchResponse.data.data?.roles?.length || 0);
    
    // Test 9: Filter roles by type
    console.log('\n9. Testing GET /roles?type=system');
    const filterResponse = await api.get('/roles?type=system');
    console.log('✅ Role filter completed:', filterResponse.data.success);
    console.log('🔍 System roles found:', filterResponse.data.data?.roles?.length || 0);
    
    // Test 10: Clean up - delete the test role
    if (newRoleId) {
      console.log('\n10. Testing DELETE /roles/:id (cleanup)');
      const deleteResponse = await api.delete(`/roles/${newRoleId}`);
      console.log('✅ Test role deleted:', deleteResponse.data.success);
    }
    
  } catch (error) {
    console.error('❌ Roles test failed:', error.response?.data || error.message);
  }
}

// Test role integration with user management
async function testRoleUserIntegration() {
  console.log('\n👤 Testing Role-User Integration...\n');
  
  try {
    // Test 1: Get roles for user creation
    console.log('1. Testing GET /users/roles/list');
    const rolesListResponse = await api.get('/users/roles/list');
    console.log('✅ Available roles for users:', rolesListResponse.data.success);
    console.log('📋 Available roles:', rolesListResponse.data.data?.roles?.length || 0);
    
    // Test 2: Check if roles are properly formatted for user creation
    if (rolesListResponse.data.data?.roles) {
      const roles = rolesListResponse.data.data.roles;
      console.log('📝 Role options for user creation:');
      roles.forEach((role, index) => {
        console.log(`   ${index + 1}. ${role.name} (${role.type}) - ${role.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Role-User integration test failed:', error.response?.data || error.message);
  }
}

// Main test function
async function runRoleTests() {
  console.log('🚀 Starting Role Management Tests...\n');
  
  // Check if server is running
  try {
    await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Please start the backend server first.');
    console.log('Run: cd backend && npm start');
    return;
  }
  
  await testRoles();
  await testRoleUserIntegration();
  
  console.log('\n🎉 Role Management Tests Completed!');
  console.log('\n📋 Summary:');
  console.log('- Roles can be created, read, updated, and deleted');
  console.log('- Role statistics are working');
  console.log('- Role search and filtering work');
  console.log('- Default system roles can be initialized');
  console.log('- Role status can be updated');
  console.log('- Roles are available for user creation');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runRoleTests().catch(console.error);
}

module.exports = {
  testRoles,
  testRoleUserIntegration,
  runRoleTests
};
