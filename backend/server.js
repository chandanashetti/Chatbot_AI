const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Document processors
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Storage setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|docx?|txt|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and CSV files are allowed.'));
    }
  }
});

// In-memory storage for demo (in production, use a real database)
let documents = [];
let vectorStore = [];

// Ollama configuration
const OLLAMA_BASE_URL = 'http://localhost:11434';

// Utility functions
const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    chunks.push({
      id: uuidv4(),
      content: chunk.trim(),
      metadata: {
        chunkIndex: chunks.length,
        start,
        end
      }
    });
    
    start = end - overlap;
    if (start >= text.length) break;
  }
  
  return chunks;
};

const extractTextFromFile = async (filePath, fileType) => {
  try {
    switch (fileType) {
      case 'pdf':
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text;
        
      case 'docx':
      case 'doc':
        const docResult = await mammoth.extractRawText({ path: filePath });
        return docResult.value;
        
      case 'txt':
        return await fs.readFile(filePath, 'utf-8');
        
      case 'csv':
        return new Promise((resolve, reject) => {
          let csvText = '';
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
              csvText += Object.values(row).join(' ') + '\n';
            })
            .on('end', () => resolve(csvText))
            .on('error', reject);
        });
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
};

const callOllama = async (endpoint, data) => {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/${endpoint}`, data, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Ollama API error (${endpoint}):`, error.message);
    throw new Error(`Ollama service unavailable: ${error.message}`);
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ollama: 'checking...'
  });
});

// Test Ollama connection
app.post('/api/rag/ollama/test', async (req, res) => {
  try {
    const { apiUrl } = req.body;
    const testUrl = apiUrl || OLLAMA_BASE_URL;
    
    const response = await axios.get(`${testUrl}/api/tags`, { timeout: 5000 });
    
    res.json({
      connected: true,
      models: response.data.models?.map(m => m.name) || [],
      version: response.data.version
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

// Upload and process document
app.post('/api/knowledge-base/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase().slice(1);
    const documentId = uuidv4();
    
    // Extract text from file
    console.log(`Processing file: ${req.file.originalname}`);
    const text = await extractTextFromFile(req.file.path, fileExtension);
    
    // Create document record
    const document = {
      id: documentId,
      name: req.file.originalname,
      type: fileExtension,
      size: req.file.size,
      uploadedAt: new Date(),
      status: 'indexed',
      filePath: req.file.path,
      textContent: text
    };
    
    documents.push(document);
    
    // Clean up uploaded file
    await fs.remove(req.file.path);
    
    console.log(`Document processed successfully: ${req.file.originalname}`);
    
    res.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        status: document.status
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Failed to process document',
      details: error.message
    });
  }
});

// Process document for RAG
app.post('/api/rag/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const options = req.body.options ? JSON.parse(req.body.options) : {};
    const { chunkSize = 1000, chunkOverlap = 200 } = options;
    
    const fileExtension = path.extname(req.file.originalname).toLowerCase().slice(1);
    
    // Extract text
    const text = await extractTextFromFile(req.file.path, fileExtension);
    
    // Create chunks
    const chunks = chunkText(text, chunkSize, chunkOverlap);
    
    // Clean up uploaded file
    await fs.remove(req.file.path);
    
    res.json({
      success: true,
      chunks: chunks,
      totalChunks: chunks.length,
      originalText: text.substring(0, 500) + '...' // Preview
    });
    
  } catch (error) {
    console.error('RAG processing error:', error);
    
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Failed to process document for RAG',
      details: error.message
    });
  }
});

