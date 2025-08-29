const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Database connection
const database = require('./config/database');

// MongoDB Models
const Settings = require('./models/Settings');
const Document = require('./models/Document');
const ChatSession = require('./models/Chat');
const User = require('./models/User');
const ScrapedContent = require('./models/ScrapedContent');

// Web Scraping Service
const WebScraper = require('./services/webScraper');

// OpenAI integration
const OpenAI = require('openai');

// Create a function to get OpenAI client with dynamic API key
const getOpenAIClient = async () => {
  let apiKey = null;
  
  // Try to get API key from database first
  if (database.isConnected) {
    try {
      const settings = await Settings.findOne({ isDefault: true });
      if (settings && settings.openai && settings.openai.apiKey) {
        apiKey = settings.openai.apiKey;
      }
    } catch (error) {
      console.error('Error fetching API key from database:', error);
    }
  }
  
  // Fallback to environment variable only if no database key found
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
  }
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set it in the admin settings.');
  }
  
  return new OpenAI({ apiKey });
};

// Document processors
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const csv = require('csv-parser');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Message Reaction Routes
app.post('/api/messages/:messageId/reaction', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction, sessionId } = req.body; // reaction: 'like' | 'dislike' | null

    console.log(`📝 Message reaction: ${messageId} -> ${reaction} (Session: ${sessionId})`);

    // Here you would typically store the reaction in your database
    // For now, we'll just log it and return success
    
    // Example: Store in database
    // await MessageReaction.findOneAndUpdate(
    //   { messageId, sessionId },
    //   { reaction, timestamp: new Date() },
    //   { upsert: true }
    // );

    res.json({
      success: true,
      messageId,
      reaction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error storing message reaction:', error);
    res.status(500).json({
      error: 'Failed to store message reaction',
      details: error.message
    });
  }
});

