# 🤖 Chatbot AI with RAG - Setup Guide

This guide will help you set up the complete RAG-enabled AI Chatbot system.

## 📋 Prerequisites

### 1. Install Node.js
- Download and install Node.js (v16 or higher) from: https://nodejs.org/
- Verify installation: `node --version`

### 2. Install Ollama
- Download Ollama from: https://ollama.ai/
- Install and start Ollama
- Pull required models:
  ```bash
  ollama pull llama3.2
  ollama pull mxbai-embed-large
  ```
- Verify Ollama is running: Visit http://localhost:11434

## 🚀 Quick Start

### Option 1: Automated Setup (Windows)
Run the PowerShell script:
```powershell
.\start-servers.ps1
```

### Option 2: Manual Setup

#### Step 1: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### Step 2: Start Backend Server
```bash
cd backend
npm start
# Server will start on http://localhost:5000
```

#### Step 3: Start Frontend Server (New Terminal)
```bash
npm run dev
# Server will start on http://localhost:3000
```

## 🔧 Configuration

### Environment Variables
The frontend is configured to use the backend at `http://localhost:5000/api` via `.env.local`

### Ollama Models
Make sure these models are available:
- **Chat Model**: `llama3.2` (or any model you prefer)
- **Embedding Model**: `mxbai-embed-large`

Check available models: `ollama list`

## 📚 How to Use RAG Features

### 1. Configure Ollama in Admin Panel
1. Go to http://localhost:3000/admin
2. Login (use any credentials for demo)
3. Navigate to **Settings**
4. Select **"Ollama (Local)"** as the AI Model
5. Configure:
   - API URL: `http://localhost:11434`
   - Chat Model: `llama3.2`
   - Embedding Model: `mxbai-embed-large`
   - Enable RAG toggle
   - Set chunk size, overlap, and Top-K values
6. Click **"Test Connection"** to verify Ollama is working
7. **Save Settings**

### 2. Upload Documents
1. Go to **Knowledge Base** in admin panel
2. Upload documents (PDF, DOCX, TXT, CSV)
3. Documents will be automatically processed and indexed
4. Switch to **"Embeddings"** tab to see processing status

### 3. Chat with Documents
1. Go to the **Chat Interface** (http://localhost:3000/chat)
2. Make sure the **"RAG On"** toggle is enabled
3. Ask questions about your uploaded documents
4. The AI will search through documents and provide contextual answers

## 🔍 Testing the Setup

### Test Backend API
```bash
# Health check
curl http://localhost:5000/api/health

# Test Ollama connection
curl -X POST http://localhost:5000/api/rag/ollama/test \
  -H "Content-Type: application/json" \
  -d '{"apiUrl": "http://localhost:11434"}'
```

### Test Document Upload
1. Go to http://localhost:3000/admin/knowledge-base
2. Upload a sample document
3. Check if it appears in the documents list
4. Switch to "Search" tab and try searching

### Test RAG Chat
1. Upload a document with some content
2. Go to chat interface
3. Enable RAG toggle
4. Ask questions about the document content
5. Check if responses reference the uploaded documents

## 🛠️ Troubleshooting

### Common Issues

#### "Failed to upload document"
- **Check**: Backend server is running on port 5000
- **Check**: File size is under 10MB
- **Check**: File format is supported (PDF, DOCX, TXT, CSV)

#### "Ollama service unavailable"
- **Check**: Ollama is installed and running
- **Run**: `ollama list` to see available models
- **Run**: `ollama pull llama3.2` if model is missing
- **Check**: http://localhost:11434 is accessible

#### "RAG not working"
- **Check**: Ollama models are downloaded
- **Check**: RAG is enabled in Settings
- **Check**: Documents are uploaded and processed
- **Check**: Console logs for error messages

#### "Connection refused on port 5000"
- **Check**: Backend server is running
- **Run**: `cd backend && npm start`
- **Check**: No other service is using port 5000

#### "Frontend not loading"
- **Check**: Frontend server is running on port 3000
- **Run**: `npm run dev`
- **Check**: `.env.local` has correct backend URL

## 📁 Project Structure

```
Chatbot_AI/
├── src/                    # Frontend source code
├── backend/               # Backend server
│   ├── server.js         # Main server file
│   ├── package.json      # Backend dependencies
│   └── uploads/          # Temporary file storage
├── .env.local            # Environment configuration
├── start-servers.ps1     # Automated startup script
└── SETUP.md             # This guide
```

## 🔧 Development

### Backend Development
- **File**: `backend/server.js`
- **Port**: 5000
- **Hot Reload**: `cd backend && npm run dev` (requires nodemon)

### Frontend Development
- **Port**: 3000
- **Hot Reload**: `npm run dev`
- **Build**: `npm run build`

### Adding New Features
1. **Backend**: Add routes in `server.js`
2. **Frontend**: Add API calls in `src/services/api.ts`
3. **UI**: Update components in `src/pages/`

## 🚀 Production Deployment

For production, consider:
1. **Database**: Replace in-memory storage with PostgreSQL/MongoDB
2. **Vector Database**: Use Pinecone, Weaviate, or Chroma
3. **File Storage**: Use cloud storage (AWS S3, Google Cloud)
4. **Authentication**: Implement proper user authentication
5. **HTTPS**: Use SSL certificates
6. **Monitoring**: Add logging and error tracking

## 📞 Support

If you encounter issues:
1. Check the console logs in both frontend and backend
2. Verify all prerequisites are installed
3. Test individual components (Ollama, backend, frontend)
4. Check network connectivity and ports

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Backend server starts without errors on port 5000
- ✅ Frontend loads at http://localhost:3000
- ✅ Ollama connection test passes in admin settings
- ✅ Documents upload successfully
- ✅ RAG chat provides document-based answers
- ✅ Source attribution appears in chat responses

Happy chatting with your documents! 🤖📚
