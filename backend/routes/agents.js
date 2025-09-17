const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const HandoffRequest = require('../models/HandoffRequest');
const BotConversation = require('../models/BotConversation');
const mongoose = require('mongoose');

// Note: Authentication is handled by server.js middleware

// GET /api/agents - Get all agents with optional filtering
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching agents...');
    const { 
      status, 
      department, 
      skills, 
      availability, 
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (department) {
      query.departments = department;
    }
    
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      query['skills.categories'] = { $in: skillArray };
    }
    
    if (availability === 'available') {
      query['availability.isOnline'] = true;
      query.status = 'available';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const agents = await Agent.find(query)
      .populate('userId', 'name email')
      .select('-preferences -handoffSettings') // Exclude sensitive data
      .sort({ 'availability.lastSeen': -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Agent.countDocuments(query);

    console.log(`✅ Found ${agents.length} agents (${total} total)`);
    
    res.json({
      success: true,
      data: {
        agents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching agents:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch agents',
      details: error.message 
    });
  }
});

// GET /api/agents/available - Get available agents for handoff
router.get('/available', async (req, res) => {
  try {
    console.log('🔍 Finding available agents...');
    const { skills, departments, languages, priority } = req.query;
    
    const criteria = {};
    if (skills) criteria.skills = Array.isArray(skills) ? skills : [skills];
    if (departments) criteria.departments = Array.isArray(departments) ? departments : [departments];
    if (languages) criteria.languages = Array.isArray(languages) ? languages : [languages];
    
    const availableAgents = await Agent.findAvailableAgents(criteria);
    
    console.log(`✅ Found ${availableAgents.length} available agents`);
    
    res.json({
      success: true,
      data: availableAgents
    });
  } catch (error) {
    console.error('❌ Error finding available agents:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to find available agents',
      details: error.message 
    });
  }
});

// GET /api/agents/:id - Get specific agent
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching agent ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid agent ID' 
      });
    }

    const agent = await Agent.findById(id)
      .populate('userId', 'name email')
      .populate('activeSessions.conversationId', 'userId platform startTime');

    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    console.log(`✅ Found agent: ${agent.name}`);
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('❌ Error fetching agent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch agent',
      details: error.message 
    });
  }
});

// POST /api/agents - Create new agent
router.post('/', async (req, res) => {
  try {
    console.log('➕ Creating new agent...');
    const { userId, ...otherData } = req.body;
    
    // Validate required fields
    if (!otherData.name || !otherData.email || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and userId are required'
      });
    }

    // Check if email already exists
    const existingAgent = await Agent.findOne({ email: otherData.email });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        error: 'Agent with this email already exists'
      });
    }

    // Check if userId exists
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Selected user does not exist'
      });
    }

    // Check if user is already linked to an agent
    const existingUserAgent = await Agent.findOne({ userId: userId });
    if (existingUserAgent) {
      return res.status(400).json({
        success: false,
        error: 'This user is already linked to another agent'
      });
    }

    const agentData = {
      ...otherData,
      userId: userId,
      createdBy: req.user._id || req.user.id,
      // Set default availability
      availability: {
        isOnline: false,
        lastSeen: new Date(),
        maxConcurrentChats: otherData.availability?.maxConcurrentChats || 5,
        workingHours: {
          timezone: otherData.availability?.timezone || 'UTC',
          schedule: []
        }
      }
    };

    const agent = new Agent(agentData);
    await agent.save();

    // Populate the userId field for the response
    await agent.populate('userId', 'email profile.firstName profile.lastName');

    console.log(`✅ Created agent: ${agent.name} (${agent.email}) linked to user ${user.email}`);
    
    res.status(201).json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('❌ Error creating agent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create agent',
      details: error.message 
    });
  }
});

// PUT /api/agents/:id - Update agent
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📝 Updating agent ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid agent ID' 
      });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user._id || req.user.id
    };

    const agent = await Agent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    console.log(`✅ Updated agent: ${agent.name}`);
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('❌ Error updating agent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update agent',
      details: error.message 
    });
  }
});

// PATCH /api/agents/:id/status - Update agent status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating agent ${id} status to ${status}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid agent ID' 
      });
    }

    if (!['available', 'busy', 'offline', 'break'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: available, busy, offline, or break'
      });
    }

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    await agent.setStatus(status);

    console.log(`✅ Updated agent ${agent.name} status to ${status}`);
    
    res.json({
      success: true,
      data: {
        id: agent._id,
        name: agent.name,
        status: agent.status,
        lastSeen: agent.availability.lastSeen
      }
    });
  } catch (error) {
    console.error('❌ Error updating agent status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update agent status',
      details: error.message 
    });
  }
});

