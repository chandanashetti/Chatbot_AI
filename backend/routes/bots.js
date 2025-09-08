const express = require('express');
const router = express.Router();
const Bot = require('../models/Bot');
const BotConversation = require('../models/BotConversation');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { getOrCreateDefaultUser } = require('../utils/userHelper');

// Middleware for bot ownership verification
const verifyBotOwnership = async (req, res, next) => {
  try {
    const bot = await Bot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    // Ensure we have a valid user ID
    let userId = req.user?.id;
    if (!userId) {
      const defaultUser = await getOrCreateDefaultUser();
      userId = defaultUser._id;
      req.user = { id: userId, role: defaultUser.role };
    }
    
    // For development: Allow access to all bots regardless of ownership
    // Check if user owns the bot or is in the team, or allow all for development
    const isOwner = bot.createdBy.toString() === userId.toString();
    const isInTeam = bot.team?.includes(userId);
    const isDevelopmentMode = true; // Set to false in production
    
    if (!isOwner && !isInTeam && !isDevelopmentMode) {
      console.log(`❌ Access denied for user ${userId} to bot ${bot._id} (owner: ${bot.createdBy})`);
      return res.status(403).json({ error: 'Access denied' });
    }
    
    console.log(`✅ Access granted for user ${userId} to bot ${bot._id} (development mode: ${isDevelopmentMode})`);
    req.bot = bot;
    next();
  } catch (error) {
    console.error('Bot ownership verification error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// GET /api/bots - Get all bots for user
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching bots...');
    
    // Ensure we have a valid user ID
    let userId = req.user?.id;
    if (!userId) {
      const defaultUser = await getOrCreateDefaultUser();
      userId = defaultUser._id;
    }

    console.log('👤 Current user ID:', userId);

    // For development: Show all bots if no bots found for current user
    let bots = await Bot.find({ createdBy: userId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // If no bots found for current user, show all bots (development mode)
    if (bots.length === 0) {
      console.log('⚠️ No bots found for current user, showing all bots (development mode)');
      bots = await Bot.find({})
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    console.log(`✅ Found ${bots.length} bots`);

    res.json({
      success: true,
      bots
    });
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({ error: 'Failed to get bots', details: error.message });
  }
});

// GET /api/bots/debug - Debug endpoint to check bots (must be before /:id route)
router.get('/debug', async (req, res) => {
  try {
    const allBots = await Bot.find({});
    console.log('🔍 Debug: All bots in database:', allBots.map(b => ({
      id: b._id,
      name: b.name,
      status: b.status,
      isPublished: b.isPublished
    })));
    
    res.json({
      success: true,
      totalBots: allBots.length,
      bots: allBots.map(b => ({
        id: b._id,
        name: b.name,
        status: b.status,
        isPublished: b.isPublished,
        createdBy: b.createdBy
      }))
    });
  } catch (error) {
    console.error('Debug bots error:', error);
    res.status(500).json({ error: 'Failed to debug bots', details: error.message });
  }
});

// GET /api/bots/:id - Get specific bot
router.get('/:id', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    await bot.populate('createdBy', 'name email');

    res.json({
      success: true,
      bot
    });
  } catch (error) {
    console.error('Get bot error:', error);
    res.status(500).json({ error: 'Failed to get bot', details: error.message });
  }
});

// POST /api/bots - Create new bot
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new bot with data:', req.body);

    const { name, type = 'custom', description = '' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Bot name is required' });
    }

    // Log database connection status
    console.log('📊 Database connection status:', database.isConnected ? 'Connected' : 'Disconnected');

    // Ensure database is connected
    if (!database.isConnected) {
      console.log('⚠️ Database not connected, attempting to reconnect...');
      try {
        await database.connect();
        console.log('✅ Database reconnected successfully');
      } catch (reconnectError) {
        console.error('❌ Database reconnection failed:', reconnectError);
        return res.status(500).json({
          error: 'Database connection failed',
          details: 'Could not establish database connection. Please try again.'
        });
      }
    }

    // Ensure we have a valid user ID
    let createdBy = req.user?.id;
    if (!createdBy) {
      const defaultUser = await getOrCreateDefaultUser();
      createdBy = defaultUser._id;
    }

    // Create the bot with proper schema validation
    const bot = new Bot({
      name,
      type,
      description,
      createdBy: createdBy,
      status: 'draft',
      flow: {
        id: uuidv4(),
        name: 'Main Flow',
        nodes: [],
        connections: []
      },
      settings: {
        personality: {
          tone: 'friendly',
          style: 'conversational',
          language: 'en'
        },
        behavior: {
          responseDelay: 1000,
          typingIndicator: true,
          fallbackMessage: "I didn't understand that. Can you rephrase?"
        },
        appearance: {
          name: name,
          welcomeMessage: 'Hello! How can I help you today?',
          theme: {
            primaryColor: '#3B82F6',
            secondaryColor: '#EFF6FF',
            backgroundColor: '#FFFFFF',
            textColor: '#374151'
          }
        }
      },
      deployment: {
        widgetId: require('crypto').randomBytes(16).toString('hex'),
        apiKey: require('crypto').randomBytes(32).toString('hex')
      }
    });

    await bot.save();
    console.log('✅ Bot saved to database successfully:', bot._id);

    await bot.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'templateId', select: 'name description' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Bot created successfully',
      bot: {
        id: bot._id,
        name: bot.name,
        description: bot.description,
        type: bot.type,
        status: bot.status,
        flow: bot.flow,
        settings: bot.settings,
        isPublished: bot.isPublished,
        createdAt: bot.createdAt,
        updatedAt: bot.updatedAt,
        createdBy: bot.createdBy
      }
    });

  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ error: 'Failed to create bot', details: error.message });
  }
});

