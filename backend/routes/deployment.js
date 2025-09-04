const express = require('express');
const router = express.Router();
const Bot = require('../models/Bot');
const { v4: uuidv4 } = require('uuid');
const { getOrCreateDefaultUser } = require('../utils/userHelper');

// Middleware for bot ownership verification
const verifyBotOwnership = async (req, res, next) => {
  try {
    const bot = await Bot.findById(req.params.botId);
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
    
    // Check if user owns the bot or is in the team
    if (bot.createdBy.toString() !== userId.toString() && !bot.team?.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    req.bot = bot;
    next();
  } catch (error) {
    console.error('Bot ownership verification error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// POST /api/deployment/:botId/deploy - Deploy bot
router.post('/:botId/deploy', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const { platforms = ['website'], domains = [], customCSS = '' } = req.body;

    // Validate bot is ready for deployment
    if (!bot.isPublished) {
      return res.status(400).json({ error: 'Bot must be published before deployment' });
    }

    if (!bot.flow.nodes || bot.flow.nodes.length === 0) {
      return res.status(400).json({ error: 'Bot must have at least one node' });
    }

    // Generate widget ID and API key if not exists
    if (!bot.deployment.widgetId) {
      bot.deployment.widgetId = require('crypto').randomBytes(16).toString('hex');
    }
    
    // Store legacy ID if provided or generate a timestamp-based one
    if (!bot.deployment.legacyId) {
      bot.deployment.legacyId = Date.now().toString();
    }
    
    if (!bot.deployment.apiKey) {
      bot.deployment.apiKey = require('crypto').randomBytes(32).toString('hex');
    }

    // Update deployment settings
    bot.deployment.isDeployed = true;
    bot.deployment.deployedAt = new Date();
    bot.deployment.domains = domains;
    bot.deployment.customCSS = customCSS;

    // Generate embed code
    const embedCode = bot.generateEmbedCode();

    await bot.save();

    res.json({
      success: true,
      message: 'Bot deployed successfully',
      deployment: {
        widgetId: bot.deployment.widgetId,
        isDeployed: bot.deployment.isDeployed,
        deployedAt: bot.deployment.deployedAt,
        domains: bot.deployment.domains,
        embedCode,
        apiUrl: process.env.API_URL || 'http://localhost:5000',
        apiEndpoint: `${process.env.API_URL || 'http://localhost:5000'}/api/widget/${bot.deployment.widgetId}`
      }
    });

  } catch (error) {
    console.error('Deploy bot error:', error);
    res.status(500).json({ error: 'Failed to deploy bot', details: error.message });
  }
});

// POST /api/deployment/:botId/undeploy - Undeploy bot
router.post('/:botId/undeploy', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;

    bot.deployment.isDeployed = false;
    bot.deployment.deployedAt = null;

    await bot.save();

    res.json({
      success: true,
      message: 'Bot undeployed successfully',
      deployment: {
        isDeployed: bot.deployment.isDeployed
      }
    });

  } catch (error) {
    console.error('Undeploy bot error:', error);
    res.status(500).json({ error: 'Failed to undeploy bot', details: error.message });
  }
});

// GET /api/deployment/:botId/embed-code - Get embed code
router.get('/:botId/embed-code', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const { type = 'script', theme = 'default' } = req.query;

    if (!bot.deployment.widgetId) {
      return res.status(400).json({ error: 'Bot is not deployed' });
    }

    let embedCode = '';
    const widgetId = bot.deployment.widgetId;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const apiUrl = process.env.API_URL || 'http://localhost:5000';

    switch (type) {
      case 'script':
        embedCode = `<!-- ChatBot Widget -->
<script>
  (function() {
    var chatbot = document.createElement('script');
    chatbot.type = 'text/javascript';
    chatbot.async = true;
    chatbot.src = '${baseUrl}/widget.js';
    chatbot.setAttribute('data-bot-id', '${widgetId}');
    chatbot.setAttribute('data-api-url', '${apiUrl}');
    chatbot.setAttribute('data-theme', '${theme}');
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(chatbot, s);
  })();
</script>
<!-- End ChatBot Widget -->`;
        break;

      case 'iframe':
        embedCode = `<!-- ChatBot Widget (iFrame) -->
<iframe 
  src="${baseUrl}/widget/${widgetId}" 
  width="400" 
  height="600" 
  frameborder="0"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
</iframe>
<!-- End ChatBot Widget -->`;
        break;

      case 'html':
        embedCode = `<!-- ChatBot Widget (HTML) -->
<div id="chatbot-widget" data-bot-id="${widgetId}" data-api-url="${apiUrl}"></div>
<script src="${baseUrl}/widget.js"></script>
<!-- End ChatBot Widget -->`;
        break;

      case 'react':
        embedCode = `// ChatBot Widget (React Component)
import React, { useEffect } from 'react';

const ChatBotWidget = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.setAttribute('data-bot-id', '${widgetId}');
    script.setAttribute('data-api-url', '${apiUrl}');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
};

export default ChatBotWidget;`;
        break;

      case 'wordpress':
        embedCode = `<!-- Add this to your WordPress theme's functions.php file -->
<?php
function add_chatbot_widget() {
    ?>
    <script>
      (function() {
        var chatbot = document.createElement('script');
        chatbot.type = 'text/javascript';
        chatbot.async = true;
        chatbot.src = '${baseUrl}/widget.js';
        chatbot.setAttribute('data-bot-id', '${widgetId}');
        chatbot.setAttribute('data-api-url', '${apiUrl}');
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(chatbot, s);
      })();
    </script>
    <?php
}
add_action('wp_footer', 'add_chatbot_widget');
?>`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid embed type' });
    }

    res.json({
      success: true,
      embedCode,
      type,
      widgetId,
      instructions: getInstallationInstructions(type)
    });

  } catch (error) {
    console.error('Get embed code error:', error);
    res.status(500).json({ error: 'Failed to generate embed code', details: error.message });
  }
});

