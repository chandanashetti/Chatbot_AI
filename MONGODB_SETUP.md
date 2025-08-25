# 📊 MongoDB Setup Guide

This guide will help you set up MongoDB for your AI Chatbot to enable persistent data storage.

## 🚀 MongoDB Installation

### Windows
1. **Download MongoDB Community Server:**
   - Go to https://www.mongodb.com/try/download/community
   - Select Windows and download the installer
   - Run the installer and follow the setup wizard
   - Choose "Complete" installation
   - Install MongoDB as a Windows Service
   - Optionally install MongoDB Compass (GUI tool)

2. **Verify Installation:**
   ```powershell
   mongod --version
   mongo --version
   ```

### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

### Ubuntu/Linux
```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 🔧 Configuration

### 1. Environment Variables
Your `.env` file should include:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/chatbot_ai
MONGODB_DB_NAME=chatbot_ai
```

### 2. Database Structure
The chatbot uses these MongoDB collections:

#### **Settings Collection**
- Stores application settings (AI models, prompts, themes)
- Only one default settings document
- API keys are encrypted/masked for security

#### **Documents Collection**
- Stores uploaded files and their processed content
- Text chunks for RAG functionality
- Vector embeddings (when implemented)
- Full-text search indexes

#### **Chat Sessions Collection**
- Chat history and conversations
- Message metadata (tokens, models used)
- User sessions and preferences

#### **Users Collection**
- User accounts and authentication
- Roles and permissions
- Activity tracking and security features

## 🔐 Security Features

### Authentication
- Bcrypt password hashing
- JWT token support (ready for implementation)
- Account lockout after failed attempts
- Password reset functionality

### Data Protection
- API keys are masked in responses
- Sensitive data encryption
- Input validation and sanitization

## 🚀 Starting Your System

### Option 1: Automated (Windows)
```powershell
# Make sure MongoDB is running
net start MongoDB

# Start your chatbot servers
.\start-servers.ps1
```

### Option 2: Manual
```bash
# 1. Start MongoDB (if not running as service)
mongod

# 2. Start backend (new terminal)
cd backend
npm start

# 3. Start frontend (another terminal)
npm run dev
```

## 📈 Database Management

### MongoDB Compass (GUI)
- Download: https://www.mongodb.com/products/compass
- Connect to: `mongodb://localhost:27017`
- Browse your `chatbot_ai` database
- View collections, documents, and run queries

### Command Line
```bash
# Connect to MongoDB shell
mongo

# Switch to your database
use chatbot_ai

# View collections
show collections

# View documents
db.settings.find().pretty()
db.documents.find({}, {textContent: 0}).pretty()
db.users.find({}, {password: 0}).pretty()
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
Visit: `http://localhost:5000/api/health`

Response includes:
- Server status
- Database connection status
- MongoDB health information

### Database Stats
Visit: `http://localhost:5000/api/rag/stats`

Shows:
- Total documents stored
- Text chunks processed
- Storage usage
- Available models

## 🛠️ Troubleshooting

### Common Issues

#### 1. MongoDB Not Starting
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod
```

#### 2. Connection Refused
- Check if MongoDB is running: `ps aux | grep mongod`
- Verify port 27017 is not blocked
- Check MongoDB logs for errors

#### 3. Permission Issues
- Ensure MongoDB data directory is writable
- Check user permissions for MongoDB service

#### 4. Database Not Created
- Database and collections are created automatically
- First app startup initializes default data
- Check logs for any initialization errors

### Default Data
On first startup, the system creates:
- ✅ Default admin user: `admin@chatbot.ai` / `admin123`
- ✅ Default settings with your OpenAI configuration
- ✅ Required database indexes

## 📊 Benefits of MongoDB Integration

### ✅ **Data Persistence**
- Settings survive server restarts
- Document uploads are permanently stored
- Chat history is preserved

### ✅ **Scalability**
- Efficient document search with indexes
- Handles large document collections
- Ready for vector embeddings

### ✅ **Security**
- Encrypted API key storage
- User authentication ready
- Role-based permissions

### ✅ **Analytics**
- Track usage patterns
- Monitor chat performance
- Document access statistics

### ✅ **Backup & Recovery**
- Easy database backups
- Data import/export capabilities
- Disaster recovery ready

## 🎯 Next Steps

1. **Install MongoDB** using the instructions above
2. **Start your chatbot** with the updated backend
3. **Test the integration** by uploading documents
4. **Monitor the database** using Compass or health checks
5. **Backup your data** regularly

Your chatbot now has enterprise-grade data persistence! 🎉
