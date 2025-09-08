const mongoose = require('mongoose');

const scrapedContentSchema = new mongoose.Schema({
  url: { 
    type: String, 
    required: true,
    unique: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  content: { 
    type: String, 
    required: true 
  },
  contentLength: { 
    type: Number, 
    default: 0 
  },
  chunks: [{
    id: { type: String, required: true },
    content: { type: String, required: true },
    metadata: {
      chunkIndex: { type: Number, required: true },
      start: { type: Number, required: true },
      end: { type: Number, required: true },
      source: { type: String, default: 'web' },
      url: { type: String }
    }
  }],
  scrapedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['success', 'error', 'processing'], 
    default: 'success' 
  },
  errorMessage: { 
    type: String 
  },
  metadata: {
    userAgent: { type: String },
    responseTime: { type: Number },
    httpStatus: { type: Number },
    contentType: { type: String }
  }
}, {
  timestamps: true,
  collection: 'scraped_content'
});

// Index for efficient text search
scrapedContentSchema.index({ 
  title: 'text', 
  content: 'text',
  description: 'text' 
});

// Index for URL lookups (url index is created automatically by unique: true)

// Index for status and date queries
scrapedContentSchema.index({ status: 1, scrapedAt: -1 });

// TTL index for automatic cleanup of old content (optional)
scrapedContentSchema.index({ 
  scrapedAt: 1 
}, { 
  expireAfterSeconds: 7 * 24 * 60 * 60 // 7 days
});

module.exports = mongoose.model('ScrapedContent', scrapedContentSchema);
