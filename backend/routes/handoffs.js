const express = require('express');
const router = express.Router();
const HandoffRequest = require('../models/HandoffRequest');
const Agent = require('../models/Agent');
const BotConversation = require('../models/BotConversation');
const mongoose = require('mongoose');

// Middleware to ensure user is authenticated
const ensureUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// GET /api/handoffs - Get all handoff requests with filtering
router.get('/', ensureUser, async (req, res) => {
  try {
    console.log('📋 Fetching handoff requests...');
    const { 
      status, 
      priority, 
      category, 
      agentId, 
      platform,
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = {};
    
    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = { $in: ['assigned', 'accepted'] };
      } else {
        query.status = status;
      }
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (agentId) {
      query.assignedAgent = agentId;
    }
    
    if (platform && platform !== 'all') {
      query.platform = platform;
    }
    
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const handoffs = await HandoffRequest.find(query)
      .populate('assignedAgent', 'name email status')
      .populate('conversationId', 'userId platform startTime')
      .sort({ 
        priority: -1, 
        escalationLevel: -1, 
        createdAt: -1 
      })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HandoffRequest.countDocuments(query);

    console.log(`✅ Found ${handoffs.length} handoff requests (${total} total)`);
    
    res.json({
      success: true,
      data: {
        handoffs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching handoff requests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch handoff requests',
      details: error.message 
    });
  }
});

// GET /api/handoffs/queue - Get pending handoffs in queue order
router.get('/queue', ensureUser, async (req, res) => {
  try {
    console.log('📋 Fetching handoff queue...');
    const { skills, departments, languages } = req.query;
    
    const query = { status: 'pending' };
    
    // Add filtering for agent capabilities
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : [skills];
      query.requiredSkills = { $in: skillArray };
    }
    
    if (departments) {
      const deptArray = Array.isArray(departments) ? departments : [departments];
      query.requiredDepartments = { $in: deptArray };
    }

    const queuedHandoffs = await HandoffRequest.find(query)
      .populate('conversationId', 'userId platform startTime')
      .populate('preferredAgent', 'name email')
      .sort({ 
        priority: -1, 
        escalationLevel: -1, 
        createdAt: 1 
      });

    // Update queue positions
    await HandoffRequest.updateQueuePositions();

    console.log(`✅ Found ${queuedHandoffs.length} handoffs in queue`);
    
    res.json({
      success: true,
      data: queuedHandoffs
    });
  } catch (error) {
    console.error('❌ Error fetching handoff queue:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch handoff queue',
      details: error.message 
    });
  }
});

// GET /api/handoffs/:id - Get specific handoff request
router.get('/:id', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching handoff request ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid handoff request ID' 
      });
    }

    const handoff = await HandoffRequest.findById(id)
      .populate('assignedAgent', 'name email phone status')
      .populate('conversationId', 'userId platform startTime messages')
      .populate('previousAgents.agentId', 'name email');

    if (!handoff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Handoff request not found' 
      });
    }

    console.log(`✅ Found handoff request for ${handoff.userName}`);
    
    res.json({
      success: true,
      data: handoff
    });
  } catch (error) {
    console.error('❌ Error fetching handoff request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch handoff request',
      details: error.message 
    });
  }
});

// POST /api/handoffs - Create new handoff request
router.post('/', ensureUser, async (req, res) => {
  try {
    console.log('➕ Creating handoff request...');
    const {
      conversationId,
      botId,
      userId,
      userName,
      userEmail,
      platform,
      reason,
      category = 'general',
      priority = 'medium',
      aiConfidence = 0,
      lastBotResponse,
      conversationSummary,
      detectedIntent,
      suggestedActions = [],
      requiredSkills = [],
      requiredDepartments = [],
      requiredLanguages = [],
      preferredAgent
    } = req.body;

    // Validate required fields
    if (!conversationId || !botId || !userId || !userName || !platform || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: conversationId, botId, userId, userName, platform, reason'
      });
    }

    // Check if handoff request already exists for this conversation
    const existingHandoff = await HandoffRequest.findOne({
      conversationId,
      status: { $in: ['pending', 'assigned', 'accepted'] }
    });

    if (existingHandoff) {
      return res.status(400).json({
        success: false,
        error: 'Handoff request already exists for this conversation',
        data: existingHandoff
      });
    }

    // Create handoff request
    const handoffData = {
      conversationId,
      botId,
      userId,
      userName,
      userEmail,
      platform,
      reason,
      category,
      priority,
      aiConfidence,
      lastBotResponse,
      conversationSummary,
      detectedIntent,
      suggestedActions,
      requiredSkills,
      requiredDepartments,
      requiredLanguages,
      preferredAgent,
      createdBy: 'bot'
    };

    const handoff = new HandoffRequest(handoffData);
    await handoff.save();

    // Update queue positions
    await HandoffRequest.updateQueuePositions();

    // Try to auto-assign to available agent if preferred agent is specified
    if (preferredAgent) {
      const agent = await Agent.findById(preferredAgent);
      if (agent && agent.isAvailable) {
        await handoff.assignToAgent(preferredAgent);
        console.log(`🎯 Auto-assigned handoff to preferred agent: ${agent.name}`);
      }
    }

    console.log(`✅ Created handoff request for ${userName} (${platform})`);
    
    res.status(201).json({
      success: true,
      data: handoff
    });
  } catch (error) {
    console.error('❌ Error creating handoff request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create handoff request',
      details: error.message 
    });
  }
});

