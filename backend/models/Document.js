const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  metadata: {
    chunkIndex: { type: Number, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    source: { type: String }
  },
  embedding: [Number], // Store vector embeddings
  embeddingModel: { type: String } // Model used for embedding
}, { _id: false });

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['pdf', 'docx', 'doc', 'txt', 'csv']
  },
  size: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'processing',
    enum: ['processing', 'indexed', 'failed', 'embedding', 'ready']
  },
  textContent: { type: String, required: true },
  chunks: [chunkSchema],
  metadata: {
    uploadedBy: { type: String },
    originalPath: { type: String },
    checksum: { type: String },
    mimeType: { type: String }
  },
  indexedAt: { type: Date },
  error: { type: String } // Store error message if processing failed
}, {
  timestamps: true,
  collection: 'documents'
});

// Index for text search
documentSchema.index({ name: 'text', textContent: 'text' });
documentSchema.index({ status: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