// PUT /api/deployment/:botId/settings - Update deployment settings
router.put('/:botId/settings', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const { domains, customCSS, allowedOrigins } = req.body;

    if (domains !== undefined) {
      bot.deployment.domains = domains;
    }

    if (customCSS !== undefined) {
      bot.deployment.customCSS = customCSS;
    }

    if (allowedOrigins !== undefined) {
      bot.deployment.allowedOrigins = allowedOrigins;
    }

    await bot.save();

    res.json({
      success: true,
      message: 'Deployment settings updated successfully',
      deployment: {
        domains: bot.deployment.domains,
        customCSS: bot.deployment.customCSS,
        allowedOrigins: bot.deployment.allowedOrigins
      }
    });

  } catch (error) {
    console.error('Update deployment settings error:', error);
    res.status(500).json({ error: 'Failed to update deployment settings', details: error.message });
  }
});

// GET /api/deployment/:botId/analytics - Get deployment analytics
router.get('/:botId/analytics', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const { startDate, endDate, granularity = 'day' } = req.query;

    if (!bot.deployment.isDeployed) {
      return res.status(400).json({ error: 'Bot is not deployed' });
    }

    // Get conversation analytics
    const BotConversation = require('../models/BotConversation');
    const matchStage = { 
      botId: bot._id,
      isTest: { $ne: true }
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const analytics = await BotConversation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          uniqueUsers: { $addToSet: '$sessionId' },
          totalMessages: { $sum: '$metrics.totalMessages' },
          averageDuration: { $avg: '$metrics.totalDuration' },
          completionRate: {
            $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          handoffRate: {
            $avg: { $cond: ['$metrics.handoffRequested', 1, 0] }
          },
          averageSatisfaction: { $avg: '$metrics.satisfactionScore' },
          leadConversions: {
            $sum: { $cond: ['$leadData.isQualified', 1, 0] }
          }
        }
      }
    ]);

    const result = analytics[0] || {};
    result.uniqueUsers = result.uniqueUsers ? result.uniqueUsers.length : 0;
    result.completionRate = (result.completionRate || 0) * 100;
    result.handoffRate = (result.handoffRate || 0) * 100;

    // Get daily breakdown
    const dailyStats = await BotConversation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdAt" 
            }
          },
          conversations: { $sum: 1 },
          uniqueUsers: { $addToSet: '$sessionId' },
          messages: { $sum: '$metrics.totalMessages' },
          completions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        ...result,
        dailyStats: dailyStats.map(stat => ({
          date: stat._id,
          conversations: stat.conversations,
          uniqueUsers: stat.uniqueUsers.length,
          messages: stat.messages,
          completions: stat.completions
        }))
      }
    });

  } catch (error) {
    console.error('Get deployment analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics', details: error.message });
  }
});

// POST /api/deployment/:botId/test - Test deployed bot
router.post('/:botId/test', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const { message = 'Hello' } = req.body;

    if (!bot.deployment.isDeployed) {
      return res.status(400).json({ error: 'Bot is not deployed' });
    }

    // Test the bot using the runtime
    const BotRuntime = require('../services/botRuntime');
    const runtime = new BotRuntime(bot);
    
    const testSessionId = `test-${Date.now()}`;
    const response = await runtime.processMessage(message, testSessionId, { 
      isTest: true,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      response,
      testSessionId
    });

  } catch (error) {
    console.error('Test deployed bot error:', error);
    res.status(500).json({ error: 'Failed to test bot', details: error.message });
  }
});

// GET /api/deployment/:botId/domains - Get domain verification status
router.get('/:botId/domains', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;
    const domains = bot.deployment.domains || [];

    // In a real implementation, you might verify domain ownership
    const domainStatus = domains.map(domain => ({
      domain,
      verified: true, // Placeholder - implement actual verification
      lastChecked: new Date()
    }));

    res.json({
      success: true,
      domains: domainStatus
    });

  } catch (error) {
    console.error('Get domain status error:', error);
    res.status(500).json({ error: 'Failed to get domain status', details: error.message });
  }
});