// POST /api/handoffs/:id/assign - Assign handoff to agent
router.post('/:id/assign', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    
    console.log(`🎯 Assigning handoff ${id} to agent ${agentId}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid handoff or agent ID' 
      });
    }

    const handoff = await HandoffRequest.findById(id);
    if (!handoff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Handoff request not found' 
      });
    }

    if (handoff.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Handoff request is not in pending status'
      });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    if (!agent.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Agent is not available for new handoffs'
      });
    }

    // Assign handoff to agent
    await handoff.assignToAgent(agentId, req.user._id || req.user.id);
    
    // Update queue positions
    await HandoffRequest.updateQueuePositions();

    console.log(`✅ Assigned handoff to agent ${agent.name}`);
    
    res.json({
      success: true,
      data: handoff,
      message: `Handoff assigned to ${agent.name}`
    });
  } catch (error) {
    console.error('❌ Error assigning handoff:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to assign handoff',
      details: error.message 
    });
  }
});

// POST /api/handoffs/:id/accept - Agent accepts handoff
router.post('/:id/accept', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;
    
    console.log(`✅ Agent ${agentId} accepting handoff ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid handoff or agent ID' 
      });
    }

    const handoff = await HandoffRequest.findById(id);
    if (!handoff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Handoff request not found' 
      });
    }

    if (!['pending', 'assigned'].includes(handoff.status)) {
      return res.status(400).json({
        success: false,
        error: 'Handoff request cannot be accepted in current status'
      });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    // Accept handoff
    await handoff.acceptByAgent(agentId);
    
    // Update agent with new active session
    await agent.acceptHandoff(handoff.conversationId, {
      userId: handoff.userId,
      userName: handoff.userName,
      platform: handoff.platform,
      priority: handoff.priority
    });

    console.log(`✅ Agent ${agent.name} accepted handoff for ${handoff.userName}`);
    
    res.json({
      success: true,
      data: handoff,
      message: `Handoff accepted by ${agent.name}`
    });
  } catch (error) {
    console.error('❌ Error accepting handoff:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to accept handoff',
      details: error.message 
    });
  }
});

// POST /api/handoffs/:id/decline - Agent declines handoff
router.post('/:id/decline', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId, reason = '' } = req.body;
    
    console.log(`❌ Agent ${agentId} declining handoff ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid handoff or agent ID' 
      });
    }

    const handoff = await HandoffRequest.findById(id);
    if (!handoff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Handoff request not found' 
      });
    }

    if (!['pending', 'assigned'].includes(handoff.status)) {
      return res.status(400).json({
        success: false,
        error: 'Handoff request cannot be declined in current status'
      });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    // Decline handoff
    await handoff.decline(agentId, reason);
    
    // Update queue positions
    await HandoffRequest.updateQueuePositions();

    console.log(`✅ Agent ${agent.name} declined handoff: ${reason}`);
    
    res.json({
      success: true,
      data: handoff,
      message: `Handoff declined by ${agent.name}`
    });
  } catch (error) {
    console.error('❌ Error declining handoff:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to decline handoff',
      details: error.message 
    });
  }
});

// POST /api/handoffs/:id/complete - Complete handoff
router.post('/:id/complete', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId, resolution = {} } = req.body;
    
    console.log(`🏁 Completing handoff ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid handoff or agent ID' 
      });
    }

    const handoff = await HandoffRequest.findById(id);
    if (!handoff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Handoff request not found' 
      });
    }

    if (handoff.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Handoff request must be accepted to complete'
      });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'Agent not found' 
      });
    }

    // Complete handoff
    await handoff.complete(agentId, resolution);
    
    // Update agent metrics
    const metrics = {
      responseTime: handoff.metrics.timeToAcceptance / 1000, // Convert to seconds
      resolutionTime: handoff.metrics.resolutionTime / (1000 * 60), // Convert to minutes
      satisfaction: resolution.satisfaction
    };
    
    await agent.completeHandoff(handoff.conversationId, metrics);

    console.log(`✅ Completed handoff for ${handoff.userName} by ${agent.name}`);
    
    res.json({
      success: true,
      data: handoff,
      message: 'Handoff completed successfully'
    });
  } catch (error) {
    console.error('❌ Error completing handoff:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete handoff',
      details: error.message 
    });
  }
});

