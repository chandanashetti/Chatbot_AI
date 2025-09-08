const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const HandoffRequest = require('../models/HandoffRequest');
const BotConversation = require('../models/BotConversation');
const mongoose = require('mongoose');

// Middleware to ensure user is authenticated (assuming this exists)
const ensureUser = (req, res, next) => {
  // This should be implemented based on your auth system
  // For now, we'll assume req.user is set
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// GET /api/agents - Get all agents with optional filtering
router.get('/', ensureUser, async (req, res) => {
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
router.get('/available', ensureUser, async (req, res) => {
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
router.get('/:id', ensureUser, async (req, res) => {
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
router.post('/', ensureUser, async (req, res) => {
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
router.put('/:id', ensureUser, async (req, res) => {
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
router.patch('/:id/status', ensureUser, async (req, res) => {
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
router.patch('/:id/availability', ensureUser, async (req, res) => {
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
router.delete('/:id', ensureUser, async (req, res) => {
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
router.get('/:id/stats', ensureUser, async (req, res) => {
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

// GET /api/agents/dashboard/summary - Get dashboard summary for agents
router.get('/dashboard/summary', ensureUser, async (req, res) => {
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

module.exports = router;
