const express = require('express');
const router = express.Router();
const multer = require('multer');
const Document = require('../models/Document');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(txt|pdf|docx)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only TXT, PDF, and DOCX files are allowed.'));
    }
  }
});

// GET /api/knowledge-base/documents - Get all documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await Document.find({}, 'name type size status textContent metadata createdAt updatedAt')
      .sort({ createdAt: -1 });

    const formattedDocs = documents.map(doc => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      status: doc.status,
      uploadedAt: doc.createdAt,
      lastModified: doc.updatedAt,
      contentPreview: doc.textContent ? doc.textContent.substring(0, 200) + '...' : '',
      chunkCount: doc.chunks ? doc.chunks.length : 0,
      error: doc.error
    }));

    res.json({
      success: true,
      documents: formattedDocs,
      total: formattedDocs.length
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents',
      details: error.message
    });
  }
});

// POST /api/knowledge-base/upload - Upload and process document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    let textContent = '';

    // Extract text based on file type
    if (file.mimetype === 'text/plain') {
      textContent = file.buffer.toString('utf-8');
    } else {
      // For PDF and DOCX, we'll store as-is for now
      // In a production environment, you'd use libraries like pdf-parse or mammoth
      textContent = file.buffer.toString('utf-8');
    }

    // Create document record
    const document = new Document({
      name: file.originalname,
      type: file.originalname.split('.').pop()?.toLowerCase() || 'unknown',
      size: file.size,
      status: 'indexed',
      textContent: textContent,
      chunks: [{
        id: `chunk-${Date.now()}`,
        content: textContent,
        metadata: {
          chunkIndex: 0,
          start: 0,
          end: textContent.length,
          source: file.originalname
        }
      }],
      metadata: {
        uploadedBy: 'user',
        originalPath: file.originalname,
        mimeType: file.mimetype
      },
      indexedAt: new Date()
    });

    await document.save();

    res.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      document: {
        id: document._id,
        name: document.name,
        type: document.type,
        size: document.size,
        status: document.status
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      details: error.message
    });
  }
});

// DELETE /api/knowledge-base/documents/:id - Delete document
router.delete('/documents/:id', async (req, res) => {
  try {
    const documentId = req.params.id;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    await Document.findByIdAndDelete(documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      details: error.message
    });
  }
});

// POST /api/knowledge-base/documents/:id/reindex - Reindex document
router.post('/documents/:id/reindex', async (req, res) => {
  try {
    const documentId = req.params.id;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Update document status and indexing timestamp
    document.status = 'indexed';
    document.indexedAt = new Date();

    // Regenerate chunks if needed
    if (document.textContent && (!document.chunks || document.chunks.length === 0)) {
      document.chunks = [{
        id: `chunk-${Date.now()}`,
        content: document.textContent,
        metadata: {
          chunkIndex: 0,
          start: 0,
          end: document.textContent.length,
          source: document.name
        }
      }];
    }

    await document.save();

    res.json({
      success: true,
      message: 'Document reindexed successfully',
      document: {
        id: document._id,
        name: document.name,
        status: document.status,
        indexedAt: document.indexedAt
      }
    });

  } catch (error) {
    console.error('Reindex document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reindex document',
      details: error.message
    });
  }
});

module.exports = router;