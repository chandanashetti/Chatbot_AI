# 🔐 Dynamic OpenAI API Key Management

## Overview
The system now supports **dynamic API key management** where OpenAI API keys are managed through the admin frontend and stored securely in the database, rather than being hardcoded in environment files.

## 🔄 **How It Works**

### **1. API Key Storage Priority**
1. **Primary**: Database-stored API key (set via admin frontend)
2. **Fallback**: Environment variable (optional, for backward compatibility)
3. **Error**: If neither is available, API calls will fail gracefully

### **2. Dynamic Key Retrieval**
- All OpenAI API calls now use `getOpenAIClient()` function
- This function checks the database first, then falls back to environment variables
- Keys are retrieved fresh for each API call to ensure updates are immediate

## 🛠 **Setup Instructions**

### **Backend Configuration**

#### **1. Environment Variables (Optional)**
```env
# Backend Environment (.env)
PORT=5000
NODE_ENV=production

# MongoDB Configuration (Required)
MONGODB_URI=mongodb://your-mongodb-connection-string
MONGODB_DB_NAME=chatbot_ai

# JWT Secret (Required)
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# OpenAI API Key (OPTIONAL - Fallback only)
# OPENAI_API_KEY=sk-your-optional-fallback-key

# Ollama Configuration (Optional)
OLLAMA_BASE_URL=http://localhost:11434
```

#### **2. Key Features**
- ✅ **No hardcoded API keys required**
- ✅ **Real-time key updates** (no server restart needed)
- ✅ **Secure database storage**
- ✅ **Graceful error handling**
- ✅ **Admin UI management**

### **Frontend Administration**

#### **1. Setting API Key**
1. Go to **Admin Panel → Settings**
2. Navigate to **OpenAI Configuration**
3. Enter your API key in the **API Key** field
4. Click **Save Settings**
5. Test connection with **Test Connection** button

#### **2. Clearing API Key**
1. Go to **Admin Panel → Settings → OpenAI Configuration**
2. Click the **Clear** button next to the API key field
3. Click **Save Settings**
4. The key will be removed from all systems immediately

#### **3. Visual Indicators**
- 🟢 **Green**: API key configured and working
- 🟡 **Yellow**: No API key configured
- 🔴 **Red**: API key configured but failing

## 🔧 **Technical Implementation**

### **Backend Changes**

#### **1. Dynamic OpenAI Client**
```javascript
// Creates OpenAI client with database-first key retrieval
const getOpenAIClient = async () => {
  let apiKey = null;
  
  // Try database first
  if (database.isConnected) {
    const settings = await Settings.findOne({ isDefault: true });
    if (settings?.openai?.apiKey) {
      apiKey = settings.openai.apiKey;
    }
  }
  
  // Fallback to environment
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
  }
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  return new OpenAI({ apiKey });
};
```

#### **2. Updated API Endpoints**
- `/api/openai/chat` - Dynamic key retrieval
- `/api/openai/rag-chat` - Dynamic key retrieval  
- `/api/openai/embeddings` - Dynamic key retrieval
- `/api/openai/test` - Dynamic key retrieval
- `/api/chat` - Dynamic key retrieval for OpenAI models

#### **3. Settings API**
- **GET** `/api/settings` - Returns masked API key (`***masked***`)
- **PUT** `/api/settings` - Saves API key securely
- Automatic key masking for frontend security

### **Frontend Changes**

#### **1. Settings Management**
```typescript
// Clear API key function
const clearOpenAIKey = async () => {
  const clearedSettings = {
    ...localSettings,
    openai: { ...localSettings.openai, apiKey: '' }
  };
  
  await settingsAPI.updateSettings(clearedSettings);
  // Key is immediately removed from database
};
```

#### **2. UI Enhancements**
- Clear button for API key removal
- Visual status indicators
- Real-time connection testing
- Warning messages for missing keys

## 🔒 **Security Features**

### **1. API Key Masking**
- Frontend never displays actual API keys
- Database queries return `***masked***` for security
- Only the backend can access raw API keys

### **2. Secure Storage**
- API keys stored in MongoDB with proper access controls
- No API keys in frontend bundle or logs
- Environment variables only used as fallback

### **3. Immediate Updates**
- Key changes take effect immediately
- No server restart required
- Real-time validation and testing

## 🚀 **Deployment Benefits**

### **1. Security**
- ✅ No API keys in code repositories
- ✅ No API keys in environment files (optional)
- ✅ Centralized key management
- ✅ Easy key rotation

### **2. Operations**
- ✅ No server restarts for key changes
- ✅ Real-time key testing
- ✅ Admin UI management
- ✅ Graceful error handling

### **3. Development**
- ✅ Easy local development setup
- ✅ Team key sharing through database
- ✅ Environment-agnostic configuration

## 🔄 **Migration from Environment Variables**

### **If you have existing API keys in environment:**

#### **1. Automatic Migration**
- Keep your existing `OPENAI_API_KEY` in environment
- The system will use it as fallback
- Set the key via admin UI when ready
- Remove from environment when comfortable

#### **2. Manual Migration**
1. Note your current API key from environment
2. Go to Admin Settings → OpenAI Configuration
3. Enter the API key in the frontend
4. Test the connection
5. Remove `OPENAI_API_KEY` from environment files
6. Restart server to confirm it works without environment key

## 🛠 **Troubleshooting**

### **Common Issues**

#### **1. "OpenAI API key not configured"**
- **Solution**: Set API key via Admin UI or check environment fallback
- **Check**: Database connection, Settings collection

#### **2. "API key invalid"**
- **Solution**: Verify key format (starts with `sk-`)
- **Check**: Test connection button in admin UI

#### **3. Keys not persisting**
- **Solution**: Check MongoDB connection
- **Check**: Settings save operation in network tab

#### **4. Frontend shows old key**
- **Solution**: Refresh page or clear browser cache
- **Check**: API response masking is working

### **Health Checks**
```bash
# Test backend API key status
curl http://localhost:5000/api/openai/test

# Check settings endpoint
curl http://localhost:5000/api/settings

# Verify database connection
curl http://localhost:5000/api/health
```

## 📋 **Checklist for Deployment**

### **Pre-deployment**
- [ ] MongoDB connection configured
- [ ] Database collections created
- [ ] Settings API endpoints working
- [ ] Frontend build includes new features

### **Post-deployment**
- [ ] Admin UI accessible
- [ ] OpenAI settings page loads
- [ ] API key can be set via frontend
- [ ] Test connection works
- [ ] Chat functionality works with new key system
- [ ] Clear key function works
- [ ] Environment fallback works (if configured)

## 🎯 **Next Steps**

### **Recommended Enhancements**
1. **API Key Encryption**: Encrypt stored API keys in database
2. **Key Rotation**: Automatic key rotation capabilities
3. **Multi-API Support**: Support for multiple API providers
4. **Audit Logging**: Track API key changes and usage
5. **Role-based Access**: Restrict key management to specific roles

This new system provides much better security, operational flexibility, and user experience for managing OpenAI API keys in your chatbot application! 🚀