// Get message reactions analytics (optional)
app.get('/api/messages/reactions/analytics', async (req, res) => {
  try {
    // Here you would query your database for reaction analytics
    // For now, return mock data
    const analytics = {
      totalReactions: 156,
      likes: 124,
      dislikes: 32,
      likeRatio: 0.79,
      recentReactions: [
        { messageId: 'msg1', reaction: 'like', timestamp: new Date() },
        { messageId: 'msg2', reaction: 'dislike', timestamp: new Date() },
      ]
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching reaction analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch reaction analytics',
      details: error.message
    });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join', (sessionId) => {
    socket.join(sessionId);
    console.log(`Client ${socket.id} joined session ${sessionId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  // Handle real-time chat messages
  socket.on('chat_message', (data) => {
    socket.to(data.sessionId).emit('message', data);
  });
});

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

// Initialize database connection (graceful fallback)
database.connect().then(() => {
  database.initializeDefaultData();
  console.log('✅ Database initialization complete');
}).catch((error) => {
  console.warn('⚠️  MongoDB not available - running in fallback mode');
  console.log('💡 To enable MongoDB persistence:');
  console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
  console.log('   2. Start MongoDB service');
  console.log('   3. Restart this server');
  console.log('📊 Continuing with in-memory storage...');
});

// Fallback in-memory storage (when MongoDB is not available)
let fallbackDocuments = [];
let fallbackSettings = {
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
    backgroundColor: '#ffffff',
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
  openai: {
    enabled: true,
    apiKey: '',
    model: 'gpt-3.5-turbo',
    embeddingModel: 'text-embedding-ada-002',
    temperature: 0.7,
    maxTokens: 1000,
    ragEnabled: true,
    topK: 5
  }
};

// Ollama configuration
const OLLAMA_BASE_URL = 'http://localhost:11434';

// Utility functions
const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let start = 0;
  const maxChunks = 100; // Safety limit to prevent infinite loops
  
  // Input validation
  if (!text || typeof text !== 'string') {
    console.log('⚠️ Invalid text input for chunking');
    return [];
  }
  
  if (text.length === 0) {
    console.log('⚠️ Empty text for chunking');
    return [];
  }
  
  // Ensure reasonable chunk size
  chunkSize = Math.max(100, Math.min(chunkSize, 5000));
  overlap = Math.max(0, Math.min(overlap, chunkSize / 2));
  
  console.log(`📝 Chunking ${text.length} characters with chunk size ${chunkSize} and overlap ${overlap}`);
  
  while (start < text.length && chunks.length < maxChunks) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    // Skip empty chunks
    if (chunk.trim().length > 0) {
      chunks.push({
        id: uuidv4(),
        content: chunk.trim(),
        metadata: {
          chunkIndex: chunks.length,
          start,
          end,
          originalLength: chunk.length
        }
      });
    }
    
    // Calculate next start position
    const nextStart = end - overlap;
    
    // Prevent infinite loop
    if (nextStart <= start) {
      start = end;
    } else {
      start = nextStart;
    }
    
    // Safety break
    if (start >= text.length) break;
  }
  
  console.log(`✅ Created ${chunks.length} chunks successfully`);
  
  if (chunks.length >= maxChunks) {
    console.log(`⚠️ Hit maximum chunk limit of ${maxChunks}. Text may be truncated.`);
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
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      ollama: 'checking...'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
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
  let uploadedFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    uploadedFilePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase().slice(1);
    
    console.log(`📄 Processing file: ${req.file.originalname} (${fileExtension})`);
    console.log(`📏 File size: ${req.file.size} bytes`);
    
    // Validate file type
    const allowedTypes = ['pdf', 'docx', 'doc', 'txt', 'csv'];
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`Unsupported file type: ${fileExtension}. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Extract text from file with detailed logging
    console.log(`🔤 Extracting text from ${fileExtension} file...`);
    let text;
    try {
      text = await extractTextFromFile(req.file.path, fileExtension);
      console.log(`✅ Text extracted successfully. Length: ${text.length} characters`);
    } catch (extractError) {
      console.error(`❌ Text extraction failed:`, extractError);
      throw new Error(`Failed to extract text from ${fileExtension} file: ${extractError.message}`);
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in the uploaded file');
    }
    
    // Create chunks
    console.log(`📝 Creating text chunks...`);
    const chunks = chunkText(text);
    console.log(`✅ Created ${chunks.length} chunks`);
    
    // Check database connection before saving
    if (!database.isConnected) {
      throw new Error('Database not connected. Cannot save document.');
    }
    
    // Create document record in MongoDB
    console.log(`💾 Saving document to database...`);
    const document = new Document({
      name: req.file.originalname,
      type: fileExtension,
      size: req.file.size,
      status: 'indexed',
      textContent: text,
      chunks: chunks,
      metadata: {
        originalPath: req.file.path,
        mimeType: req.file.mimetype,
        processedAt: new Date()
      },
      indexedAt: new Date()
    });
    
    await document.save();
    console.log(`✅ Document saved to database with ID: ${document._id}`);
    
    // Clean up uploaded file
    await fs.remove(req.file.path);
    console.log(`🗑️ Temporary file cleaned up`);
    
    console.log(`🎉 Document processed successfully: ${req.file.originalname}`);
    
    res.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      document: {
        id: document._id,
        name: document.name,
        type: document.type,
        size: document.size,
        status: document.status,
        uploadedAt: document.createdAt,
        chunksCount: chunks.length,
        textLength: text.length
      }
    });
    
  } catch (error) {
    console.error(`❌ Upload error for ${req.file?.originalname || 'unknown file'}:`, error);
    
    // Clean up file on error
    if (uploadedFilePath && await fs.pathExists(uploadedFilePath)) {
      try {
        await fs.remove(uploadedFilePath);
        console.log(`🗑️ Cleaned up failed upload file: ${uploadedFilePath}`);
      } catch (cleanupError) {
        console.error(`❌ Failed to cleanup file:`, cleanupError);
      }
    }
    
    // Determine error type and provide helpful message
    let errorMessage = 'Failed to process document';
    let errorDetails = error.message;
    
    if (error.message.includes('ENOENT')) {
      errorMessage = 'File not found during processing';
    } else if (error.message.includes('Database not connected')) {
      errorMessage = 'Database connection error';
    } else if (error.message.includes('Failed to extract text')) {
      errorMessage = 'Could not read file content';
    } else if (error.message.includes('Unsupported file type')) {
      errorMessage = 'Invalid file type';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorDetails,
      file: req.file?.originalname || 'unknown'
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
    
    // Search documents using MongoDB text search
    const documents = await Document.find(
      { 
        $text: { $search: query },
        status: 'indexed'
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(topK * 2); // Get more docs to search chunks
    
    const results = [];
    
    for (const doc of documents) {
      // Find best matching chunks
      const matchingChunks = doc.chunks.filter(chunk => 
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
          score: Math.random() * 0.3 + 0.7, // Mock score between 0.7-1.0
          document: {
            id: doc._id,
            name: doc.name,
            type: doc.type
          }
        });
      }
    }
    
    // Sort by score and limit results
    results.sort((a, b) => b.score - a.score);
    res.json(results.slice(0, topK));
    
  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to simple search if text search fails
    try {
      const documents = await Document.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { textContent: { $regex: query, $options: 'i' } }
        ],
        status: 'indexed'
      }).limit(topK);
      
      const results = [];
      for (const doc of documents) {
        const matchingChunks = doc.chunks.filter(chunk => 
          chunk.content.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 2);
        
        for (const chunk of matchingChunks) {
          results.push({
            chunk: {
              id: chunk.id,
              content: chunk.content,
              metadata: { ...chunk.metadata, source: doc.name }
            },
            score: 0.75,
            document: {
              id: doc._id,
              name: doc.name,
              type: doc.type
            }
          });
        }
      }
      
      res.json(results);
      
    } catch (fallbackError) {
      res.status(500).json({
        error: 'Search failed',
        details: fallbackError.message
      });
    }
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