// PUT /api/bots/:id - Update bot
router.put('/:id', verifyBotOwnership, async (req, res) => {
  try {
    const { name, description, flow, settings, status } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (flow !== undefined) updateData.flow = flow;
    if (settings !== undefined) updateData.settings = settings;
    if (status !== undefined) updateData.status = status;
    
    updateData.updatedAt = new Date();

    const bot = await Bot.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    console.log(`✅ Bot ${bot.name} updated successfully`);

    res.json({
      success: true,
      message: 'Bot updated successfully',
      bot
    });
  } catch (error) {
    console.error('Update bot error:', error);
    res.status(500).json({ error: 'Failed to update bot', details: error.message });
  }
});

// PUT /api/bots/:id/settings - Update bot settings only
router.put('/:id/settings', verifyBotOwnership, async (req, res) => {
  try {
    const settings = req.body;
    
    const bot = await Bot.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          settings: settings,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    console.log(`✅ Bot ${bot.name} settings updated successfully`);

    res.json({
      success: true,
      message: 'Bot settings updated successfully',
      bot,
      settings: bot.settings
    });
  } catch (error) {
    console.error('Update bot settings error:', error);
    res.status(500).json({ error: 'Failed to update bot settings', details: error.message });
  }
});

// PUT /api/bots/:id/flow - Update bot flow only
router.put('/:id/flow', verifyBotOwnership, async (req, res) => {
  try {
    const flow = req.body;
    
    const bot = await Bot.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          flow: flow,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    console.log(`✅ Bot ${bot.name} flow updated successfully`);

    res.json({
      success: true,
      message: 'Bot flow updated successfully',
      bot,
      flow: bot.flow
    });
  } catch (error) {
    console.error('Update bot flow error:', error);
    res.status(500).json({ error: 'Failed to update bot flow', details: error.message });
  }
});

// DELETE /api/bots/:id - Delete bot
router.delete('/:id', verifyBotOwnership, async (req, res) => {
  try {
    await Bot.findByIdAndDelete(req.params.id);
    
    // Also delete related conversations
    await BotConversation.deleteMany({ botId: req.params.id });

    res.json({
      success: true,
      message: 'Bot deleted successfully'
    });
  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({ error: 'Failed to delete bot', details: error.message });
  }
});

// POST /api/bots/:id/publish - Publish bot
router.post('/:id/publish', verifyBotOwnership, async (req, res) => {
  try {
    const bot = await Bot.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: 'active',
          isPublished: true,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    console.log(`✅ Bot ${bot.name} published successfully`);

    res.json({
      success: true,
      message: 'Bot published successfully',
      bot
    });
  } catch (error) {
    console.error('Publish bot error:', error);
    res.status(500).json({ error: 'Failed to publish bot', details: error.message });
  }
});

