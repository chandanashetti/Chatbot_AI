# 🧠 OpenAI Integration Setup Guide

This guide will help you set up OpenAI integration for your chatbot with both regular chat and RAG (Retrieval Augmented Generation) capabilities.

## 🚀 Quick Setup

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp backend.env .env
   ```

2. The OpenAI API key has already been configured in the template file.

### Step 3: Start the Servers

#### Option A: Automated Start (Windows)
```powershell
.\start-servers.ps1
```

#### Option B: Manual Start

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
npm run dev
```

## 🔧 Configuration

### Admin Panel Setup

1. Open your browser and go to `http://localhost:3000/admin`
2. Login with any credentials (demo mode)
3. Navigate to **Settings**
4. Select **"OpenAI"** as the AI Model
5. Configure OpenAI settings:
   - **API Key**: Pre-configured with your key
   - **Chat Model**: Choose from GPT-3.5 Turbo, GPT-4, or GPT-4 Turbo
   - **Embedding Model**: Choose from available embedding models
   - **Enable RAG**: Toggle for document-based question answering
   - **Temperature**: Control response creativity (0-2)
   - **Max Tokens**: Maximum response length
   - **Top-K Results**: Number of documents to retrieve for RAG

6. Click **"Test Connection"** to verify OpenAI integration
7. **Save Settings**

## ✨ Features

### Chat Features
- **Regular Chat**: Direct conversation with OpenAI models
- **RAG Chat**: AI answers based on uploaded documents
- **Multiple Models**: Support for GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo
- **Customizable Parameters**: Temperature, max tokens, and more

### Knowledge Base Features
- **Document Upload**: PDF, DOCX, TXT, CSV support
- **Automatic Processing**: Documents are automatically processed for RAG
- **Smart Search**: AI finds relevant document sections
- **Context-Aware Responses**: AI answers based on document content

## 🔄 Usage Workflow

### For Regular Chat:
1. Select "OpenAI" as the model in settings
2. Disable RAG if you want direct AI conversation
3. Start chatting at `http://localhost:3000`

### For RAG-Enabled Chat:
1. Upload documents in the Knowledge Base section
2. Enable RAG in OpenAI settings
3. Start asking questions about your documents
4. AI will search documents and provide contextual answers

## 🛠️ API Endpoints

The integration adds these new endpoints:

### OpenAI Endpoints
- `POST /api/openai/chat` - Direct chat with OpenAI
- `POST /api/openai/rag-chat` - RAG-enabled chat
- `POST /api/openai/embeddings` - Create embeddings
- `POST /api/openai/test` - Test API connection

### Enhanced Chat Endpoint
- `POST /api/chat/send` - Now supports OpenAI as default when configured

## 🔒 Security Notes

- API keys are stored in environment variables
- Keys are not exposed in frontend code
- Use environment files (.env) that are git-ignored
- Consider using environment-specific keys for production

## 🚨 Troubleshooting

### Connection Issues
- Verify your OpenAI API key is correct
- Check your internet connection
- Ensure you have OpenAI API credits available

### RAG Not Working
- Make sure documents are uploaded and processed
- Verify RAG is enabled in settings
- Check that the embedding model is properly configured

### Performance Issues
- Reduce max tokens for faster responses
- Lower the number of Top-K results
- Use GPT-3.5 Turbo for faster, more cost-effective responses

## 💡 Tips

1. **Cost Optimization**: Use GPT-3.5 Turbo for most tasks, GPT-4 for complex reasoning
2. **RAG Optimization**: Upload relevant documents and use specific questions
3. **Response Quality**: Adjust temperature based on your use case (lower for factual, higher for creative)
4. **Token Management**: Monitor token usage to control costs

## 🎯 Next Steps

- Upload your documents to the Knowledge Base
- Test both regular and RAG-enabled chat
- Customize the prompt templates for your specific use case
- Explore different OpenAI models for different scenarios

Your OpenAI integration is now ready! 🎉