// OpenAI Chat endpoint
app.post('/api/openai/chat', async (req, res) => {
  try {
    const { 
      message, 
      model = 'gpt-3.5-turbo', 
      temperature = 0.7, 
      maxTokens = 1000,
      systemPrompt = 'You are a helpful AI assistant.'
    } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

        // Create OpenAI client with dynamic API key
    const openaiClient = await getOpenAIClient();
    
    const completion = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature,
      max_tokens: maxTokens,
    });
    
    res.json({
      id: completion.id,
      content: completion.choices[0].message.content,
      model: completion.model,
      usage: completion.usage,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('OpenAI chat error:', error);
    res.status(500).json({
      error: 'OpenAI chat failed',
      details: error.message
    });
  }
});

// OpenAI RAG Chat endpoint
app.post('/api/openai/rag-chat', async (req, res) => {
  try {
    const { 
      message, 
      useRAG = true, 
      topK = 5, 
      model = 'gpt-3.5-turbo', 
      temperature = 0.7, 
      maxTokens = 1000 
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
        context = searchResults.map((result, index) => 
          `Document ${index + 1} (${result.document.name}):\n${result.chunk.content}`
        ).join('\n\n');
      }
    }
    
    // Generate response using OpenAI
    const systemPrompt = useRAG && context ? 
      `You are a helpful assistant. Answer the user's question based on the provided documents. If the answer is not in the documents, say so clearly.\n\nRelevant documents:\n${context}` :
      'You are a helpful AI assistant.';
    
    // Create OpenAI client with dynamic API key
    const openaiClient = await getOpenAIClient();
    
    const completion = await openaiClient.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature,
      max_tokens: maxTokens,
    });
    
    res.json({
      id: completion.id,
      content: completion.choices[0].message.content,
      model: completion.model,
      usage: completion.usage,
      searchResults: useRAG ? searchResults : [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('OpenAI RAG chat error:', error);
    res.status(500).json({
      error: 'OpenAI RAG chat failed',
      details: error.message
    });
  }
});

