const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  primaryColor: { type: String, default: '#3b82f6' },
  secondaryColor: { type: String, default: '#64748b' },
  backgroundColor: { type: String, default: '#ffffff' }
}, { _id: false });

const ollamaSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  apiUrl: { type: String, default: 'http://localhost:11434' },
  model: { type: String, default: 'llama3.2' },
  embeddingModel: { type: String, default: 'mxbai-embed-large' },
  temperature: { type: Number, default: 0.7, min: 0, max: 2 },
  maxTokens: { type: Number, default: 2000, min: 1, max: 8000 },
  timeout: { type: Number, default: 30000 },
  ragEnabled: { type: Boolean, default: true },
  chunkSize: { type: Number, default: 1000, min: 100, max: 5000 },
  chunkOverlap: { type: Number, default: 200, min: 0, max: 1000 },
  topK: { type: Number, default: 5, min: 1, max: 20 }
}, { _id: false });

const openaiSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  apiKey: { type: String, default: '' },
  model: { type: String, default: 'gpt-3.5-turbo' },
  embeddingModel: { type: String, default: 'text-embedding-ada-002' },
  temperature: { type: Number, default: 0.7, min: 0, max: 2 },
  maxTokens: { type: Number, default: 1000, min: 1, max: 4000 },
  ragEnabled: { type: Boolean, default: true },
  topK: { type: Number, default: 5, min: 1, max: 20 }
}, { _id: false });

const urlSourceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  url: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  lastScraped: { type: Date },
  scrapingStatus: { 
    type: String, 
    enum: ['pending', 'success', 'error', 'disabled'], 
    default: 'pending' 
  },
  errorMessage: { type: String },
  contentLength: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const webScrapingSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  urls: [urlSourceSchema],
  cacheTimeout: { type: Number, default: 3600000 }, // 1 hour in milliseconds
  maxUrls: { type: Number, default: 10, min: 1, max: 50 },
  requestTimeout: { type: Number, default: 10000 }, // 10 seconds
  userAgent: { 
    type: String, 
    default: 'Mozilla/5.0 (compatible; Chatbot-AI/1.0; +https://example.com/bot)' 
  },
  respectRobotsTxt: { type: Boolean, default: true },
  maxContentLength: { type: Number, default: 100000 }, // 100KB max per page
  allowedDomains: [String], // Optional whitelist of domains
  blockedDomains: [String]  // Optional blacklist of domains
}, { _id: false });

const settingsSchema = new mongoose.Schema({
  temperature: { type: Number, default: 0.7, min: 0, max: 2 },
  maxTokens: { type: Number, default: 1000, min: 1, max: 4000 },
  model: { 
    type: String, 
    default: 'gpt-3.5-turbo',
    enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-3', 'bedrock', 'ollama', 'openai']
  },
  fallbackMessage: { 
    type: String, 
    default: 'I apologize, but I\'m unable to process your request at the moment. Please try again later.' 
  },
  greetingMessage: { 
    type: String, 
    default: 'Hello! I\'m your AI assistant. How can I help you today?' 
  },
  promptTemplate: { 
    type: String, 
    default: 'You are a helpful AI assistant. Answer the user\'s question based on the provided context.' 
  },
  ragPromptTemplate: { 
    type: String, 
    default: `You are an expert assistant that answers questions based on the provided documents.

Here are the relevant documents: {documents}

Question: {question}

Please provide a comprehensive answer based on the information in the documents. If the answer is not found in the documents, say so clearly.`
  },
  theme: { type: themeSchema, default: () => ({}) },
  ollama: { type: ollamaSettingsSchema, default: () => ({}) },
  openai: { type: openaiSettingsSchema, default: () => ({}) },
  webScraping: { type: webScrapingSettingsSchema, default: () => ({}) },
  isDefault: { type: Boolean, default: true } // Only one default settings document
}, {
  timestamps: true,
  collection: 'settings'
});

// Ensure only one default settings document exists
settingsSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
