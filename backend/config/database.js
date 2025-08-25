const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      console.log('📊 Already connected to MongoDB');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_ai';
      
      const options = {
        // Connection options
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds
        
        // Authentication and database name
        dbName: process.env.MONGODB_DB_NAME || 'chatbot_ai',
      };

      // Connect to MongoDB
      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      console.log('📊 Connected to MongoDB successfully');
      console.log(`📁 Database: ${options.dbName}`);
      console.log(`🔗 Connection: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('📊 MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('📊 MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 MongoDB Connection Tips:');
        console.log('1. Make sure MongoDB is installed and running');
        console.log('2. Check if MongoDB service is started:');
        console.log('   - Windows: net start MongoDB');
        console.log('   - macOS/Linux: sudo systemctl start mongod');
        console.log('3. Verify connection string in .env file');
        console.log('4. Default MongoDB runs on mongodb://localhost:27017');
      }
      
      throw error;
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('📊 Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to database');
      }

      // Simple ping to check connection
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        connected: true,
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        readyState: mongoose.connection.readyState
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }

  // Initialize default data
  async initializeDefaultData() {
    try {
      const Settings = require('../models/Settings');
      const User = require('../models/User');

      // Create default settings if none exist
      const existingSettings = await Settings.findOne({ isDefault: true });
      if (!existingSettings) {
        const defaultSettings = new Settings({
          isDefault: true,
          openai: {
            apiKey: process.env.OPENAI_API_KEY || ''
          }
        });
        await defaultSettings.save();
        console.log('✅ Created default settings');
      }

      // Create default admin user if none exist
      const existingAdmin = await User.findOne({ role: 'superadmin' });
      if (!existingAdmin) {
        const defaultAdmin = new User({
          email: 'admin@chatbot.ai',
          password: 'admin123',
          name: 'System Administrator',
          role: 'superadmin',
          status: 'active',
          permissions: {
            admin: { create: true, read: true, update: true, delete: true },
            bots: { create: true, read: true, update: true, delete: true, deploy: true },
            knowledgeBase: { upload: true, read: true, delete: true, export: true },
            analytics: { view: true, export: true, advanced: true },
            settings: { view: true, update: true, system: true },
            users: { create: true, read: true, update: true, delete: true, permissions: true },
            integrations: { view: true, configure: true, connect: true },
            chat: { view: true, moderate: true, export: true }
          }
        });
        await defaultAdmin.save();
        console.log('✅ Created default admin user (admin@chatbot.ai / admin123)');
      }

    } catch (error) {
      console.error('❌ Error initializing default data:', error);
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