// OpenAI Embeddings endpoint
app.post('/api/openai/embeddings', async (req, res) => {
  try {
    const { text, model = 'text-embedding-ada-002' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }


    
    const openaiClient = await getOpenAIClient();
    const embedding = await openaiClient.embeddings.create({
      model,
      input: text,
    });
    
    res.json({
      embedding: embedding.data[0].embedding,
      model: embedding.model,
      usage: embedding.usage
    });
    
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    res.status(500).json({
      error: 'Failed to create embedding',
      details: error.message
    });
  }
});

// Test OpenAI connection
app.post('/api/openai/test', async (req, res) => {
  try {
    // Use the dynamic OpenAI client
    const openaiClient = await getOpenAIClient();
    
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });
    
    res.json({
      connected: true,
      model: completion.model,
      usage: completion.usage
    });
    
  } catch (error) {
    console.log('OpenAI test error (non-critical):', error.message);
    
    // Handle specific error types gracefully
    if (error.status === 429) {
      return res.status(200).json({
        connected: false,
        error: 'OpenAI quota exceeded. Please check your billing and usage limits.',
        type: 'quota_exceeded'
      });
    }
    
    if (error.status === 401) {
      return res.status(200).json({
        connected: false,
        error: 'Invalid OpenAI API key. Please check your API key.',
        type: 'invalid_key'
      });
    }
    
    res.status(200).json({
      connected: false,
      error: error.message || 'Failed to connect to OpenAI',
      type: 'connection_error'
    });
  }
});

