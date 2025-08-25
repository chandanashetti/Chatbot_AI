# 🚀 Chatbot API Endpoints Summary

## Current Status
- **Backend Server**: Running on port 5000 ✅
- **Database**: MongoDB connected ✅  
- **OpenAI**: API key configured ✅
- **WebSocket**: Socket.IO working ✅

## 📧 Chat Endpoints for Frontend

### Primary Chat Endpoint (Recommended)
**POST** `/api/chat/send`
- **Purpose**: Main chat endpoint with RAG support
- **Format**: Form data (multipart/form-data)
- **RAG**: Automatically searches knowledge base
- **OpenAI**: Uses configured API key from database

**Request Body:**
```
content: "Your message here"
model: "openai" 
useRAG: "true"
```

**Response:**
```json
{
  "id": "completion-id",
  "content": "AI response with RAG context",
  "searchResults": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Alternative Endpoints

1. **POST** `/api/openai/rag-chat` - Pure OpenAI RAG
2. **POST** `/api/openai/chat` - Pure OpenAI without RAG
3. **POST** `/api/rag/chat` - Ollama RAG (local)

## 📚 Knowledge Base Endpoints

### Upload Documents
**POST** `/api/knowledge-base/upload`
- **Purpose**: Upload PDF, DOCX, TXT, CSV files
- **Format**: multipart/form-data with file
- **Processing**: Automatic text extraction and chunking

### List Documents  
**GET** `/api/knowledge-base/documents`
- **Purpose**: Get all uploaded documents
- **Response**: Array of document metadata

### Delete Document
**DELETE** `/api/knowledge-base/documents/:id`
- **Purpose**: Remove document from knowledge base

## 🔧 Settings Endpoints

### Get Settings
**GET** `/api/settings`
- **Purpose**: Get current bot configuration
- **Includes**: OpenAI settings, RAG settings, themes

### Update Settings  
**PUT** `/api/settings`
- **Purpose**: Update bot configuration
- **Body**: Complete settings object

## 🔍 Search & RAG

### Search Documents
**POST** `/api/rag/search`
- **Purpose**: Find relevant documents for a query
- **Body**: `{ "query": "search term", "topK": 5 }`

### RAG Stats
**GET** `/api/rag/stats`
- **Purpose**: Knowledge base statistics
- **Response**: Document count, chunk count, storage size

## ✅ Health & Testing

### Health Check
**GET** `/api/health`
- **Purpose**: Server and database status

### OpenAI Test
**POST** `/api/openai/test`
- **Purpose**: Test OpenAI connection and quota

## 🎯 For Your Use Case

**Frontend should use**: `/api/chat/send`
**Required**: Upload documents to `/api/knowledge-base/upload` first
**RAG**: Automatically enabled when documents exist
**OpenAI**: Uses your configured API key

## 📝 Next Steps

1. **Upload documents** to knowledge base via admin panel
2. **Test chat** - should automatically use RAG with your documents
3. **OpenAI quota**: Resolve billing to test fully
