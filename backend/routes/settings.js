const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { ensureUser } = require('../utils/userHelper');

// Get all settings
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching settings...');
    
    let settings = await Settings.findOne({ isDefault: true });
    
    if (!settings) {
      console.log('⚠️ No default settings found, creating default settings...');
      
      // Create default settings if none exist
      settings = new Settings({
        temperature: 0.7,
        maxTokens: 1000,
        model: 'gpt-3.5-turbo',
        fallbackMessage: 'I apologize, but I\'m unable to process your request at the moment. Please try again later.',
        greetingMessage: 'Hello! I\'m your AI assistant. How can I help you today?',
        promptTemplate: 'You are a helpful AI assistant. Answer the user\'s question based on the provided context.',
        ragPromptTemplate: `You are an expert assistant that answers questions based on the provided documents.

Here are the relevant documents: {documents}

Question: {question}

Please provide a comprehensive answer based on the information in the documents. If the answer is not found in the documents, say so clearly.`,
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          backgroundColor: '#ffffff'
        },
        openai: {
          enabled: true,
          apiKey: '',
          model: 'gpt-3.5-turbo',
          embeddingModel: 'text-embedding-ada-002',
          temperature: 0.7,
          maxTokens: 1000,
          ragEnabled: true,
          topK: 5
        },
        ollama: {
          enabled: false,
          apiUrl: 'http://localhost:11434',
          model: 'llama3.2',
          embeddingModel: 'mxbai-embed-large',
          temperature: 0.7,
          maxTokens: 2000,
          timeout: 30000,
          ragEnabled: true,
          chunkSize: 1000,
          chunkOverlap: 200,
          topK: 5
        },
        webScraping: {
          enabled: false,
          urls: [],
          cacheTimeout: 3600000, // 1 hour
          maxUrls: 10,
          requestTimeout: 10000,
          userAgent: 'Mozilla/5.0 (compatible; Chatbot-AI/1.0)',
          respectRobotsTxt: true,
          maxContentLength: 100000,
          allowedDomains: [],
          blockedDomains: []
        },
        isDefault: true
      });
      
      await settings.save();
      console.log('✅ Default settings created');
    }
    
    console.log('✅ Settings loaded successfully');
    res.json(settings);
  } catch (error) {
    console.error('❌ Error fetching settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_FETCH_ERROR',
        message: 'Failed to fetch settings',
        details: error.message
      }
    });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    console.log('📝 Updating settings...');
    
    const updateData = req.body;
    
    // Find and update the default settings
    let settings = await Settings.findOneAndUpdate(
      { isDefault: true },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );
    
    console.log('✅ Settings updated successfully');
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_UPDATE_ERROR',
        message: 'Failed to update settings',
        details: error.message
      }
    });
  }
});

// Get available models
router.get('/models', async (req, res) => {
  try {
    console.log('📋 Fetching available models...');
    
    const models = [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and cost-effective' },
      { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Most capable model' },
      { id: 'claude-3', name: 'Claude-3', provider: 'Anthropic', description: 'Anthropic\'s latest model' },
      { id: 'bedrock', name: 'AWS Bedrock', provider: 'Amazon', description: 'Amazon\'s AI models' },
      { id: 'ollama', name: 'Ollama (Local)', provider: 'Local', description: 'Run models locally with Ollama' }
    ];
    
    console.log('✅ Available models loaded');
    res.json({
      success: true,
      data: { models }
    });
  } catch (error) {
    console.error('❌ Error fetching models:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MODELS_FETCH_ERROR',
        message: 'Failed to fetch available models',
        details: error.message
      }
    });
  }
});

module.exports = router;