// Regular chat endpoint with RAG support (primary endpoint for frontend)
app.post('/api/chat/send', upload.array('attachments'), async (req, res) => {
  try {
    const { content, model = 'openai', useRAG = 'true' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Get settings for RAG and OpenAI configuration
    let settings = null;
    
    if (database.isConnected) {
      try {
        settings = await Settings.findOne({ isDefault: true });
      } catch (dbError) {
        console.log('Could not fetch settings from database');
      }
    }
    
    // If OpenAI is configured, use it with RAG (check for OpenAI models)
    const isOpenAIModel = model === 'openai' || model.startsWith('gpt-') || model.includes('turbo');
    if (isOpenAIModel) {
      try {
        const shouldUseRAG = useRAG === 'true' || useRAG === true;
        let context = '';
        let searchResults = [];
        
        // RAG: Search for relevant documents if enabled
        if (shouldUseRAG) {
          try {
            console.log(`🔍 Searching knowledge base for: "${content}"`);
            
            // Direct database search (more reliable than HTTP call)
            const topK = settings?.openai?.topK || 5;
            
            // Check if database is connected and try to reconnect if needed
            if (!database.isConnected) {
              console.log('⚠️ Database not connected, attempting to reconnect...');
              try {
                await database.connect();
                console.log('✅ Database reconnected successfully');
              } catch (reconnectError) {
                console.log('❌ Database reconnection failed, skipping RAG search');
                searchResults = [];
              }
            }
            
            if (database.isConnected) {
              const documents = await Document.find(
                { 
                  $text: { $search: content },
                  status: 'indexed'
                },
                { score: { $meta: 'textScore' } }
              )
              .sort({ score: { $meta: 'textScore' } })
              .limit(topK * 2);
              
              console.log(`🔍 Database query found ${documents.length} documents`);
              
              searchResults = [];
              
              for (const doc of documents) {
                // Find best matching chunks using better search logic
                const searchTerms = content.toLowerCase().split(' ').filter(term => term.length > 2);
                const matchingChunks = doc.chunks.filter(chunk => {
                  const chunkContent = chunk.content.toLowerCase();
                  // Match if chunk contains any significant search terms OR the full query
                  return chunkContent.includes(content.toLowerCase()) || 
                         searchTerms.some(term => chunkContent.includes(term));
                }).slice(0, topK);
                
                console.log(`📄 Document "${doc.name}": found ${matchingChunks.length} matching chunks`);
                
                for (const chunk of matchingChunks) {
                  searchResults.push({
                    chunk: {
                      id: chunk.id,
                      content: chunk.content,
                      metadata: {
                        ...chunk.metadata,
                        source: doc.name
                      }
                    },
                    score: Math.random() * 0.3 + 0.7, // Placeholder score
                    document: {
                      id: doc._id,
                      name: doc.name,
                      type: doc.type
                    }
                  });
                }
              }
            }
            
            // Also search web scraped content if web scraping is enabled
            try {
              const settings = await Settings.findOne({ isDefault: true });
              if (settings?.webScraping?.enabled) {
                console.log(`🌐 Searching web content for: "${content}"`);
                
                const webResults = await ScrapedContent.find(
                  { 
                    $text: { $search: content },
                    status: 'success'
                  },
                  { score: { $meta: 'textScore' } }
                )
                .sort({ score: { $meta: 'textScore' } })
                .limit(topK);
                
                console.log(`🌐 Found ${webResults.length} web results`);
                
                // Add web results to search results
                for (const webResult of webResults) {
                  const searchTerms = content.toLowerCase().split(' ').filter(term => term.length > 2);
                  const webContent = webResult.content.toLowerCase();
                  
                  // Check if web content matches search terms
                  if (webContent.includes(content.toLowerCase()) || 
                      searchTerms.some(term => webContent.includes(term))) {
                    
                    searchResults.push({
                      chunk: {
                        id: uuidv4(),
                        content: webResult.content.substring(0, 1000), // First 1000 chars
                        metadata: {
                          source: 'web',
                          url: webResult.url,
                          title: webResult.title,
                          scrapedAt: webResult.scrapedAt
                        }
                      },
                      score: Math.random() * 0.3 + 0.7,
                      document: {
                        id: webResult._id,
                        name: webResult.title,
                        type: 'web'
                      }
                    });
                  }
                }
              }
            } catch (webSearchError) {
              console.log('⚠️ Web content search failed:', webSearchError.message);
            }
            
            console.log(`📋 Total RAG search returned ${searchResults.length} results (documents + web)`);
            
            if (searchResults.length > 0) {
              context = searchResults.map((result, index) => 
                `Document ${index + 1} (${result.document.name}):\n${result.chunk.content}`
              ).join('\n\n');
              
              console.log(`✅ Found ${searchResults.length} relevant documents for query: "${content}"`);
              console.log(`📄 Context preview: ${context.substring(0, 200)}...`);
            } else {
              console.log('❌ No relevant documents found in knowledge base');
            }
          } catch (ragError) {
            console.error('❌ RAG search failed:', ragError.message);
            console.log('⚠️ Continuing with regular chat without knowledge base...');
          }
        }
        
        // Create OpenAI client with dynamic API key
        const openaiClient = await getOpenAIClient();
        
        // Generate system prompt based on RAG context
        const systemPrompt = context ? 
          `You are a helpful AI assistant with access to a knowledge base. IMPORTANT INSTRUCTIONS:

1. FIRST, carefully check if the user's question can be answered using the provided documents from the knowledge base below
2. IF the answer IS found in the knowledge base: Provide a comprehensive answer based on that information
3. IF the answer is NOT found in the knowledge base: Clearly state "I don't have information about this in my knowledge base" and then provide a helpful general response

Knowledge Base Documents:
${context}

Please answer the user's question following the above guidelines.` :
          `You are a helpful AI assistant. I don't have access to a specific knowledge base for this query, so I'll provide a general response based on my training. ${settings?.promptTemplate || ''}`;
        
        const completion = await openaiClient.chat.completions.create({
          model: settings?.openai?.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content }
          ],
          temperature: settings?.openai?.temperature || 0.7,
          max_tokens: settings?.openai?.maxTokens || 1000,
        });
        
        return res.json({
          id: completion.id,
          content: completion.choices[0].message.content,
          model: completion.model,
          usage: completion.usage,
          searchResults: searchResults,
          timestamp: new Date().toISOString()
        });
        
      } catch (openaiError) {
        console.log('OpenAI chat error (non-critical):', openaiError.message);
        
        // Return error message for quota issues
        if (openaiError.status === 429) {
          return res.status(200).json({
            id: uuidv4(),
            content: "I apologize, but I'm currently experiencing API quota limitations. Please try again later or contact support.",
            error: 'quota_exceeded',
            timestamp: new Date().toISOString()
          });
        }
        
        // Continue to fallback response below
      }
    }
    
    // Fallback mock response
    res.json({
      id: uuidv4(),
      content: `I received your message: "${content}". This is a demo response since OpenAI is not properly configured. Please check your API key and settings.`,
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
app.get('/api/knowledge-base/documents', async (req, res) => {
  try {
    const documents = await Document.find({}, {
      textContent: 0, // Exclude large text content
      chunks: 0 // Exclude chunks for list view
    }).sort({ createdAt: -1 });
    
    const documentsWithoutContent = documents.map(doc => ({
      id: doc._id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      uploadedAt: doc.createdAt,
      status: doc.status,
      indexedAt: doc.indexedAt
    }));
    
    res.json({ documents: documentsWithoutContent });
    
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      error: 'Failed to get documents',
      details: error.message
    });
  }
});

// Delete document
app.delete('/api/knowledge-base/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Remove file if it exists
    if (document.metadata?.originalPath && await fs.pathExists(document.metadata.originalPath)) {
      await fs.remove(document.metadata.originalPath);
    }
    
    // Remove from database
    await Document.findByIdAndDelete(id);
    
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
app.get('/api/rag/stats', async (req, res) => {
  try {
    const totalDocuments = await Document.countDocuments();
    const documents = await Document.find({}, { chunks: 1, size: 1 });
    
    const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0);
    const embeddedChunks = documents.reduce((sum, doc) => {
      return sum + (doc.chunks?.filter(chunk => chunk.embedding?.length > 0).length || 0);
    }, 0);
    const storageSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
    
    res.json({
      totalDocuments,
      totalChunks,
      embeddedChunks,
      storageSize,
      models: ['mxbai-embed-large', 'llama3.2', 'text-embedding-ada-002', 'text-embedding-3-small']
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      details: error.message
    });
  }
});

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({ isDefault: true });
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({
        isDefault: true,
        openai: {
          apiKey: '' // Will be set through frontend settings
        }
      });
      await settings.save();
    }
    
    // Don't send sensitive data to frontend
    const settingsObj = settings.toObject();
    if (settingsObj.openai && settingsObj.openai.apiKey) {
      settingsObj.openai.apiKey = '***masked***';
    }
    
    res.json(settingsObj);
    
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: 'Failed to get settings',
      details: error.message
    });
  }
});

