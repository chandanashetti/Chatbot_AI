const express = require('express');
const router = express.Router();
const BotConversation = require('../models/BotConversation');
const ChannelAccount = require('../models/ChannelAccount');
const mongoose = require('mongoose');

// GET /api/conversations - List conversations with filtering
router.get('/', async (req, res) => {
  try {
    const {
      platform,
      channelAccountId,
      botId,
      userId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = {};

    if (platform && platform !== 'all') query.platform = platform;
    if (channelAccountId) query.channelAccountId = channelAccountId;
    if (botId) query.botId = botId;
    if (userId) query.userId = userId;
    if (status && status !== 'all') query.status = status;

    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search functionality
    if (search) {
      query.$or = [
        { 'userInfo.sessionId': { $regex: search, $options: 'i' } },
        { 'userInfo.userName': { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const conversations = await BotConversation.find(query)
      .populate('botId', 'name status')
      .populate('channelAccountId', 'name platform details')
      .populate('userId', 'email profile.firstName profile.lastName')
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
        },
        filters: {
          platform,
          channelAccountId,
          botId,
          userId,
          status,
          startDate,
          endDate,
          search
        }
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// GET /api/conversations/platform/:platform - Get conversations by platform
router.get('/platform/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const {
      channelAccountId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = { platform };
    if (channelAccountId) query.channelAccountId = channelAccountId;
    if (status && status !== 'all') query.status = status;

    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await BotConversation.find(query)
      .populate('botId', 'name status')
      .populate('channelAccountId', 'name platform details')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BotConversation.countDocuments(query);

    // Get platform statistics
    const platformStats = await BotConversation.aggregate([
      { $match: { platform } },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          averageResponseTime: { $avg: '$metrics.averageResponseTime' },
          satisfactionScore: { $avg: '$metrics.satisfactionScore' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        platform,
        conversations,
        statistics: platformStats[0] || {
          totalConversations: 0,
          totalMessages: 0,
          averageResponseTime: 0,
          satisfactionScore: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching platform conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform conversations'
    });
  }
});

// GET /api/conversations/account/:accountId - Get conversations for specific account
router.get('/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account ID'
      });
    }

    // Verify account exists
    const account = await ChannelAccount.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Build query
    const query = { channelAccountId: accountId };
    if (status && status !== 'all') query.status = status;

    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await BotConversation.find(query)
      .populate('botId', 'name status')
      .populate('channelAccountId', 'name platform details')
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BotConversation.countDocuments(query);

    // Get account statistics
    const accountStats = await BotConversation.aggregate([
      { $match: { channelAccountId: accountId } },
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
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        account: {
          id: account._id,
          name: account.name,
          platform: account.platform,
          details: account.details
        },
        conversations,
        statistics: accountStats[0] || {
          totalConversations: 0,
          totalMessages: 0,
          averageResponseTime: 0,
          satisfactionScore: 0,
          completionRate: 0
        },
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

// GET /api/conversations/:id - Get specific conversation details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation ID'
      });
    }

    const conversation = await BotConversation.findById(id)
      .populate('botId', 'name status description')
      .populate('channelAccountId', 'name platform details')
      .populate('userId', 'email profile.firstName profile.lastName');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation details'
    });
  }
});

// GET /api/conversations/analytics/summary - Get conversation analytics summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const {
      platform,
      channelAccountId,
      startDate,
      endDate
    } = req.query;

    // Build match filter
    const matchFilter = {};
    if (platform && platform !== 'all') matchFilter.platform = platform;
    if (channelAccountId) matchFilter.channelAccountId = channelAccountId;
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    // Get overall statistics
    const overallStats = await BotConversation.aggregate([
      { $match: matchFilter },
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

    // Get platform breakdown
    const platformBreakdown = await BotConversation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$platform',
          conversations: { $sum: 1 },
          messages: { $sum: { $size: '$messages' } },
          satisfaction: { $avg: '$metrics.satisfactionScore' }
        }
      },
      { $sort: { conversations: -1 } }
    ]);

    // Get status breakdown
    const statusBreakdown = await BotConversation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily activity
    const dailyActivity = await BotConversation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          conversations: { $sum: 1 },
          messages: { $sum: { $size: '$messages' } }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 } // Last 30 days
    ]);

    const result = overallStats[0] || {
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
        summary: result,
        platformBreakdown,
        statusBreakdown,
        dailyActivity,
        filters: {
          platform,
          channelAccountId,
          startDate,
          endDate
        }
      }
    });
  } catch (error) {
    console.error('Error fetching conversation analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation analytics'
    });
  }
});

module.exports = router;