// POST /api/deployment/:botId/regenerate-keys - Regenerate API keys
router.post('/:botId/regenerate-keys', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;

    // Generate new keys
    bot.deployment.widgetId = require('crypto').randomBytes(16).toString('hex');
    bot.deployment.apiKey = require('crypto').randomBytes(32).toString('hex');

    // Regenerate embed code
    const embedCode = bot.generateEmbedCode();

    await bot.save();

    res.json({
      success: true,
      message: 'Keys regenerated successfully',
      deployment: {
        widgetId: bot.deployment.widgetId,
        embedCode
      }
    });

  } catch (error) {
    console.error('Regenerate keys error:', error);
    res.status(500).json({ error: 'Failed to regenerate keys', details: error.message });
  }
});

// Helper function for installation instructions
function getInstallationInstructions(type) {
  const instructions = {
    script: [
      '1. Copy the script code above',
      '2. Paste it into your website\'s HTML, just before the closing </body> tag',
      '3. The widget will automatically appear on your website'
    ],
    iframe: [
      '1. Copy the iframe code above',
      '2. Paste it into your website\'s HTML where you want the chat widget to appear',
      '3. Adjust the width, height, and position as needed'
    ],
    html: [
      '1. Copy the HTML code above',
      '2. Add the div element where you want the chat widget to appear',
      '3. Include the script tag in your page\'s head section'
    ],
    react: [
      '1. Copy the React component code above',
      '2. Import and use the ChatBotWidget component in your React app',
      '3. The widget will initialize automatically when the component mounts'
    ],
    wordpress: [
      '1. Copy the PHP code above',
      '2. Add it to your WordPress theme\'s functions.php file',
      '3. The widget will appear on all pages of your WordPress site'
    ]
  };

  return instructions[type] || [];
}

// GET /api/deployment/:botId/test - Test widget endpoint (no auth required)
router.get('/:botId/test', async (req, res) => {
  try {
    const { botId } = req.params;
    
    // Find bot by widget ID or MongoDB ID
    const bot = await Bot.findOne({
      $or: [
        { 'deployment.widgetId': botId },
        { _id: botId }
      ]
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found', botId });
    }

    if (!bot.deployment.isDeployed) {
      return res.status(400).json({ error: 'Bot is not deployed yet' });
    }

    res.json({
      success: true,
      message: 'Bot is ready for widget integration',
      botName: bot.name,
      widgetId: bot.deployment.widgetId,
      isDeployed: bot.deployment.isDeployed,
      isPublished: bot.isPublished
    });
  } catch (error) {
    console.error('Test widget error:', error);
    res.status(500).json({ error: 'Failed to test widget', details: error.message });
  }
});

// GET /api/deployment/:botId/embed - Get embed code for deployed bot
router.get('/:botId/embed', verifyBotOwnership, async (req, res) => {
  try {
    const bot = req.bot;

    if (!bot.deployment.isDeployed) {
      return res.status(400).json({ error: 'Bot is not deployed yet' });
    }

    res.json({
      success: true,
      embedCode: bot.deployment.embedCode || bot.generateEmbedCode(),
      widgetId: bot.deployment.widgetId,
      apiUrl: process.env.API_URL || 'http://localhost:5000'
    });
  } catch (error) {
    console.error('Get embed code error:', error);
    res.status(500).json({ error: 'Failed to get embed code', details: error.message });
  }
});

// GET /api/deployment/:botId/demo - Get HTML demo page for testing
router.get('/:botId/demo', async (req, res) => {
  try {
    const { botId } = req.params;
    
    // Find bot by widget ID or MongoDB ID
    const bot = await Bot.findOne({
      $or: [
        { 'deployment.widgetId': botId },
        { _id: botId }
      ]
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    if (!bot.deployment.isDeployed) {
      return res.status(400).json({ error: 'Bot is not deployed yet' });
    }

    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    
    const htmlDemo = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bot.name} - Chatbot Demo</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { text-align: center; margin-bottom: 30px; font-size: 2.5rem; }
        .content { line-height: 1.8; font-size: 1.1rem; }
        .highlight {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        code {
            background: rgba(0, 0, 0, 0.3);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 ${bot.name}</h1>
        
        <div class="content">
            <p>Welcome to the ${bot.name} demo! This bot is ready for integration.</p>
            
            <div class="highlight">
                <h3>🔍 Debug Information:</h3>
                <p><strong>Bot ID:</strong> <code>${bot._id}</code></p>
                <p><strong>Widget ID:</strong> <code>${bot.deployment.widgetId}</code></p>
                <p><strong>API URL:</strong> <code>${apiUrl}</code></p>
                <p><strong>Status:</strong> ${bot.isPublished ? '✅ Published' : '❌ Not Published'} | ${bot.deployment.isDeployed ? '✅ Deployed' : '❌ Not Deployed'}</p>
            </div>
            
            <p>Look for the chat bubble in the bottom-right corner. Click it to start chatting!</p>
            
            <div class="highlight">
                <h3>📋 Your embed code:</h3>
                <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${bot.generateEmbedCode().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>
        </div>
    </div>

    ${bot.generateEmbedCode()}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlDemo);
  } catch (error) {
    console.error('Generate demo error:', error);
    res.status(500).json({ error: 'Failed to generate demo', details: error.message });
  }
});

module.exports = router;