// Update settings
app.put('/api/settings', async (req, res) => {
  try {
    const newSettings = req.body;
    
    // Validate required fields
    if (!newSettings || typeof newSettings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }
    
    // Find existing settings or create new
    let settings = await Settings.findOne({ isDefault: true });
    
    if (!settings) {
      settings = new Settings({ isDefault: true });
    }
    
    // Update settings fields
    Object.keys(newSettings).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'isDefault') {
        settings[key] = newSettings[key];
      }
    });
    
    // Handle API key updates (don't overwrite if masked)
    if (newSettings.openai && newSettings.openai.apiKey && newSettings.openai.apiKey !== '***masked***') {
      settings.openai.apiKey = newSettings.openai.apiKey;
    }
    
    await settings.save();
    
    console.log('Settings updated successfully');
    
    // Return settings without sensitive data
    const settingsObj = settings.toObject();
    if (settingsObj.openai && settingsObj.openai.apiKey) {
      settingsObj.openai.apiKey = '***masked***';
    }
    
    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings: settingsObj 
    });
    
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({
      error: 'Failed to update settings',
      details: error.message
    });
  }
});

// Get available models
app.get('/api/settings/models', (req, res) => {
  res.json({
    chat: [
      { id: 'openai', name: 'OpenAI', description: 'GPT models from OpenAI' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
      { id: 'ollama', name: 'Ollama (Local)', description: 'Run models locally with Ollama' }
    ],
    embedding: [
      { id: 'text-embedding-ada-002', name: 'Ada v2', description: 'Most capable embedding model' },
      { id: 'mxbai-embed-large', name: 'MxBai Embed Large', description: 'High-quality embeddings' }
    ]
  });
});

// Bot Management Routes
const botRoutes = require('./routes/bots');
const widgetRoutes = require('./routes/widget');
const deploymentRoutes = require('./routes/deployment');

// Middleware for authentication (placeholder - implement proper auth)
const authenticateUser = (req, res, next) => {
  // For development, use a default user
  req.user = { id: '1', role: 'admin' };
  next();
};

// Apply routes
app.use('/api/bots', authenticateUser, botRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/deployment', authenticateUser, deploymentRoutes);

// Serve widget static files
app.use('/widget.js', express.static(path.join(__dirname, 'public/widget.js')));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

// Web Scraping API endpoints
const webScraper = new WebScraper();

// Get web scraping settings
app.get('/api/web-scraping/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne({ isDefault: true });
    res.json({
      webScraping: settings?.webScraping || {
        enabled: false,
        urls: [],
        cacheTimeout: 3600000,
        maxUrls: 10,
        requestTimeout: 10000
      }
    });
  } catch (error) {
    console.error('Web scraping settings error:', error);
    res.status(500).json({ error: 'Failed to get web scraping settings' });
  }
});

