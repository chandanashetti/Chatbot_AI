const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const ScrapedContent = require('../models/ScrapedContent');
const WebScraper = require('../services/webScraper');

const webScraper = new WebScraper();

// Get web scraping settings
router.get('/settings', async (req, res) => {
  try {
    console.log('📋 Fetching web scraping settings...');
    
    const settings = await Settings.findOne({ isDefault: true });
    
    if (!settings || !settings.webScraping) {
      console.log('⚠️ No web scraping settings found, returning defaults...');
      return res.json({
        success: true,
        data: {
          webScraping: {
            enabled: false,
            urls: [],
            cacheTimeout: 3600000,
            maxUrls: 10,
            requestTimeout: 10000,
            userAgent: 'Mozilla/5.0 (compatible; Chatbot-AI/1.0)',
            respectRobotsTxt: true,
            maxContentLength: 100000,
            allowedDomains: [],
            blockedDomains: []
          }
        }
      });
    }
    
    console.log('✅ Web scraping settings loaded');
    res.json({
      success: true,
      data: {
        webScraping: settings.webScraping
      }
    });
  } catch (error) {
    console.error('❌ Error fetching web scraping settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEB_SCRAPING_SETTINGS_ERROR',
        message: 'Failed to fetch web scraping settings',
        details: error.message
      }
    });
  }
});

// Update web scraping settings
router.put('/settings', async (req, res) => {
  try {
    console.log('📝 Updating web scraping settings...');
    
    const { webScraping } = req.body;
    
    if (!webScraping) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATA',
          message: 'Web scraping settings data is required'
        }
      });
    }
    
    // Update the web scraping settings in the default settings document
    const settings = await Settings.findOneAndUpdate(
      { isDefault: true },
      { 
        $set: { 
          webScraping: webScraping,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );
    
    console.log('✅ Web scraping settings updated');
    res.json({
      success: true,
      message: 'Web scraping settings updated successfully',
      data: {
        webScraping: settings.webScraping
      }
    });
  } catch (error) {
    console.error('❌ Error updating web scraping settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'WEB_SCRAPING_UPDATE_ERROR',
        message: 'Failed to update web scraping settings',
        details: error.message
      }
    });
  }
});

// Add URL to scraping list
router.post('/urls', async (req, res) => {
  try {
    console.log('➕ Adding URL to scraping list...');
    
    const { url, name, description } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL is required'
        }
      });
    }
    
    // Get current settings
    const settings = await Settings.findOne({ isDefault: true });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'Default settings not found'
        }
      });
    }
    
    // Initialize webScraping if it doesn't exist
    if (!settings.webScraping) {
      settings.webScraping = {
        enabled: false,
        urls: [],
        cacheTimeout: 3600000,
        maxUrls: 10,
        requestTimeout: 10000,
        userAgent: 'Mozilla/5.0 (compatible; Chatbot-AI/1.0)',
        respectRobotsTxt: true,
        maxContentLength: 100000,
        allowedDomains: [],
        blockedDomains: []
      };
    }
    
    // Check if URL already exists
    const existingUrl = settings.webScraping.urls.find(u => u.url === url);
    if (existingUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'URL_EXISTS',
          message: 'URL already exists in scraping list'
        }
      });
    }
    
    // Add new URL
    const newUrl = {
      id: Date.now().toString(),
      url,
      name: name || url,
      description: description || '',
      enabled: true,
      lastScraped: null,
      status: 'pending'
    };
    
    settings.webScraping.urls.push(newUrl);
    await settings.save();
    
    console.log('✅ URL added to scraping list');
    res.json({
      success: true,
      message: 'URL added successfully',
      data: newUrl
    });
  } catch (error) {
    console.error('❌ Error adding URL:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'URL_ADD_ERROR',
        message: 'Failed to add URL',
        details: error.message
      }
    });
  }
});

// Remove URL from scraping list
router.delete('/urls/:id', async (req, res) => {
  try {
    console.log('🗑️ Removing URL from scraping list...');
    
    const { id } = req.params;
    
    const settings = await Settings.findOne({ isDefault: true });
    
    if (!settings || !settings.webScraping) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SETTINGS_NOT_FOUND',
          message: 'Web scraping settings not found'
        }
      });
    }
    
    // Remove URL from list
    const originalLength = settings.webScraping.urls.length;
    settings.webScraping.urls = settings.webScraping.urls.filter(u => u.id !== id);
    
    if (settings.webScraping.urls.length === originalLength) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'URL_NOT_FOUND',
          message: 'URL not found in scraping list'
        }
      });
    }
    
    await settings.save();
    
    console.log('✅ URL removed from scraping list');
    res.json({
      success: true,
      message: 'URL removed successfully'
    });
  } catch (error) {
    console.error('❌ Error removing URL:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'URL_REMOVE_ERROR',
        message: 'Failed to remove URL',
        details: error.message
      }
    });
  }
});

// Get scraped content
router.get('/content', async (req, res) => {
  try {
    console.log('📋 Fetching scraped content...');
    
    const content = await ScrapedContent.find({ status: 'success' })
      .select('url title description contentLength scrapedAt')
      .sort({ scrapedAt: -1 })
      .limit(100);
    
    console.log(`✅ Found ${content.length} scraped content items`);
    res.json({
      success: true,
      data: { content }
    });
  } catch (error) {
    console.error('❌ Error fetching scraped content:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTENT_FETCH_ERROR',
        message: 'Failed to fetch scraped content',
        details: error.message
      }
    });
  }
});

// Search scraped content (for RAG integration)
router.post('/search', async (req, res) => {
  try {
    console.log('🔍 Searching scraped content...');
    
    const { query, topK = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query is required'
        }
      });
    }
    
    // Simple text search (can be enhanced with vector search later)
    const results = await ScrapedContent.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ],
      status: 'success'
    })
    .select('url title description content scrapedAt')
    .limit(topK);
    
    console.log(`✅ Found ${results.length} matching content items`);
    res.json({
      success: true,
      data: { results, count: results.length }
    });
  } catch (error) {
    console.error('❌ Error searching content:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTENT_SEARCH_ERROR',
        message: 'Failed to search content',
        details: error.message
      }
    });
  }
});

module.exports = router;
