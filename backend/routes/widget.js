const express = require('express');
const router = express.Router();
const Bot = require('../models/Bot');
const BotRuntime = require('../services/botRuntime');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Helper function to validate widget ID format
const isValidWidgetId = (widgetId) => {
  // Accept both numeric IDs and hex strings
  return /^\d+$/.test(widgetId) || /^[a-f0-9]{32}$/.test(widgetId);
};

// Rate limiting middleware
const rateLimit = require('express-rate-limit');

const widgetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to verify widget access
const verifyWidgetAccess = async (req, res, next) => {
  try {
    const { widgetId } = req.params;
    const origin = req.get('Origin') || req.get('Referer');
    
    // Validate widget ID format
    if (!isValidWidgetId(widgetId)) {
      return res.status(400).json({ error: 'Invalid widget ID format' });
    }
    
    // Try to find the bot by widget ID or by ID
    const bot = await Bot.findOne({
      $or: [
        { 'deployment.widgetId': widgetId },
        { _id: widgetId }
      ]
    });
    
    if (!bot) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Check if bot is published and active
    if (!bot.isPublished || bot.status !== 'active') {
      return res.status(403).json({ error: 'Widget is not available' });
    }

    // Check domain restrictions
    if (bot.deployment.domains && bot.deployment.domains.length > 0 && origin) {
      const allowedDomains = bot.deployment.domains;
      const requestDomain = new URL(origin).hostname;
      
      const isAllowed = allowedDomains.some(domain => {
        if (domain.startsWith('*.')) {
          // Wildcard subdomain matching
          const baseDomain = domain.slice(2);
          return requestDomain.endsWith(baseDomain);
        }
        return requestDomain === domain;
      });

      if (!isAllowed) {
        return res.status(403).json({ error: 'Widget not authorized for this domain' });
      }
    }

    req.bot = bot;
    next();
  } catch (error) {
    console.error('Widget access verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/widget/:widgetId/config - Get widget configuration
router.get('/:widgetId/config', verifyWidgetAccess, async (req, res) => {
  try {
    const bot = req.bot;
    
    const config = {
      widgetId: bot.deployment.widgetId,
      appearance: {
        name: bot.settings.appearance.name || bot.name,
        welcomeMessage: bot.settings.appearance.welcomeMessage,
        description: bot.settings.appearance.description,
        avatar: bot.settings.appearance.avatar,
        theme: bot.settings.appearance.theme,
        typography: bot.settings.appearance.typography,
        position: bot.settings.appearance.position,
        messageStyle: bot.settings.appearance.messageStyle,
        background: bot.settings.appearance.background
      },
      behavior: {
        typingIndicator: bot.settings.behavior.typingIndicator,
        responseDelay: bot.settings.behavior.responseDelay
      },
      branding: {
        showPoweredBy: true,
        customCSS: bot.deployment.customCSS
      }
    };

    res.json(config);
  } catch (error) {
    console.error('Get widget config error:', error);
    res.status(500).json({ error: 'Failed to get widget configuration' });
  }
});

// POST /api/widget/:widgetId/message - Send message to bot
router.post('/:widgetId/message', widgetLimiter, verifyWidgetAccess, async (req, res) => {
  try {
    const bot = req.bot;
    const { message, sessionId, userInfo = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Enrich user info with request data
    const enrichedUserInfo = {
      ...userInfo,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      timestamp: new Date()
    };

    // Process message through bot runtime
    const runtime = new BotRuntime(bot);
    const response = await runtime.processMessage(message, sessionId, enrichedUserInfo);

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('Widget message error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      response: {
        id: uuidv4(),
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.',
        type: 'text'
      }
    });
  }
});

// POST /api/widget/:widgetId/session - Create new session
router.post('/:widgetId/session', verifyWidgetAccess, async (req, res) => {
  try {
    const sessionId = uuidv4();
    const { userInfo = {} } = req.body;

    // Enrich user info
    const enrichedUserInfo = {
      ...userInfo,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      timestamp: new Date()
    };

    res.json({
      success: true,
      sessionId,
      userInfo: enrichedUserInfo
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// POST /api/widget/:widgetId/reaction - Add reaction to message
router.post('/:widgetId/reaction', verifyWidgetAccess, async (req, res) => {
  try {
    const { messageId, reaction, sessionId } = req.body;

    if (!messageId || !sessionId) {
      return res.status(400).json({ error: 'Message ID and session ID are required' });
    }

    // Find conversation and add reaction
    const BotConversation = require('../models/BotConversation');
    const conversation = await BotConversation.findBySessionId(sessionId);
    
    if (conversation) {
      conversation.addReaction(messageId, reaction, sessionId);
      await conversation.save();
    }

    res.json({
      success: true,
      messageId,
      reaction,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Widget reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// POST /api/widget/:widgetId/feedback - Submit feedback
router.post('/:widgetId/feedback', verifyWidgetAccess, async (req, res) => {
  try {
    const { sessionId, rating, feedback, email } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Find conversation and update feedback
    const BotConversation = require('../models/BotConversation');
    const conversation = await BotConversation.findBySessionId(sessionId);
    
    if (conversation) {
      conversation.metrics.satisfactionScore = rating;
      if (feedback) {
        conversation.addMessage({
          content: `User feedback: ${feedback}`,
          sender: 'system',
          type: 'feedback',
          metadata: { rating, email }
        });
      }
      await conversation.save();

      // Update bot analytics
      const runtime = new BotRuntime(req.bot);
      await runtime.updateBotAnalytics(conversation, { rating });
    }

    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });

  } catch (error) {
    console.error('Widget feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// GET /api/widget/:widgetId/conversation/:sessionId - Get conversation history
router.get('/:widgetId/conversation/:sessionId', verifyWidgetAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const BotConversation = require('../models/BotConversation');
    const conversation = await BotConversation.findBySessionId(sessionId);

    if (!conversation) {
      return res.json({
        success: true,
        messages: [],
        sessionId
      });
    }

    // Return last N messages
    const messages = conversation.messages
      .slice(-parseInt(limit))
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        type: msg.type,
        createdAt: msg.createdAt,
        metadata: {
          nodeId: msg.nodeId,
          options: msg.metadata?.options
        }
      }));

    res.json({
      success: true,
      messages,
      sessionId,
      conversationId: conversation.conversationId
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// POST /api/widget/:widgetId/handoff - Request human handoff
router.post('/:widgetId/handoff', verifyWidgetAccess, async (req, res) => {
  try {
    const { sessionId, reason = 'User requested human assistance' } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const BotConversation = require('../models/BotConversation');
    const conversation = await BotConversation.findBySessionId(sessionId);

    if (conversation) {
      conversation.requestHandoff(reason);
      conversation.addMessage({
        content: 'Your request has been forwarded to our support team. Someone will be with you shortly.',
        sender: 'system',
        type: 'handoff'
      });
      await conversation.save();
    }

    res.json({
      success: true,
      message: 'Handoff request submitted successfully'
    });

  } catch (error) {
    console.error('Widget handoff error:', error);
    res.status(500).json({ error: 'Failed to request handoff' });
  }
});

// Health check for widget
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'widget-api'
  });
});

module.exports = router;
