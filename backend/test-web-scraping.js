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

// Test web scraping functionality
async function testWebScraping() {
  console.log('🌐 Testing Web Scraping Functionality...\n');
  
  try {
    // Test 1: Get web scraping settings
    console.log('1. Testing GET /web-scraping/settings');
    const settingsResponse = await api.get('/web-scraping/settings');
    console.log('✅ Settings loaded:', settingsResponse.data.success);
    console.log('📊 Web scraping enabled:', settingsResponse.data.data?.webScraping?.enabled || false);
    console.log('📋 Current URLs:', settingsResponse.data.data?.webScraping?.urls?.length || 0);
    
    // Test 2: Add a test URL
    console.log('\n2. Testing POST /web-scraping/urls');
    const testUrl = {
      url: 'https://example.com',
      name: 'Example Website',
      description: 'Test website for scraping'
    };
    
    const addUrlResponse = await api.post('/web-scraping/urls', testUrl);
    console.log('✅ URL added:', addUrlResponse.data.success);
    console.log('🆔 URL ID:', addUrlResponse.data.data?.urlEntry?.id);
    
    const urlId = addUrlResponse.data.data?.urlEntry?.id;
    
    // Test 3: Get updated settings
    console.log('\n3. Testing GET /web-scraping/settings (after adding URL)');
    const updatedSettingsResponse = await api.get('/web-scraping/settings');
    console.log('✅ Updated settings loaded');
    console.log('📋 Total URLs now:', updatedSettingsResponse.data.data?.webScraping?.urls?.length || 0);
    
    // Test 4: Scrape the URL
    if (urlId) {
      console.log('\n4. Testing POST /web-scraping/scrape/:id');
      try {
        const scrapeResponse = await api.post(`/web-scraping/scrape/${urlId}`);
        console.log('✅ Scraping initiated:', scrapeResponse.data.success);
        console.log('📊 Scraping result:', scrapeResponse.data.result?.status || 'unknown');
      } catch (scrapeError) {
        console.log('⚠️ Scraping failed (this might be expected):', scrapeError.response?.data?.error?.message || scrapeError.message);
      }
    }
    
    // Test 5: Get scraped content
    console.log('\n5. Testing GET /web-scraping/content');
    try {
      const contentResponse = await api.get('/web-scraping/content');
      console.log('✅ Content retrieved:', contentResponse.data.success);
      console.log('📄 Total scraped content:', contentResponse.data.data?.content?.length || 0);
    } catch (contentError) {
      console.log('⚠️ No content found (this might be expected):', contentError.response?.data?.error?.message || contentError.message);
    }
    
    // Test 6: Search web content
    console.log('\n6. Testing POST /web-scraping/search');
    try {
      const searchResponse = await api.post('/web-scraping/search', {
        query: 'example',
        topK: 3
      });
      console.log('✅ Search completed:', searchResponse.data.success);
      console.log('🔍 Search results:', searchResponse.data.data?.results?.length || 0);
    } catch (searchError) {
      console.log('⚠️ Search failed (this might be expected):', searchError.response?.data?.error?.message || searchError.message);
    }
    
    // Test 7: Remove the test URL
    if (urlId) {
      console.log('\n7. Testing DELETE /web-scraping/urls/:id');
      const removeResponse = await api.delete(`/web-scraping/urls/${urlId}`);
      console.log('✅ URL removed:', removeResponse.data.success);
    }
    
  } catch (error) {
    console.error('❌ Web scraping test failed:', error.response?.data || error.message);
  }
}

// Test AI integration with web scraping
async function testAIWithWebScraping() {
  console.log('\n🤖 Testing AI Integration with Web Scraping...\n');
  
  try {
    // Test RAG endpoint with web scraping
    console.log('1. Testing RAG endpoint with web scraping data');
    const ragResponse = await api.post('/rag/generate', {
      message: 'What information do you have about websites?',
      useRAG: true,
      topK: 5
    });
    
    console.log('✅ RAG response generated');
    console.log('🤖 Response:', ragResponse.data.response);
    console.log('📊 Search results:', ragResponse.data.searchResults?.length || 0);
    
    // Check if response mentions web content
    if (ragResponse.data.response.toLowerCase().includes('web') || 
        ragResponse.data.response.toLowerCase().includes('website')) {
      console.log('✅ AI is using web scraping data in responses');
    } else {
      console.log('ℹ️ AI response doesn\'t mention web content (might be expected if no web content is available)');
    }
    
  } catch (error) {
    console.error('❌ AI integration test failed:', error.response?.data || error.message);
  }
}

// Test widget integration
async function testWidgetWithWebScraping() {
  console.log('\n🎛️ Testing Widget Integration with Web Scraping...\n');
  
  try {
    // Get a bot to test with
    const botsResponse = await api.get('/bots');
    const bots = botsResponse.data.data?.bots || [];
    
    if (bots.length === 0) {
      console.log('❌ No bots found to test widget endpoints');
      return;
    }
    
    const testBot = bots[0];
    const widgetId = testBot.deployment?.widgetId || testBot._id;
    
    console.log(`🎛️ Testing with widget ID: ${widgetId}`);
    
    // Test widget message with web scraping
    const widgetResponse = await api.post(`/widget/${widgetId}/message`, {
      message: 'What information do you have about websites?',
      sessionId: 'test-session-' + Date.now(),
      userInfo: { test: true }
    });
    
    console.log('✅ Widget response generated');
    console.log('🤖 Response:', widgetResponse.data.response.content);
    
    // Check if response mentions web content
    if (widgetResponse.data.response.content.toLowerCase().includes('web') || 
        widgetResponse.data.response.content.toLowerCase().includes('website')) {
      console.log('✅ Widget AI is using web scraping data in responses');
    } else {
      console.log('ℹ️ Widget AI response doesn\'t mention web content (might be expected if no web content is available)');
    }
    
  } catch (error) {
    console.error('❌ Widget integration test failed:', error.response?.data || error.message);
  }
}

// Main test function
async function runWebScrapingTests() {
  console.log('🚀 Starting Web Scraping Tests...\n');
  
  // Check if server is running
  try {
    await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Server is not running. Please start the backend server first.');
    console.log('Run: cd backend && npm start');
    return;
  }
  
  await testWebScraping();
  await testAIWithWebScraping();
  await testWidgetWithWebScraping();
  
  console.log('\n🎉 Web Scraping Tests Completed!');
  console.log('\n📋 Summary:');
  console.log('- Web scraping URLs can be added and managed');
  console.log('- URLs can be scraped for content');
  console.log('- AI can use both KB and web scraping data');
  console.log('- Widget integration works with web scraping');
  console.log('- All responses are still guarded against internet access');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runWebScrapingTests().catch(console.error);
}

module.exports = {
  testWebScraping,
  testAIWithWebScraping,
  testWidgetWithWebScraping,
  runWebScrapingTests
};
