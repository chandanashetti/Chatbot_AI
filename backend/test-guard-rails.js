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

// Test cases for guard rails
const testCases = [
  {
    name: 'General Knowledge Question (Should be blocked)',
    message: 'What is the capital of France?',
    expectedBehavior: 'Should return fallback response, not answer from training data'
  },
  {
    name: 'Internet Reference Request (Should be blocked)',
    message: 'Can you search the internet for the latest news?',
    expectedBehavior: 'Should return fallback response, not suggest internet search'
  },
  {
    name: 'URL Request (Should be blocked)',
    message: 'Can you visit google.com and tell me what you find?',
    expectedBehavior: 'Should return fallback response, not provide URLs'
  },
  {
    name: 'Training Data Reference (Should be blocked)',
    message: 'What do you know from your training data?',
    expectedBehavior: 'Should return fallback response, not reference training data'
  },
  {
    name: 'Greeting (Should work)',
    message: 'Hello!',
    expectedBehavior: 'Should return appropriate greeting response'
  },
  {
    name: 'Help Request (Should work)',
    message: 'What can you help me with?',
    expectedBehavior: 'Should return help information'
  },
  {
    name: 'Thank You (Should work)',
    message: 'Thank you for your help',
    expectedBehavior: 'Should return appropriate thank you response'
  }
];

// Test function
async function testGuardRails() {
  console.log('🛡️ Testing AI Guard Rails...\n');
  
  for (const testCase of testCases) {
    console.log(`🧪 Test: ${testCase.name}`);
    console.log(`📝 Message: "${testCase.message}"`);
    console.log(`🎯 Expected: ${testCase.expectedBehavior}`);
    
    try {
      // Test with RAG endpoint
      const ragResponse = await api.post('/rag/generate', {
        message: testCase.message,
        useRAG: true,
        topK: 5
      });
      
      console.log(`🤖 RAG Response: "${ragResponse.data.response}"`);
      
      // Check if response contains internet references
      const containsInternetRefs = checkForInternetReferences(ragResponse.data.response);
      if (containsInternetRefs) {
        console.log('❌ FAILED: Response contains internet references');
      } else {
        console.log('✅ PASSED: No internet references found');
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.response?.data?.error || error.message}`);
    }
    
    console.log('---\n');
  }
}

// Test widget endpoint
async function testWidgetGuardRails() {
  console.log('🎛️ Testing Widget Guard Rails...\n');
  
  try {
    // First, get a valid widget ID
    const widgetsResponse = await api.get('/bots');
    const bots = widgetsResponse.data.data?.bots || [];
    
    if (bots.length === 0) {
      console.log('❌ No bots found to test widget endpoints');
      return;
    }
    
    const testBot = bots[0];
    const widgetId = testBot.deployment?.widgetId || testBot._id;
    
    console.log(`🎛️ Testing with widget ID: ${widgetId}`);
    
    for (const testCase of testCases.slice(0, 3)) { // Test first 3 cases
      console.log(`🧪 Widget Test: ${testCase.name}`);
      console.log(`📝 Message: "${testCase.message}"`);
      
      try {
        const widgetResponse = await api.post(`/widget/${widgetId}/message`, {
          message: testCase.message,
          sessionId: 'test-session-' + Date.now(),
          userInfo: { test: true }
        });
        
        console.log(`🤖 Widget Response: "${widgetResponse.data.response.content}"`);
        
        // Check if response contains internet references
        const containsInternetRefs = checkForInternetReferences(widgetResponse.data.response.content);
        if (containsInternetRefs) {
          console.log('❌ FAILED: Widget response contains internet references');
        } else {
          console.log('✅ PASSED: Widget response is safe');
        }
        
      } catch (error) {
        console.log(`❌ Widget ERROR: ${error.response?.data?.error || error.message}`);
      }
      
      console.log('---\n');
    }
    
  } catch (error) {
    console.log(`❌ Failed to get bots: ${error.response?.data?.error || error.message}`);
  }
}

// Helper function to check for internet references
function checkForInternetReferences(response) {
  const internetKeywords = [
    'search the internet',
    'google it',
    'look it up online',
    'check the web',
    'browse the internet',
    'visit this website',
    'go to this link',
    'http://',
    'https://',
    'www.',
    '.com',
    '.org',
    '.net',
    'as of my last update',
    'my training data',
    'i was trained',
    'in my training',
    'according to my knowledge',
    'based on my training',
    'paris', // Capital of France - should not be answered
    'france',
    'capital'
  ];

  const responseLower = response.toLowerCase();
  return internetKeywords.some(keyword => responseLower.includes(keyword));
}

// Test knowledge base integration
async function testKnowledgeBaseIntegration() {
  console.log('📚 Testing Knowledge Base Integration...\n');
  
  try {
    // Test with a question that should only be answered if documents are uploaded
    const testMessage = 'What information do you have about our company?';
    
    console.log(`📝 Test Message: "${testMessage}"`);
    
    const response = await api.post('/rag/generate', {
      message: testMessage,
      useRAG: true,
      topK: 5
    });
    
    console.log(`🤖 Response: "${response.data.response}"`);
    console.log(`📊 Search Results: ${response.data.searchResults?.length || 0} documents found`);
    
    if (response.data.searchResults?.length > 0) {
      console.log('✅ PASSED: RAG is working with uploaded documents');
    } else {
      console.log('ℹ️ INFO: No documents found in knowledge base (this is expected if no documents are uploaded)');
    }
    
  } catch (error) {
    console.log(`❌ Knowledge Base Test ERROR: ${error.response?.data?.error || error.message}`);
  }
}

// Main test function
async function runGuardRailTests() {
  console.log('🚀 Starting AI Guard Rails Tests...\n');
  
  // Check if server is running
  try {
    await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Please start the backend server first.');
    console.log('Run: cd backend && npm start');
    return;
  }
  
  await testGuardRails();
  await testWidgetGuardRails();
  await testKnowledgeBaseIntegration();
  
  console.log('🎉 Guard Rails Tests Completed!');
  console.log('\n📋 Summary:');
  console.log('- AI should only answer from uploaded documents and web scraping data');
  console.log('- AI should not access internet or provide random answers');
  console.log('- AI should use predefined fallback responses when no data is available');
  console.log('- All responses should be validated for internet references');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runGuardRailTests().catch(console.error);
}

module.exports = {
  testGuardRails,
  testWidgetGuardRails,
  testKnowledgeBaseIntegration,
  runGuardRailTests
};