// POST /api/handoffs/:id/escalate - Escalate handoff
router.post('/:id/escalate', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, escalatedBy } = req.body;
    
    console.log(`⬆️ Escalating handoff ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid handoff ID' 
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Escalation reason is required'
      });
    }

    const handoff = await HandoffRequest.findById(id);
    if (!handoff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Handoff request not found' 
      });
    }

    if (!['accepted', 'assigned'].includes(handoff.status)) {
      return res.status(400).json({
        success: false,
        error: 'Handoff request must be assigned or accepted to escalate'
      });
    }

    // Escalate handoff
    await handoff.escalate(reason, escalatedBy || req.user._id || req.user.id);
    
    // Update queue positions
    await HandoffRequest.updateQueuePositions();

    console.log(`✅ Escalated handoff to level ${handoff.escalationLevel}: ${reason}`);
    
    res.json({
      success: true,
      data: handoff,
      message: `Handoff escalated to level ${handoff.escalationLevel}`
    });
  } catch (error) {
    console.error('❌ Error escalating handoff:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to escalate handoff',
      details: error.message 
    });
  }
});

// POST /api/handoffs/:id/notes - Add note to handoff
router.post('/:id/notes', ensureUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, author = 'agent', isInternal = true } = req.body;
    
    console.log(`📝 Adding note to handoff ${id}...`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid handoff ID' 
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }

    const handoff = await HandoffRequest.findById(id);
    if (!handoff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Handoff request not found' 
      });
    }

    await handoff.addNote(content, author, isInternal);

    console.log(`✅ Added note to handoff for ${handoff.userName}`);
    
    res.json({
      success: true,
      data: handoff,
      message: 'Note added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding note to handoff:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add note',
      details: error.message 
    });
  }
});

// GET /api/handoffs/stats/summary - Get handoff statistics
router.get('/stats/summary', ensureUser, async (req, res) => {
  try {
    console.log('📊 Fetching handoff statistics...');
    const { period = '30d' } = req.query;
    
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

    const [
      totalHandoffs,
      pendingHandoffs,
      completedHandoffs,
      averageWaitTime,
      averageResolutionTime,
      handoffsByCategory,
      handoffsByPriority
    ] = await Promise.all([
      HandoffRequest.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate } 
      }),
      HandoffRequest.countDocuments({ status: 'pending' }),
      HandoffRequest.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      HandoffRequest.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, avg: { $avg: '$metrics.customerWaitTime' } } }
      ]),
      HandoffRequest.aggregate([
        { $match: { 
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }},
        { $group: { _id: null, avg: { $avg: '$metrics.resolutionTime' } } }
      ]),
      HandoffRequest.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      HandoffRequest.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ])
    ]);

    const stats = {
      period,
      dateRange: { start: startDate, end: endDate },
      summary: {
        totalHandoffs,
        pendingHandoffs,
        completedHandoffs,
        completionRate: totalHandoffs > 0 ? (completedHandoffs / totalHandoffs) * 100 : 0,
        averageWaitTime: averageWaitTime[0]?.avg || 0,
        averageResolutionTime: averageResolutionTime[0]?.avg || 0
      },
      breakdown: {
        byCategory: handoffsByCategory,
        byPriority: handoffsByPriority
      }
    };

    console.log(`✅ Generated handoff statistics for ${period}`);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching handoff statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch handoff statistics',
      details: error.message 
    });
  }
});

module.exports = router;