// PATCH /api/agents/:id/availability - Update agent availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { isOnline, maxConcurrentChats } = req.body;
    
    console.log(`🔄 Updating agent ${id} availability...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid agent ID' 
      });
    }

    const updateData = {};
    if (isOnline !== undefined) {
      updateData['availability.isOnline'] = isOnline;
      updateData['availability.lastSeen'] = new Date();
    }
    if (maxConcurrentChats !== undefined) {
      updateData['availability.maxConcurrentChats'] = maxConcurrentChats;
    }

    const agent = await Agent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    console.log(`✅ Updated agent ${agent.name} availability`);
    
    res.json({
      success: true,
      data: {
        id: agent._id,
        name: agent.name,
        availability: agent.availability,
        isAvailable: agent.isAvailable
      }
    });
  } catch (error) {
    console.error('❌ Error updating agent availability:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update agent availability',
      details: error.message 
    });
  }
});

// DELETE /api/agents/:id - Soft delete agent
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deactivating agent ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid agent ID' 
      });
    }

    const agent = await Agent.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        status: 'offline',
        'availability.isOnline': false,
        updatedBy: req.user._id || req.user.id
      },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    console.log(`✅ Deactivated agent: ${agent.name}`);
    
    res.json({
      success: true,
      message: 'Agent deactivated successfully',
      data: { id: agent._id, name: agent.name }
    });
  } catch (error) {
    console.error('❌ Error deactivating agent:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to deactivate agent',
      details: error.message 
    });
  }
});

// GET /api/agents/:id/stats - Get agent statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;
    
    console.log(`📊 Fetching stats for agent ${id} (${period})...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid agent ID' 
      });
    }

    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get handoff requests handled by this agent
    const handoffStats = await HandoffRequest.aggregate([
      {
        $match: {
          assignedAgent: agent._id,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalHandoffs: { $sum: 1 },
          completedHandoffs: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageResponseTime: { $avg: '$metrics.timeToAcceptance' },
          averageResolutionTime: { $avg: '$metrics.resolutionTime' },
          averageSatisfaction: { $avg: '$metrics.customerSatisfaction' },
          byCategory: {
            $push: {
              category: '$category',
              priority: '$priority',
              resolved: { $eq: ['$status', 'completed'] }
            }
          }
        }
      }
    ]);

    const stats = {
      period,
      dateRange: { start: startDate, end: endDate },
      basic: {
        totalChatsHandled: agent.metrics.totalChatsHandled,
        activeChats: agent.metrics.activeChats,
        averageResponseTime: agent.metrics.averageResponseTime,
        customerSatisfactionScore: agent.metrics.customerSatisfactionScore,
        ratingsCount: agent.metrics.ratingsCount
      },
      handoffs: handoffStats[0] || {
        totalHandoffs: 0,
        completedHandoffs: 0,
        averageResponseTime: 0,
        averageResolutionTime: 0,
        averageSatisfaction: 0,
        byCategory: []
      }
    };

    console.log(`✅ Generated stats for agent ${agent.name}`);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching agent stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch agent stats',
      details: error.message 
    });
  }
});

