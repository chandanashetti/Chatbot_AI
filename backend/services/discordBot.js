const { Client, GatewayIntentBits, Events } = require('discord.js');
const DiscordMessage = require('../models/DiscordMessage');
const DiscordSettings = require('../models/DiscordSettings');
const axios = require('axios');

class DiscordBotService {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });
    
    this.isConnected = false;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.once(Events.ClientReady, () => {
      console.log(`Discord bot logged in as ${this.client.user.tag}`);
      this.isConnected = true;
      this.initializeDefaultSettings();
    });

    this.client.on(Events.MessageCreate, this.handleMessage.bind(this));
    
    this.client.on(Events.Error, error => {
      console.error('Discord client error:', error);
    });
  }

  async initializeDefaultSettings() {
    try {
      const defaultSettings = await DiscordSettings.findOne({ isDefault: true });
      if (!defaultSettings) {
        await DiscordSettings.create({
          isDefault: true,
          autoReply: true,
          useRAG: true,
          triggerWords: ['bot', 'help', '?', 'question', 'how', 'what', 'when', 'where', 'why', 'who']
        });
        console.log('Created default Discord bot settings');
      }
    } catch (error) {
      console.error('Error initializing Discord settings:', error);
    }
  }

  async handleMessage(message) {
    if (message.author.bot) return;

    const messageData = {
      messageId: message.id,
      content: message.content,
      author: {
        id: message.author.id,
        username: message.author.username,
        displayName: message.author.displayName || message.author.username,
        avatar: message.author.displayAvatarURL()
      },
      channel: {
        id: message.channel.id,
        name: message.channel.name || 'DM',
        type: message.channel.type
      },
      guild: message.guild ? {
        id: message.guild.id,
        name: message.guild.name,
        icon: message.guild.iconURL()
      } : null,
      timestamp: new Date(),
      replied: false
    };

    try {
      // Save message to database
      await DiscordMessage.create(messageData);
      console.log(`New Discord message from ${messageData.author.username}: ${messageData.content}`);

      // Check if should auto-reply
      if (await this.shouldAutoReply(message.content, message.guild?.id)) {
        await message.channel.sendTyping();
        
        const aiResponse = await this.generateResponse(message.content, message.guild?.id);
        
        if (aiResponse && aiResponse.content) {
          // Add natural delay
          const settings = await this.getSettings(message.guild?.id);
          await new Promise(resolve => setTimeout(resolve, settings.responseDelay || 1000));
          
          await message.reply(aiResponse.content);
          
          // Update database
          await DiscordMessage.findOneAndUpdate(
            { messageId: message.id },
            { 
              replied: true, 
              botReply: aiResponse.content, 
              aiGenerated: true,
              ragUsed: aiResponse.ragUsed,
              usage: aiResponse.usage,
              searchResults: aiResponse.searchResults
            }
          );
          
          console.log(`Discord bot replied to ${messageData.author.username} (RAG: ${aiResponse.ragUsed})`);
        }
      }
    } catch (error) {
      console.error('Error handling Discord message:', error);
    }
  }

  async shouldAutoReply(content, guildId = null) {
    try {
      const settings = await this.getSettings(guildId);
      
      if (!settings.enabled || !settings.autoReply) {
        return false;
      }
      
      const lowerContent = content.toLowerCase();
      const triggerWords = settings.triggerWords || [];
      
      // Check for trigger words
      const hasKeyword = triggerWords.some(word => lowerContent.includes(word.toLowerCase()));
      
      // Check for question patterns
      const isQuestion = lowerContent.includes('?') || 
                        lowerContent.startsWith('how ') ||
                        lowerContent.startsWith('what ') ||
                        lowerContent.startsWith('when ') ||
                        lowerContent.startsWith('where ') ||
                        lowerContent.startsWith('why ') ||
                        lowerContent.startsWith('who ') ||
                        lowerContent.startsWith('can you ') ||
                        lowerContent.includes('explain') ||
                        lowerContent.includes('tell me');
      
      return hasKeyword || isQuestion;
    } catch (error) {
      console.error('Error checking auto-reply trigger:', error);
      return false;
    }
  }

  async generateResponse(message, guildId = null) {
    try {
      const settings = await this.getSettings(guildId);
      
      // Use your existing RAG chat endpoint
      const response = await axios.post('http://localhost:5000/api/openai/rag-chat', {
        message,
        useRAG: settings.useRAG,
        topK: 5,
        temperature: 0.7,
        maxTokens: 1000
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data && response.data.content) {
        return {
          content: response.data.content,
          usage: response.data.usage,
          searchResults: response.data.searchResults || [],
          ragUsed: settings.useRAG && (response.data.searchResults?.length > 0)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error generating Discord response:', error.response?.data || error.message);
      
      // Fallback response
      return {
        content: "I'm having trouble processing your request right now. Please try again later.",
        usage: null,
        searchResults: [],
        ragUsed: false
      };
    }
  }

  async getSettings(guildId = null) {
    try {
      const settings = await DiscordSettings.findOne({ 
        $or: [{ guildId }, { isDefault: true }] 
      }).sort({ guildId: -1 }); // Prefer guild-specific settings
      
      return settings || { autoReply: false, useRAG: true, enabled: false };
    } catch (error) {
      console.error('Error fetching Discord settings:', error);
      return { autoReply: false, useRAG: true, enabled: false };
    }
  }

  async login(token) {
    try {
      await this.client.login(token);
      return true;
    } catch (error) {
      console.error('Discord bot login error:', error);
      return false;
    }
  }

  async sendMessage(channelId, content) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      await channel.send(content);
      return true;
    } catch (error) {
      console.error('Error sending Discord message:', error);
      return false;
    }
  }

  async replyToMessage(messageId, channelId, content) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      const message = await channel.messages.fetch(messageId);
      await message.reply(content);
      return true;
    } catch (error) {
      console.error('Error replying to Discord message:', error);
      return false;
    }
  }

  getBotInfo() {
    if (!this.isConnected || !this.client.user) {
      return null;
    }
    
    const guilds = this.client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      icon: guild.iconURL()
    }));
    
    return {
      bot: {
        id: this.client.user.id,
        username: this.client.user.username,
        avatar: this.client.user.displayAvatarURL(),
        status: 'online'
      },
      guilds,
      totalGuilds: guilds.length,
      isConnected: this.isConnected
    };
  }
}

module.exports = new DiscordBotService();