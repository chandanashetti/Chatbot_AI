const express = require('express');
const router = express.Router();
const Bot = require('../models/Bot');
const BotConversation = require('../models/BotConversation');
const { v4: uuidv4 } = require('uuid');

// Middleware for bot ownership verification
const verifyBotOwnership = async (req, res, next) => {
  try {
    const bot = await Bot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    // Check if user owns the bot or is in the team
    if (bot.createdBy.toString() !== req.user?.id && !bot.team.includes(req.user?.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    req.bot = bot;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// GET /api/bots - List all bots for the user
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user?.id || '1'; // Fallback for development
    
    // Build query
    const query = {
      $or: [
        { createdBy: userId },
        { team: userId }
      ]
    };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    // Execute query with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'createdBy', select: 'name email' },
        { path: 'team', select: 'name email' }
      ]
    };
    
    const bots = await Bot.find(query)
      .populate(options.populate)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);
    
    const total = await Bot.countDocuments(query);
    
    // Format response
    const formattedBots = bots.map(bot => ({
      id: bot._id,
      name: bot.name,
      description: bot.description,
      type: bot.type,
      status: bot.status,
      isPublished: bot.isPublished,
      publishedAt: bot.publishedAt,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
      createdBy: bot.createdBy,
      team: bot.team,
      analytics: {
        totalConversations: bot.analytics.totalConversations,
        activeConversations: bot.analytics.activeConversations,
        completionRate: bot.analytics.completionRate,
        averageRating: bot.analytics.averageRating,
        lastActivity: bot.analytics.lastActivity
      },
      deployment: {
        isDeployed: bot.deployment.isDeployed,
        widgetId: bot.deployment.widgetId
      }
    }));
    
    res.json({
      bots: formattedBots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({ error: 'Failed to get bots', details: error.message });
  }
});

// GET /api/bots/:id - Get specific bot
router.get('/:id', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    
    await bot.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'team', select: 'name email' }
    ]);
    
    const formattedBot = {
      id: bot._id,
      name: bot.name,
      description: bot.description,
      type: bot.type,
      status: bot.status,
      flow: bot.flow,
      settings: bot.settings,
      analytics: bot.analytics,
      templateId: bot.templateId,
      isPublished: bot.isPublished,
      publishedAt: bot.publishedAt,
      version: bot.version,
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
      createdBy: bot.createdBy,
      team: bot.team,
      deployment: bot.deployment,
      limits: bot.limits
    };
    
    res.json(formattedBot);
    
  } catch (error) {
    console.error('Get bot error:', error);
    res.status(500).json({ error: 'Failed to get bot', details: error.message });
  }
});

// POST /api/bots - Create new bot
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      type = 'custom',
      flow,
      settings = {},
      templateId
    } = req.body;
    
    if (!name || !flow) {
      return res.status(400).json({ error: 'Name and flow are required' });
    }
    
    const userId = req.user?.id || '1'; // Fallback for development
    
    // Create new bot
    const bot = new Bot({
      name: name.trim(),
      description: description?.trim(),
      type,
      flow: {
        id: flow.id || uuidv4(),
        name: flow.name || 'Main Flow',
        description: flow.description || 'Primary conversation flow',
        nodes: flow.nodes || [],
        connections: flow.connections || [],
        version: '1.0.0',
        isActive: true
      },
      settings: {
        ...settings,
        appearance: {
          ...settings.appearance,
          name: settings.appearance?.name || name
        }
      },
      createdBy: userId,
      templateId
    });
    
    await bot.save();
    
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
    const bot = req.bot;
    const {
      name,
      description,
      type,
      flow,
      settings,
      status
    } = req.body;
    
    // Create backup before updating
    if (flow && JSON.stringify(flow) !== JSON.stringify(bot.flow)) {
      bot.createBackup();
    }
    
    // Update fields
    if (name) bot.name = name.trim();
    if (description !== undefined) bot.description = description?.trim();
    if (type) bot.type = type;
    if (flow) {
      bot.flow = {
        ...bot.flow.toObject(),
        ...flow,
        version: bot.flow.version // Preserve version unless explicitly changed
      };
    }
    if (settings) {
      bot.settings = {
        ...bot.settings.toObject(),
        ...settings
      };
    }
    if (status) bot.status = status;
    
    await bot.save();
    
    res.json({
      success: true,
      message: 'Bot updated successfully',
      bot: {
        id: bot._id,
        name: bot.name,
        description: bot.description,
        type: bot.type,
        status: bot.status,
        flow: bot.flow,
        settings: bot.settings,
        updatedAt: bot.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update bot error:', error);
    res.status(500).json({ error: 'Failed to update bot', details: error.message });
  }
});