// Update web scraping settings
app.put('/api/web-scraping/settings', async (req, res) => {
  try {
    const { webScraping } = req.body;
    
    await Settings.findOneAndUpdate(
      { isDefault: true },
      { $set: { webScraping } },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, message: 'Web scraping settings updated' });
  } catch (error) {
    console.error('Update web scraping settings error:', error);
    res.status(500).json({ error: 'Failed to update web scraping settings' });
  }
});

// Add URL to scraping list
app.post('/api/web-scraping/urls', async (req, res) => {
  try {
    const { url, name, description } = req.body;
    
    if (!url || !name) {
      return res.status(400).json({ error: 'URL and name are required' });
    }

    const urlEntry = {
      id: uuidv4(),
      url,
      name,
      description: description || '',
      enabled: true,
      scrapingStatus: 'pending',
      addedAt: new Date()
    };

    await Settings.findOneAndUpdate(
      { isDefault: true },
      { $push: { 'webScraping.urls': urlEntry } },
      { new: true, upsert: true }
    );

    res.json({ success: true, urlEntry });
  } catch (error) {
    console.error('Add URL error:', error);
    res.status(500).json({ error: 'Failed to add URL' });
  }
});

// Remove URL from scraping list
app.delete('/api/web-scraping/urls/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await Settings.findOneAndUpdate(
      { isDefault: true },
      { $pull: { 'webScraping.urls': { id } } }
    );

    // Also remove cached content
    await ScrapedContent.deleteMany({ 'metadata.urlId': id });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove URL error:', error);
    res.status(500).json({ error: 'Failed to remove URL' });
  }
});

