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

// Test functions
async function testChannelAccounts() {
  console.log('🧪 Testing Channel Accounts API...');
  
  try {
    // Test 1: Get all channel accounts
    console.log('1. Testing GET /channel-accounts');
    const response1 = await api.get('/channel-accounts');
    console.log('✅ Success:', response1.data.success);
    console.log('📊 Accounts found:', response1.data.data?.accounts?.length || 0);
    
    // Test 2: Get accounts by platform
    console.log('\n2. Testing GET /channel-accounts/platform/facebook');
    const response2 = await api.get('/channel-accounts/platform/facebook');
    console.log('✅ Success:', response2.data.success);
    console.log('📊 Facebook accounts:', response2.data.data?.accounts?.length || 0);
    
    // Test 3: Create a test account
    console.log('\n3. Testing POST /channel-accounts');
    const testAccount = {
      accountId: 'test_page_123',
      name: 'Test Facebook Page',
      platform: 'facebook',
      details: {
        displayName: 'Test Page',
        username: '@testpage',
        verified: false,
        followerCount: 100
      },
      botId: '507f1f77bcf86cd799439011', // You'll need a real bot ID
      userId: '507f1f77bcf86cd799439012'  // You'll need a real user ID
    };
    
    const response3 = await api.post('/channel-accounts', testAccount);
    console.log('✅ Success:', response3.data.success);
    console.log('🆔 Created account ID:', response3.data.data?.account?._id);
    
    const createdAccountId = response3.data.data?.account?._id;
    
    // Test 4: Get account details
    if (createdAccountId) {
      console.log('\n4. Testing GET /channel-accounts/:id');
      const response4 = await api.get(`/channel-accounts/${createdAccountId}`);
      console.log('✅ Success:', response4.data.success);
      console.log('📝 Account name:', response4.data.data?.account?.name);
    }
    
    // Test 5: Update account
    if (createdAccountId) {
      console.log('\n5. Testing PUT /channel-accounts/:id');
      const updateData = {
        name: 'Updated Test Facebook Page',
        details: {
          displayName: 'Updated Test Page',
          username: '@updatedtestpage',
          verified: true,
          followerCount: 200
        }
      };
      
      const response5 = await api.put(`/channel-accounts/${createdAccountId}`, updateData);
      console.log('✅ Success:', response5.data.success);
      console.log('📝 Updated name:', response5.data.data?.account?.name);
    }
    
    // Test 6: Get account conversations
    if (createdAccountId) {
      console.log('\n6. Testing GET /channel-accounts/:id/conversations');
      const response6 = await api.get(`/channel-accounts/${createdAccountId}/conversations`);
      console.log('✅ Success:', response6.data.success);
      console.log('💬 Conversations found:', response6.data.data?.conversations?.length || 0);
    }
    
    // Test 7: Get account analytics
    if (createdAccountId) {
      console.log('\n7. Testing GET /channel-accounts/:id/analytics');
      const response7 = await api.get(`/channel-accounts/${createdAccountId}/analytics`);
      console.log('✅ Success:', response7.data.success);
      console.log('📈 Total conversations:', response7.data.data?.analytics?.totalConversations || 0);
    }
    
    // Test 8: Delete test account
    if (createdAccountId) {
      console.log('\n8. Testing DELETE /channel-accounts/:id');
      const response8 = await api.delete(`/channel-accounts/${createdAccountId}`);
      console.log('✅ Success:', response8.data.success);
      console.log('🗑️ Account deleted');
    }
    
  } catch (error) {
    console.error('❌ Error testing channel accounts:', error.response?.data || error.message);
  }
}

async function testConversations() {
  console.log('\n🧪 Testing Conversations API...');
  
  try {
    // Test 1: Get all conversations
    console.log('1. Testing GET /conversations');
    const response1 = await api.get('/conversations');
    console.log('✅ Success:', response1.data.success);
    console.log('💬 Conversations found:', response1.data.data?.conversations?.length || 0);
    
    // Test 2: Get conversations by platform
    console.log('\n2. Testing GET /conversations/platform/facebook');
    const response2 = await api.get('/conversations/platform/facebook');
    console.log('✅ Success:', response2.data.success);
    console.log('💬 Facebook conversations:', response2.data.data?.conversations?.length || 0);
    
    // Test 3: Get conversations with filtering
    console.log('\n3. Testing GET /conversations with filters');
    const response3 = await api.get('/conversations', {
      params: {
        platform: 'facebook',
        status: 'active',
        limit: 10
      }
    });
    console.log('✅ Success:', response3.data.success);
    console.log('💬 Filtered conversations:', response3.data.data?.conversations?.length || 0);
    
    // Test 4: Get analytics summary
    console.log('\n4. Testing GET /conversations/analytics/summary');
    const response4 = await api.get('/conversations/analytics/summary');
    console.log('✅ Success:', response4.data.success);
    console.log('📊 Total conversations:', response4.data.data?.summary?.totalConversations || 0);
    console.log('📊 Total messages:', response4.data.data?.summary?.totalMessages || 0);
    
  } catch (error) {
    console.error('❌ Error testing conversations:', error.response?.data || error.message);
  }
}

async function testAnalytics() {
  console.log('\n🧪 Testing Analytics API...');
  
  try {
    // Test 1: Get dashboard analytics
    console.log('1. Testing GET /analytics/dashboard');
    const response1 = await api.get('/analytics/dashboard');
    console.log('✅ Success:', response1.data.success);
    console.log('📊 Dashboard data available:', !!response1.data.data);
    
    // Test 2: Get charts data
    console.log('\n2. Testing GET /analytics/charts');
    const response2 = await api.get('/analytics/charts');
    console.log('✅ Success:', response2.data.success);
    console.log('📈 Charts data available:', !!response2.data.data);
    
  } catch (error) {
    console.error('❌ Error testing analytics:', error.response?.data || error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...\n');
  
  // Check if server is running
  try {
    await axios.get('http://localhost:5000/api/analytics/test');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Please start the backend server first.');
    console.log('Run: cd backend && npm start');
    return;
  }
  
  await testChannelAccounts();
  await testConversations();
  await testAnalytics();
  
  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testChannelAccounts,
  testConversations,
  testAnalytics,
  runTests
};
