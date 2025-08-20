# Chatbot AI Backend

Backend server for the AI Chatbot with RAG (Retrieval Augmented Generation) functionality.

## Features

- 📄 **Document Processing**: PDF, DOCX, DOC, TXT, CSV file support
- 🤖 **Ollama Integration**: Local LLM integration
- 🔍 **RAG Search**: Document-based question answering
- 💾 **File Upload**: Secure file handling with validation
- 🚀 **REST API**: Complete API for frontend integration

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Ollama** installed and running locally

### Installing Ollama

1. Download Ollama from: https://ollama.ai/
2. Install and start Ollama
3. Pull required models:
   ```bash
   ollama pull llama3.2
   ollama pull mxbai-embed-large
   ```

## Installation

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

4. Server will start on http://localhost:5000

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Knowledge Base
- `POST /api/knowledge-base/upload` - Upload document
- `GET /api/knowledge-base/documents` - List documents
- `DELETE /api/knowledge-base/documents/:id` - Delete document

### RAG (Retrieval Augmented Generation)
- `POST /api/rag/process` - Process document for RAG
- `POST /api/rag/embed` - Create embeddings
- `POST /api/rag/search` - Search similar documents
- `POST /api/rag/chat` - RAG-powered chat
- `GET /api/rag/stats` - Vector store statistics

### Ollama Integration
- `POST /api/rag/ollama/test` - Test Ollama connection

### Regular Chat
- `POST /api/chat/send` - Regular chat (non-RAG)

## Configuration

The server uses the following default settings:
- **Port**: 5000
- **Ollama URL**: http://localhost:11434
- **Upload Limit**: 10MB per file
- **Supported Formats**: PDF, DOCX, DOC, TXT, CSV

## File Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── uploads/           # Temporary file storage (auto-created)
└── README.md          # This file
```

## Usage with Frontend

1. Start the backend server (port 5000)
2. Start the frontend development server (port 3000)
3. The frontend will automatically connect to the backend API

## Troubleshooting

### Common Issues

1. **"Ollama service unavailable"**
   - Ensure Ollama is installed and running
   - Check if models are downloaded: `ollama list`
   - Verify Ollama is accessible at http://localhost:11434

2. **"Failed to upload document"**
   - Check file size (max 10MB)
   - Verify file format is supported
   - Ensure sufficient disk space

3. **"Port 5000 already in use"**
   - Change port in server.js or kill existing process
   - Use: `lsof -ti:5000 | xargs kill -9` (macOS/Linux)

### Testing Ollama Connection

```bash
# Test if Ollama is running
curl http://localhost:11434/api/tags

# Test model generation
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello, world!",
  "stream": false
}'
```

## Development

- **Logs**: Check console for detailed error messages
- **File Storage**: Uploaded files are temporarily stored in `./uploads`
- **Memory Storage**: Documents are stored in memory (use database for production)

## Production Considerations

For production deployment:

1. **Database**: Replace in-memory storage with PostgreSQL/MongoDB
2. **File Storage**: Use cloud storage (AWS S3, Google Cloud)
3. **Vector Database**: Use Pinecone, Weaviate, or Chroma
4. **Authentication**: Add JWT-based authentication
5. **Rate Limiting**: Implement API rate limiting
6. **Monitoring**: Add logging and monitoring
7. **HTTPS**: Use SSL certificates
8. **Environment Variables**: Use .env files for configuration

## License

MIT License