// DELETE /api/bots/:id - Delete bot
router.delete('/:id', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    
    // Delete related conversations
    await BotConversation.deleteMany({ botId: bot._id });
    
    // Delete the bot
    await Bot.findByIdAndDelete(bot._id);
    
    res.json({
      success: true,
      message: 'Bot deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({ error: 'Failed to delete bot', details: error.message });
  }
});

// POST /api/bots/:id/duplicate - Duplicate bot
router.post('/:id/duplicate', verifyBotOwnership, async (req, res) => {
  try {
    const originalBot = req.bot;
    const { name } = req.body;
    
    const duplicatedBot = new Bot({
      name: name || `${originalBot.name} (Copy)`,
      description: originalBot.description,
      type: originalBot.type,
      flow: {
        ...originalBot.flow.toObject(),
        id: uuidv4() // New flow ID
      },
      settings: originalBot.settings.toObject(),
      createdBy: req.user?.id || '1',
      status: 'draft',
      isPublished: false
    });
    
    await duplicatedBot.save();
    
    res.status(201).json({
      success: true,
      message: 'Bot duplicated successfully',
      bot: {
        id: duplicatedBot._id,
        name: duplicatedBot.name,
        description: duplicatedBot.description,
        type: duplicatedBot.type,
        status: duplicatedBot.status,
        createdAt: duplicatedBot.createdAt
      }
    });
    
  } catch (error) {
    console.error('Duplicate bot error:', error);
    res.status(500).json({ error: 'Failed to duplicate bot', details: error.message });
  }
});

// PATCH /api/bots/:id/publish - Publish bot
router.patch('/:id/publish', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    
    // Validate that bot has required elements for publishing
    if (!bot.flow.nodes || bot.flow.nodes.length === 0) {
      return res.status(400).json({ error: 'Bot must have at least one node to be published' });
    }
    
    // Check for start node
    const hasStartNode = bot.flow.nodes.some(node => node.type === 'message' || node.id === 'start');
    if (!hasStartNode) {
      return res.status(400).json({ error: 'Bot must have a start node to be published' });
    }
    
    bot.isPublished = true;
    bot.publishedAt = new Date();
    bot.status = 'active';
    
    // Generate embed code if not exists
    if (!bot.deployment.embedCode) {
      bot.generateEmbedCode();
    }
    
    await bot.save();
    
    res.json({
      success: true,
      message: 'Bot published successfully',
      bot: {
        id: bot._id,
        isPublished: bot.isPublished,
        publishedAt: bot.publishedAt,
        status: bot.status,
        deployment: bot.deployment
      }
    });
    
  } catch (error) {
    console.error('Publish bot error:', error);
    res.status(500).json({ error: 'Failed to publish bot', details: error.message });
  }
});

// PATCH /api/bots/:id/unpublish - Unpublish bot
router.patch('/:id/unpublish', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    
    bot.isPublished = false;
    bot.status = 'inactive';
    bot.deployment.isDeployed = false;
    
    await bot.save();
    
    res.json({
      success: true,
      message: 'Bot unpublished successfully',
      bot: {
        id: bot._id,
        isPublished: bot.isPublished,
        status: bot.status
      }
    });
    
  } catch (error) {
    console.error('Unpublish bot error:', error);
    res.status(500).json({ error: 'Failed to unpublish bot', details: error.message });
  }
});

