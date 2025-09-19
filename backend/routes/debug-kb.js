const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

// Debug endpoint to check knowledge base documents
router.get('/kb-status', async (req, res) => {
  try {
    const documents = await Document.find({})
      .select('name type status textContent createdAt')
      .sort({ createdAt: -1 });

    const documentInfo = documents.map(doc => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      status: doc.status,
      contentLength: doc.textContent?.length || 0,
      contentPreview: doc.textContent?.substring(0, 200) + '...',
      hasAmarin: doc.textContent?.toLowerCase().includes('amarin'),
      hasContact: doc.textContent?.toLowerCase().includes('contact') ||
                 doc.textContent?.toLowerCase().includes('phone') ||
                 doc.textContent?.toLowerCase().includes('tel'),
      createdAt: doc.createdAt
    }));

    res.json({
      success: true,
      totalDocuments: documents.length,
      documents: documentInfo
    });

  } catch (error) {
    console.error('KB status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to test search queries
router.get('/test-search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a query parameter'
      });
    }

    console.log(`🔍 Testing search for: "${query}"`);

    // Test MongoDB text search
    const textSearchDocs = await Document.find(
      {
        $text: { $search: query },
        status: 'indexed'
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(5);

    console.log(`📚 Text search found ${textSearchDocs.length} documents`);

    // Test manual content search
    const manualSearchDocs = await Document.find({
      status: 'indexed',
      textContent: { $regex: query, $options: 'i' }
    }).limit(5);

    console.log(`🔍 Manual search found ${manualSearchDocs.length} documents`);

    const results = {
      query,
      textSearch: {
        count: textSearchDocs.length,
        documents: textSearchDocs.map(doc => ({
          id: doc._id,
          name: doc.name,
          score: doc.score || 0,
          contentPreview: doc.textContent?.substring(0, 300) + '...'
        }))
      },
      manualSearch: {
        count: manualSearchDocs.length,
        documents: manualSearchDocs.map(doc => ({
          id: doc._id,
          name: doc.name,
          contentPreview: doc.textContent?.substring(0, 300) + '...'
        }))
      }
    };

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Search test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint for first-person response conversion
router.get('/test-first-person', async (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a text parameter to test first-person conversion'
      });
    }

    // Import the botRuntime to access the enforceFirstPersonResponse method
    const BotRuntime = require('../services/botRuntime');

    // Create a mock bot instance for testing
    const mockBot = {
      settings: {
        appearance: { name: 'Test Bot' },
        personality: { tone: 'professional', style: 'helpful' },
        ai: { ragSettings: { topK: 5 } }
      }
    };

    const botRuntime = new BotRuntime(mockBot);
    const convertedText = botRuntime.enforceFirstPersonResponse(text);

    res.json({
      success: true,
      data: {
        original: text,
        converted: convertedText,
        hasThirdPerson: botRuntime.containsThirdPersonReferences(text),
        fixedThirdPerson: !botRuntime.containsThirdPersonReferences(convertedText),
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('First-person test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test first-person conversion',
      details: error.message
    });
  }
});

module.exports = router;