// Create embeddings
app.post('/api/rag/embed', async (req, res) => {
  try {
    const { text, model = 'mxbai-embed-large' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const embedding = await callOllama('embeddings', {
      model,
      prompt: text
    });
    
    res.json({
      embedding: embedding.embedding,
      model,
      usage: {
        prompt_tokens: text.length,
        total_tokens: text.length
      }
    });
    
  } catch (error) {
    console.error('Embedding error:', error);
    res.status(500).json({
      error: 'Failed to create embedding',
      details: error.message
    });
  }
});

// Search similar documents
app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, topK = 5, minScore = 0.7 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Simple text search for demo (in production, use vector similarity)
    const results = [];
    
    for (const doc of documents) {
      if (doc.textContent && doc.textContent.toLowerCase().includes(query.toLowerCase())) {
        // Create chunks for matching documents
        const chunks = chunkText(doc.textContent);
        
        // Find best matching chunks
        const matchingChunks = chunks.filter(chunk => 
          chunk.content.toLowerCase().includes(query.toLowerCase())
        ).slice(0, topK);
        
        for (const chunk of matchingChunks) {
          results.push({
            chunk: {
              id: chunk.id,
              content: chunk.content,
              metadata: {
                ...chunk.metadata,
                source: doc.name
              }
            },
            score: 0.8, // Mock score
            document: {
              id: doc.id,
              name: doc.name,
              type: doc.type
            }
          });
        }
      }
    }
    
    res.json(results.slice(0, topK));
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      details: error.message
    });
  }
});

// RAG Chat
app.post('/api/rag/chat', async (req, res) => {
  try {
    const { 
      message, 
      useRAG = true, 
      topK = 5, 
      model = 'llama3.2', 
      temperature = 0.7, 
      maxTokens = 2000 
    } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    let context = '';
    let searchResults = [];
    
    if (useRAG) {
      // Search for relevant documents
      const searchResponse = await axios.post(`http://localhost:${PORT}/api/rag/search`, {
        query: message,
        topK
      });
      
      searchResults = searchResponse.data;
      
      if (searchResults.length > 0) {
        context = '\nRelevant documents:\n' + 
          searchResults.map((result, index) => 
            `${index + 1}. ${result.document.name}: ${result.chunk.content}`
          ).join('\n\n');
      }
    }
    
    // Generate response using Ollama
    const prompt = useRAG && context ? 
      `You are a helpful assistant. Answer the user's question based on the provided documents. If the answer is not in the documents, say so clearly.\n\n${context}\n\nUser question: ${message}` :
      message;
    
    const response = await callOllama('generate', {
      model,
      prompt,
      options: {
        temperature,
        num_predict: maxTokens
      },
      stream: false
    });
    
    res.json({
      response: response.response,
      searchResults: useRAG ? searchResults : [],
      usage: {
        prompt_tokens: prompt.length,
        completion_tokens: response.response?.length || 0,
        total_tokens: prompt.length + (response.response?.length || 0)
      },
      model
    });
    
  } catch (error) {
    console.error('RAG chat error:', error);
    res.status(500).json({
      error: 'Chat failed',
      details: error.message
    });
  }
});

// Regular chat endpoint
app.post('/api/chat/send', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Mock response for demo
    res.json({
      id: uuidv4(),
      content: `I received your message: "${content}". This is a demo response since no actual AI model is configured for regular chat.`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Chat failed',
      details: error.message
    });
  }
});

// Get documents
app.get('/api/knowledge-base/documents', (req, res) => {
  const documentsWithoutContent = documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
    status: doc.status
  }));
  
  res.json({ documents: documentsWithoutContent });
});

// Delete document
app.delete('/api/knowledge-base/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docIndex = documents.findIndex(doc => doc.id === id);
    
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = documents[docIndex];
    
    // Remove file if it exists
    if (document.filePath && await fs.pathExists(document.filePath)) {
      await fs.remove(document.filePath);
    }
    
    // Remove from memory
    documents.splice(docIndex, 1);
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete document',
      details: error.message
    });
  }
});

// Vector store stats
app.get('/api/rag/stats', (req, res) => {
  res.json({
    totalDocuments: documents.length,
    totalChunks: documents.reduce((sum, doc) => {
      if (doc.textContent) {
        return sum + chunkText(doc.textContent).length;
      }
      return sum;
    }, 0),
    embeddedChunks: 0, // Mock for demo
    storageSize: documents.reduce((sum, doc) => sum + doc.size, 0),
    models: ['mxbai-embed-large', 'llama3.2']
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📚 Knowledge Base API: http://localhost:${PORT}/api/knowledge-base`);
  console.log(`🤖 RAG API: http://localhost:${PORT}/api/rag`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n⚡ Make sure Ollama is running on http://localhost:11434`);
});