// GET /api/agents/:id/analytics - Get agent analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    console.log(`📊 Fetching analytics for agent ${id}...`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid agent ID'
      });
    }

    // Try to find agent by ID first, then by userId
    let agent = await Agent.findById(id);
    if (!agent) {
      // If not found by agent ID, try to find by userId (for when user ID is passed)
      agent = await Agent.findOne({ userId: id });
    }

    if (!agent) {
      // If still not found, check if this is a user with agent role who needs an agent record
      const User = require('../models/User');
      const user = await User.findById(id);

      if (user && user.role === 'agent') {
        // Create an agent record for this user
        agent = new Agent({
          name: user.fullName || `${user.profile.firstName} ${user.profile.lastName}`,
          email: user.email,
          phone: user.profile.phone || '',
          userId: user._id,
          role: 'agent',
          status: 'available',
          isActive: true,
          availability: {
            isOnline: true,
            lastSeen: new Date(),
            maxConcurrentChats: 5
          },
          metrics: {
            totalChatsHandled: 0,
            activeChats: 0,
            averageResponseTime: 2.5,
            customerSatisfactionScore: 4.0,
            ratingsCount: 0
          }
        });
        await agent.save();
        console.log(`✅ Created new agent record for user ${user.email} - set as available`);
      } else {
        return res.status(404).json({
          success: false,
          error: 'Agent not found. Make sure you have agent role permissions.'
        });
      }
    } else {
      // Update existing agent as online when they access analytics
      agent.availability.isOnline = true;
      agent.availability.lastSeen = new Date();
      if (agent.status === 'offline') {
        agent.status = 'available';
      }
      await agent.save();
      console.log(`✅ Updated agent ${agent.name} as online via analytics`);
    }

    // Calculate date range
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get handoff requests handled by this agent
    const handoffAnalytics = await HandoffRequest.aggregate([
      {
        $match: {
          assignedAgent: agent._id,
          createdAt: { $gte: startDateObj, $lte: endDateObj }
        }
      },
      {
        $group: {
          _id: null,
          totalHandoffs: { $sum: 1 },
          completedHandoffs: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageResponseTime: { $avg: '$metrics.timeToAcceptance' },
          averageResolutionTime: { $avg: '$metrics.resolutionTime' },
          averageSatisfaction: { $avg: '$metrics.customerSatisfaction' },
          satisfactionCount: {
            $sum: { $cond: [{ $ne: ['$metrics.customerSatisfaction', null] }, 1, 0] }
          },
          categoriesHandled: {
            $push: {
              category: '$category',
              priority: '$priority',
              status: '$status',
              satisfaction: '$metrics.customerSatisfaction',
              responseTime: '$metrics.timeToAcceptance',
              date: '$createdAt'
            }
          }
        }
      }
    ]);

    // Get daily performance data
    const dailyPerformance = await HandoffRequest.aggregate([
      {
        $match: {
          assignedAgent: agent._id,
          createdAt: { $gte: startDateObj, $lte: endDateObj }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          chatsHandled: { $sum: 1 },
          avgResponseTime: { $avg: '$metrics.timeToAcceptance' },
          satisfaction: { $avg: '$metrics.customerSatisfaction' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format daily performance data
    const performanceByDate = dailyPerformance.map(day => ({
      date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
      chatsHandled: day.chatsHandled,
      avgResponseTime: day.avgResponseTime || 0,
      satisfaction: day.satisfaction || 0
    }));

    // Process categories
    const analyticsData = handoffAnalytics[0];
    const chatsByCategory = {
      technical: 0,
      billing: 0,
      sales: 0,
      support: 0,
      general: 0
    };

    const satisfactionDistribution = [
      { rating: 5, count: 0 },
      { rating: 4, count: 0 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 }
    ];

    if (analyticsData && analyticsData.categoriesHandled) {
      analyticsData.categoriesHandled.forEach(item => {
        // Count by category
        if (chatsByCategory.hasOwnProperty(item.category)) {
          chatsByCategory[item.category]++;
        } else {
          chatsByCategory.general++;
        }

        // Count satisfaction ratings
        if (item.satisfaction) {
          const rating = Math.round(item.satisfaction);
          const ratingIndex = satisfactionDistribution.findIndex(r => r.rating === rating);
          if (ratingIndex !== -1) {
            satisfactionDistribution[ratingIndex].count++;
          }
        }
      });
    }

    // Generate hourly response time data (mock for now, would need more complex aggregation for real data)
    const responseTimeByHour = [];
    for (let hour = 9; hour <= 17; hour++) {
      responseTimeByHour.push({
        hour: `${String(hour).padStart(2, '0')}:00`,
        avgTime: analyticsData ?
          Math.random() * 1.5 + (analyticsData.averageResponseTime || 2) - 0.75 :
          Math.random() * 1.5 + 1.25
      });
    }

    const response = {
      personalMetrics: {
        totalChatsHandled: agent.metrics.totalChatsHandled,
        activeChats: agent.metrics.activeChats,
        averageResponseTime: analyticsData ? (analyticsData.averageResponseTime / 1000) : agent.metrics.averageResponseTime,
        customerSatisfactionScore: analyticsData ? analyticsData.averageSatisfaction : agent.metrics.customerSatisfactionScore,
        ratingsCount: analyticsData ? analyticsData.satisfactionCount : agent.metrics.ratingsCount,
        completionRate: analyticsData && analyticsData.totalHandoffs > 0 ?
          (analyticsData.completedHandoffs / analyticsData.totalHandoffs) * 100 : 95,
        handoffsAccepted: analyticsData ? analyticsData.totalHandoffs : 0,
        handoffsCompleted: analyticsData ? analyticsData.completedHandoffs : 0
      },
      performanceByDate,
      chatsByCategory,
      satisfactionDistribution,
      responseTimeByHour,
      monthlyGoals: {
        chatsTarget: 150,
        chatsActual: agent.metrics.totalChatsHandled,
        satisfactionTarget: 4.5,
        satisfactionActual: analyticsData ? analyticsData.averageSatisfaction : agent.metrics.customerSatisfactionScore,
        responseTimeTarget: 2.0,
        responseTimeActual: analyticsData ? (analyticsData.averageResponseTime / 1000) : agent.metrics.averageResponseTime
      }
    };

    console.log(`✅ Generated analytics for agent ${agent.name}`);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('❌ Error fetching agent analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent analytics',
      details: error.message
    });
  }
});

// GET /api/agents/me - Get current agent profile (creates if not exists)
router.get('/me', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    console.log(`📋 Getting agent profile for user ${userId}...`);

    // Try to find existing agent record
    let agent = await Agent.findOne({ userId: userId });

    if (!agent) {
      // Check if this user has agent role
      const User = require('../models/User');
      const user = await User.findById(userId);

      if (user && user.role === 'agent') {
        // Create an agent record for this user
        agent = new Agent({
          name: user.fullName || `${user.profile.firstName} ${user.profile.lastName}`,
          email: user.email,
          phone: user.profile.phone || '',
          userId: user._id,
          role: 'agent',
          status: 'available',
          isActive: true,
          availability: {
            isOnline: true,
            lastSeen: new Date(),
            maxConcurrentChats: 5
          },
          metrics: {
            totalChatsHandled: 0,
            activeChats: 0,
            averageResponseTime: 2.5,
            customerSatisfactionScore: 4.0,
            ratingsCount: 0
          }
        });
        await agent.save();
        console.log(`✅ Created new agent record for user ${user.email} - set as available`);
      } else {
        return res.status(403).json({
          success: false,
          error: 'User does not have agent role permissions'
        });
      }
    } else {
      // Update existing agent as online when they access the dashboard
      agent.availability.isOnline = true;
      agent.availability.lastSeen = new Date();
      if (agent.status === 'offline') {
        agent.status = 'available';
      }
      await agent.save();
      console.log(`✅ Updated agent ${agent.name} as online`);
    }

    console.log(`✅ Agent profile ready: ${agent.name} (${agent.status})`);

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('❌ Error getting agent profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent profile',
      details: error.message
    });
  }
});