// Manually trigger scraping for specific URL
app.post('/api/web-scraping/scrape/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const settings = await Settings.findOne({ isDefault: true });
    const urlEntry = settings?.webScraping?.urls?.find(u => u.id === id);
    
    if (!urlEntry) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const result = await webScraper.scrapeUrl(urlEntry.url, {
      timeout: settings?.webScraping?.requestTimeout || 10000,
      userAgent: settings?.webScraping?.userAgent,
      maxContentLength: settings?.webScraping?.maxContentLength || 50000
    });

    // Update URL status
    await Settings.findOneAndUpdate(
      { isDefault: true, 'webScraping.urls.id': id },
      {
        $set: {
          'webScraping.urls.$.scrapingStatus': result.status,
          'webScraping.urls.$.lastScraped': new Date(),
          'webScraping.urls.$.errorMessage': result.error || undefined,
          'webScraping.urls.$.contentLength': result.contentLength
        }
      }
    );

    if (result.status === 'success') {
      // Save/update cached content
      await ScrapedContent.findOneAndUpdate(
        { url: urlEntry.url },
        {
          ...result,
          chunks: [], // Will be populated later
          metadata: {
            urlId: id,
            userAgent: settings?.webScraping?.userAgent
          }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Manual scraping error:', error);
    res.status(500).json({ error: 'Failed to scrape URL' });
  }
});

// Get scraped content
app.get('/api/web-scraping/content', async (req, res) => {
  try {
    const content = await ScrapedContent.find({ status: 'success' })
      .select('url title description contentLength scrapedAt')
      .sort({ scrapedAt: -1 });
    
    res.json({ content });
  } catch (error) {
    console.error('Get scraped content error:', error);
    res.status(500).json({ error: 'Failed to get scraped content' });
  }
});

// Search scraped content (for RAG integration)
app.post('/api/web-scraping/search', async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Search scraped content using MongoDB text search
    const results = await ScrapedContent.find(
      { 
        $text: { $search: query },
        status: 'success'
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(topK);

    // Format results similar to document search
    const formattedResults = results.map(result => ({
      chunk: {
        id: uuidv4(),
        content: result.content.substring(0, 1000), // First 1000 chars
        metadata: {
          source: 'web',
          url: result.url,
          title: result.title,
          scrapedAt: result.scrapedAt
        }
      },
      score: Math.random() * 0.3 + 0.7, // Placeholder score
      document: {
        id: result._id,
        name: result.title,
        type: 'web'
      }
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Web content search error:', error);
    res.status(500).json({ error: 'Failed to search web content' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`\n📋 API Endpoints:`);
  console.log(`  🤖 Bot Management: http://localhost:${PORT}/api/bots`);
  console.log(`  💬 Widget API: http://localhost:${PORT}/api/widget`);
  console.log(`  🚀 Deployment: http://localhost:${PORT}/api/deployment`);
  console.log(`  📚 Knowledge Base: http://localhost:${PORT}/api/knowledge-base`);
  console.log(`  🧠 RAG API: http://localhost:${PORT}/api/rag`);
  console.log(`  🤖 OpenAI API: http://localhost:${PORT}/api/openai`);
  console.log(`  💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`  🌐 Web Scraping: http://localhost:${PORT}/api/web-scraping`);
  console.log(`  ⚙️ Settings: http://localhost:${PORT}/api/settings`);
  console.log(`  🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n🔌 WebSocket: http://localhost:${PORT} (Socket.IO)`);
  console.log(`📱 Widget Script: http://localhost:${PORT}/widget.js`);
  console.log(`\n📊 Database: ${database.isConnected ? '✅ MongoDB Connected' : '❌ MongoDB Disconnected'}`);
  console.log(`⚡ Make sure Ollama is running on http://localhost:11434`);
  console.log(`🔑 OpenAI API Key: Dynamic (from database settings)`);
  console.log(`\n🎯 Bot Platform Ready! Create bots via frontend and deploy with embed codes.`);
});
