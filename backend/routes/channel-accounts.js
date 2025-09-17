const express = require('express');
const router = express.Router();
const ChannelAccount = require('../models/ChannelAccount');
const BotConversation = require('../models/BotConversation');
const mongoose = require('mongoose');

// Middleware to ensure user is authenticated (assuming this exists)
// const auth = require('../middleware/auth');

// GET /api/channel-accounts - List all channel accounts
router.get('/', async (req, res) => {
  try {
    const { 
      platform, 
      status, 
      userId, 
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (platform && platform !== 'all') query.platform = platform;
    if (status && status !== 'all') query.status = status;
    if (userId) query.userId = userId;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const accounts = await ChannelAccount.find(query)
      .populate('botId', 'name status')
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ChannelAccount.countDocuments(query);

    // Get analytics for each account
    const accountsWithAnalytics = await Promise.all(
      accounts.map(async (account) => {
        const conversationCount = await BotConversation.countDocuments({
          channelAccountId: account._id
        });
        
        const recentActivity = await BotConversation.findOne({
          channelAccountId: account._id
        }).sort({ lastMessageAt: -1 }).select('lastMessageAt');

        return {
          ...account.toObject(),
          analytics: {
            ...account.analytics,
            totalConversations: conversationCount,
            lastActivity: recentActivity?.lastMessageAt || account.analytics.lastActivity
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        accounts: accountsWithAnalytics,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching channel accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch channel accounts'
    });
  }
});

// GET /api/channel-accounts/platform/:platform - List accounts by platform
router.get('/platform/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { userId, status = 'connected' } = req.query;

    const query = { platform };
    if (userId) query.userId = userId;
    if (status !== 'all') query.status = status;

    const accounts = await ChannelAccount.find(query)
      .populate('botId', 'name status')
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort({ name: 1 });

    // Get analytics for each account
    const accountsWithAnalytics = await Promise.all(
      accounts.map(async (account) => {
        const conversationCount = await BotConversation.countDocuments({
          channelAccountId: account._id
        });
        
        const recentActivity = await BotConversation.findOne({
          channelAccountId: account._id
        }).sort({ lastMessageAt: -1 }).select('lastMessageAt');

        return {
          ...account.toObject(),
          analytics: {
            ...account.analytics,
            totalConversations: conversationCount,
            lastActivity: recentActivity?.lastMessageAt || account.analytics.lastActivity
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        platform,
        accounts: accountsWithAnalytics,
        total: accountsWithAnalytics.length
      }
    });
  } catch (error) {
    console.error('Error fetching accounts by platform:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts by platform'
    });
  }
});

// GET /api/channel-accounts/:id - Get account details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const account = await ChannelAccount.findById(id)
      .populate('botId', 'name status description')
      .populate('userId', 'email profile.firstName profile.lastName')
      .populate('organizationId', 'name');

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Get detailed analytics
    const conversationStats = await BotConversation.aggregate([
      { $match: { channelAccountId: account._id } },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          averageResponseTime: { $avg: '$metrics.averageResponseTime' },
          satisfactionScore: { $avg: '$metrics.satisfactionScore' },
          lastActivity: { $max: '$lastMessageAt' }
        }
      }
    ]);

    const recentConversations = await BotConversation.find({
      channelAccountId: account._id
    })
      .sort({ lastMessageAt: -1 })
      .limit(10)
      .select('conversationId sessionId status lastMessageAt metrics.satisfactionScore');

    const stats = conversationStats[0] || {
      totalConversations: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      satisfactionScore: 0,
      lastActivity: null
    };

    res.json({
      success: true,
      data: {
        account: {
          ...account.toObject(),
          analytics: {
            ...account.analytics,
            ...stats
          }
        },
        recentConversations
      }
    });
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account details'
    });
  }
});

// POST /api/channel-accounts - Create new account
router.post('/', async (req, res) => {
  try {
    const {
      accountId,
      name,
      platform,
      details,
      credentials,
      settings,
      botId,
      userId,
      organizationId
    } = req.body;

    // Validate required fields
    if (!accountId || !name || !platform || !botId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, name, platform, botId, userId'
      });
    }

    // Check if account already exists
    const existingAccount = await ChannelAccount.findOne({
      accountId,
      platform
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        error: 'Account with this ID already exists for this platform'
      });
    }

    // Create new account
    const account = new ChannelAccount({
      accountId,
      name,
      platform,
      details: details || {},
      credentials: credentials || {},
      settings: settings || {},
      botId,
      userId,
      organizationId,
      status: 'pending'
    });

    await account.save();

    // Populate the response
    await account.populate([
      { path: 'botId', select: 'name status' },
      { path: 'userId', select: 'email profile.firstName profile.lastName' }
    ]);

    res.status(201).json({
      success: true,
      data: { account }
    });
  } catch (error) {
    console.error('Error creating channel account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create channel account'
    });
  }
});

// PUT /api/channel-accounts/:id - Update account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const account = await ChannelAccount.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('botId', 'name status')
      .populate('userId', 'email profile.firstName profile.lastName');

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.json({
      success: true,
      data: { account }
    });
  } catch (error) {
    console.error('Error updating channel account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update channel account'
    });
  }
});

// DELETE /api/channel-accounts/:id - Delete account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    const account = await ChannelAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if account has active conversations
    const activeConversations = await BotConversation.countDocuments({
      channelAccountId: id,
      status: { $in: ['active', 'pending'] }
    });

    if (activeConversations > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete account with ${activeConversations} active conversations. Please archive or complete conversations first.`
      });
    }

    await ChannelAccount.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting channel account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete channel account'
    });
  }
});

// GET /api/channel-accounts/:id/conversations - Get conversations for specific account
router.get('/:id/conversations', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      page = 1, 
      limit = 50,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc'
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    // Build query
    const query = { channelAccountId: id };
    if (status && status !== 'all') query.status = status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const conversations = await BotConversation.find(query)
      .populate('botId', 'name status')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BotConversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching account conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account conversations'
    });
  }
});

// GET /api/channel-accounts/:id/analytics - Get analytics for specific account
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    // Build date filter
    const dateFilter = { channelAccountId: id };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get conversation analytics
    const analytics = await BotConversation.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          averageResponseTime: { $avg: '$metrics.averageResponseTime' },
          satisfactionScore: { $avg: '$metrics.satisfactionScore' },
          completionRate: {
            $avg: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          handoffRate: {
            $avg: {
              $cond: [{ $eq: ['$status', 'handoff'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get daily breakdown
    const dailyStats = await BotConversation.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          conversations: { $sum: 1 },
          messages: { $sum: { $size: '$messages' } },
          satisfaction: { $avg: '$metrics.satisfactionScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = analytics[0] || {
      totalConversations: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      satisfactionScore: 0,
      completionRate: 0,
      handoffRate: 0
    };

    res.json({
      success: true,
      data: {
        analytics: result,
        dailyStats,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Error fetching account analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account analytics'
    });
  }
});

module.exports = router;