// POST /api/agents/me/heartbeat - Update agent heartbeat (keeps them online)
router.post('/me/heartbeat', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const agent = await Agent.findOne({ userId: userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Update heartbeat
    agent.availability.lastSeen = new Date();
    agent.availability.isOnline = true;
    await agent.save();

    res.json({
      success: true,
      data: { lastSeen: agent.availability.lastSeen }
    });
  } catch (error) {
    console.error('❌ Error updating agent heartbeat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update heartbeat'
    });
  }
});

// POST /api/agents/me/offline - Set agent as offline
router.post('/me/offline', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const agent = await Agent.findOne({ userId: userId });
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Set offline
    agent.availability.isOnline = false;
    agent.status = 'offline';
    agent.availability.lastSeen = new Date();
    await agent.save();

    console.log(`✅ Agent ${agent.name} set offline`);

    res.json({
      success: true,
      data: { status: agent.status, isOnline: agent.availability.isOnline }
    });
  } catch (error) {
    console.error('❌ Error setting agent offline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set agent offline'
    });
  }
});

// GET /api/agents/dashboard/summary - Get dashboard summary for agents
router.get('/dashboard/summary', async (req, res) => {
  try {
    console.log('📊 Fetching agent dashboard summary...');

    const [
      totalAgents,
      availableAgents,
      busyAgents,
      offlineAgents,
      pendingHandoffs,
      activeHandoffs
    ] = await Promise.all([
      Agent.countDocuments({ isActive: true }),
      Agent.countDocuments({ isActive: true, status: 'available', 'availability.isOnline': true }),
      Agent.countDocuments({ isActive: true, status: 'busy' }),
      Agent.countDocuments({ isActive: true, status: 'offline' }),
      HandoffRequest.countDocuments({ status: 'pending' }),
      HandoffRequest.countDocuments({ status: { $in: ['assigned', 'accepted'] } })
    ]);

    // Get queue statistics
    const queueStats = await HandoffRequest.getQueueStats();

    // Get recent activity
    const recentHandoffs = await HandoffRequest.find({})
      .populate('assignedAgent', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const summary = {
      agents: {
        total: totalAgents,
        available: availableAgents,
        busy: busyAgents,
        offline: offlineAgents
      },
      handoffs: {
        pending: pendingHandoffs,
        active: activeHandoffs,
        queue: queueStats[0] || { total: 0, avgWaitTime: 0 }
      },
      recentActivity: recentHandoffs
    };

    console.log(`✅ Dashboard summary: ${totalAgents} agents, ${pendingHandoffs} pending handoffs`);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard summary',
      details: error.message
    });
  }
});

// Background task to mark stale agents as offline
const markStaleAgentsOffline = async () => {
  try {
    const staleTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

    const result = await Agent.updateMany(
      {
        'availability.isOnline': true,
        'availability.lastSeen': { $lt: staleTime }
      },
      {
        $set: {
          'availability.isOnline': false,
          status: 'offline'
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🕐 Marked ${result.modifiedCount} stale agents as offline`);
    }
  } catch (error) {
    console.error('❌ Error marking stale agents offline:', error);
  }
};

// Run background task every 2 minutes
setInterval(markStaleAgentsOffline, 2 * 60 * 1000);

module.exports = router;