// PUT /api/bots/:id/flow - Update bot flow
router.put('/:id/flow', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const { flow } = req.body;
    
    if (!flow) {
      return res.status(400).json({ error: 'Flow data is required' });
    }
    
    // Create backup before updating flow
    bot.createBackup();
    
    bot.flow = {
      ...bot.flow.toObject(),
      ...flow,
      id: bot.flow.id // Preserve original flow ID
    };
    
    await bot.save();
    
    res.json({
      success: true,
      message: 'Bot flow updated successfully',
      flow: bot.flow
    });
    
  } catch (error) {
    console.error('Update flow error:', error);
    res.status(500).json({ error: 'Failed to update flow', details: error.message });
  }
});

// PUT /api/bots/:id/settings - Update bot settings
router.put('/:id/settings', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ error: 'Settings data is required' });
    }
    
    bot.settings = {
      ...bot.settings.toObject(),
      ...settings
    };
    
    await bot.save();
    
    res.json({
      success: true,
      message: 'Bot settings updated successfully',
      settings: bot.settings
    });
    
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
});

// POST /api/bots/:id/test - Test bot with a message
router.post('/:id/test', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required for testing' });
    }
    
    // Import bot runtime for testing
    const BotRuntime = require('../services/botRuntime');
    const runtime = new BotRuntime(bot);
    
    const testSessionId = sessionId || `test-${Date.now()}`;
    const response = await runtime.processMessage(message, testSessionId, { isTest: true });
    
    res.json({
      success: true,
      response,
      sessionId: testSessionId
    });
    
  } catch (error) {
    console.error('Test bot error:', error);
    res.status(500).json({ error: 'Failed to test bot', details: error.message });
  }
});

// GET /api/bots/:id/analytics - Get bot analytics
router.get('/:id/analytics', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const {
      startDate,
      endDate,
      granularity = 'day'
    } = req.query;
    
    let analytics = bot.analytics.toObject();
    
    // Filter daily stats if date range provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      analytics.dailyStats = analytics.dailyStats.filter(stat => {
        const statDate = new Date(stat.date);
        return statDate >= start && statDate <= end;
      });
    }
    
    // Calculate additional metrics
    analytics.conversionRate = analytics.totalConversations > 0 
      ? (analytics.completedConversations / analytics.totalConversations) * 100 
      : 0;
    
    analytics.averageMessagesPerSession = analytics.totalConversations > 0
      ? analytics.totalMessages / analytics.totalConversations
      : 0;
    
    res.json({
      success: true,
      analytics
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics', details: error.message });
  }
});

// GET /api/bots/:id/conversations - Get bot conversations
router.get('/:id/conversations', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    } = req.query;
    
    const query = { botId: bot._id };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const conversations = await BotConversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('userId', 'name email');
    
    const total = await BotConversation.countDocuments(query);
    
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
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations', details: error.message });
  }
});

// GET /api/bots/:id/export - Export bot configuration
router.get('/:id/export', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    
    const exportData = {
      name: bot.name,
      description: bot.description,
      type: bot.type,
      flow: bot.flow,
      settings: bot.settings,
      version: bot.version,
      exportedAt: new Date(),
      exportedBy: req.user?.id || '1'
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${bot.name}-export.json"`);
    res.json(exportData);
    
  } catch (error) {
    console.error('Export bot error:', error);
    res.status(500).json({ error: 'Failed to export bot', details: error.message });
  }
});

// POST /api/bots/import - Import bot configuration
router.post('/import', async (req, res) => {
  try {
    const { botData, name } = req.body;
    
    if (!botData) {
      return res.status(400).json({ error: 'Bot data is required' });
    }
    
    const userId = req.user?.id || '1';
    
    const bot = new Bot({
      name: name || `${botData.name} (Imported)`,
      description: botData.description,
      type: botData.type || 'custom',
      flow: {
        ...botData.flow,
        id: uuidv4() // Generate new flow ID
      },
      settings: botData.settings || {},
      createdBy: userId,
      status: 'draft',
      isPublished: false
    });
    
    await bot.save();
    
    res.status(201).json({
      success: true,
      message: 'Bot imported successfully',
      bot: {
        id: bot._id,
        name: bot.name,
        description: bot.description,
        type: bot.type,
        status: bot.status,
        createdAt: bot.createdAt
      }
    });
    
  } catch (error) {
    console.error('Import bot error:', error);
    res.status(500).json({ error: 'Failed to import bot', details: error.message });
  }
});

module.exports = router;