// POST /api/bots/:id/unpublish - Unpublish bot
router.post('/:id/unpublish', verifyBotOwnership, async (req, res) => {
  try {
    const bot = await Bot.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: 'inactive',
          isPublished: false,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    console.log(`✅ Bot ${bot.name} unpublished successfully`);

    res.json({
      success: true,
      message: 'Bot unpublished successfully',
      bot
    });
  } catch (error) {
    console.error('Unpublish bot error:', error);
    res.status(500).json({ error: 'Failed to unpublish bot', details: error.message });
  }
});

// GET /api/bots/:id/conversations - Get bot conversations
router.get('/:id/conversations', verifyBotOwnership, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await BotConversation.find({ botId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await BotConversation.countDocuments({ botId: req.params.id });

    res.json({
      success: true,
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get bot conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations', details: error.message });
  }
});

// GET /api/bots/:id/analytics - Get bot analytics
router.get('/:id/analytics', verifyBotOwnership, async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'day' } = req.query;
    const bot = req.bot;
    
    // Build date filter
    const dateFilter = { botId: req.params.id };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get conversation statistics
    const totalConversations = await BotConversation.countDocuments({ botId: req.params.id });
    const activeConversations = await BotConversation.countDocuments({ 
      botId: req.params.id, 
      status: 'active' 
    });
    
    // Get conversations in date range for analytics
    const conversations = await BotConversation.find(dateFilter);
    
    // Calculate completion rate
    const completedConversations = conversations.filter(conv => conv.status === 'completed').length;
    const completionRate = totalConversations > 0 ? (completedConversations / totalConversations) * 100 : 0;
    
    // Calculate average rating (if ratings exist)
    const ratedConversations = conversations.filter(conv => conv.rating && conv.rating > 0);
    const averageRating = ratedConversations.length > 0 
      ? ratedConversations.reduce((sum, conv) => sum + conv.rating, 0) / ratedConversations.length 
      : 0;

    // Get last activity
    const lastActivity = totalConversations > 0 
      ? (await BotConversation.findOne({ botId: req.params.id }).sort({ updatedAt: -1 }))?.updatedAt 
      : bot.updatedAt;

    // Generate time series data based on granularity
    const timeSeriesData = [];
    if (conversations.length > 0) {
      const grouped = conversations.reduce((acc, conv) => {
        let dateKey;
        const date = new Date(conv.createdAt);
        
        switch (granularity) {
          case 'hour':
            dateKey = date.toISOString().substring(0, 13) + ':00:00.000Z';
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            dateKey = weekStart.toISOString().substring(0, 10) + 'T00:00:00.000Z';
            break;
          case 'month':
            dateKey = date.toISOString().substring(0, 7) + '-01T00:00:00.000Z';
            break;
          default: // day
            dateKey = date.toISOString().substring(0, 10) + 'T00:00:00.000Z';
        }
        
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, conversations: 0, completed: 0 };
        }
        acc[dateKey].conversations++;
        if (conv.status === 'completed') acc[dateKey].completed++;
        
        return acc;
      }, {});
      
      timeSeriesData.push(...Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date)));
    }

    const analytics = {
      totalConversations,
      activeConversations,
      completionRate: Math.round(completionRate * 100) / 100,
      averageRating: Math.round(averageRating * 100) / 100,
      lastActivity,
      timeSeriesData,
      summary: {
        totalMessages: conversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0),
        uniqueUsers: new Set(conversations.map(conv => conv.userId).filter(Boolean)).size,
        averageSessionLength: conversations.length > 0 
          ? conversations.reduce((sum, conv) => {
              const duration = conv.endedAt ? 
                (new Date(conv.endedAt) - new Date(conv.createdAt)) / 1000 / 60 : 0;
              return sum + duration;
            }, 0) / conversations.length 
          : 0
      }
    };

    console.log(`📊 Analytics generated for bot ${bot.name}: ${totalConversations} total conversations`);

    res.json({
      success: true,
      analytics,
      bot: {
        id: bot._id,
        name: bot.name,
        status: bot.status,
        isPublished: bot.isPublished
      }
    });
  } catch (error) {
    console.error('Get bot analytics error:', error);
    res.status(500).json({ error: 'Failed to get bot analytics', details: error.message });
  }
});

module.exports = router;
