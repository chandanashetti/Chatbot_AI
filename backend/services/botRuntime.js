const BotConversation = require('../models/BotConversation');
const Settings = require('../models/Settings');
const Document = require('../models/Document');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class BotRuntime {
  constructor(bot) {
    this.bot = bot;
    this.openaiClient = null;
    this.initializeAI();
  }

  async initializeAI() {
    if (this.bot.settings.ai.provider === 'openai') {
      try {
        const settings = await Settings.findOne({ isDefault: true });
        if (settings?.openai?.apiKey) {
          const OpenAI = require('openai');
          this.openaiClient = new OpenAI({ apiKey: settings.openai.apiKey });
        }
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
      }
    }
  }

  async processMessage(message, sessionId, userInfo = {}) {
    try {
      // Find or create conversation
      let conversation = await BotConversation.findBySessionId(sessionId);
      
      if (!conversation) {
        conversation = await this.createNewConversation(sessionId, userInfo);
      }

      // Add user message to conversation
      const userMessage = conversation.addMessage({
        content: message,
        sender: 'user',
        metadata: {
          timestamp: new Date(),
          userAgent: userInfo.userAgent,
          ipAddress: userInfo.ipAddress
        }
      });

      // Process message through flow
      const response = await this.executeFlow(conversation, message);

      // Add bot response to conversation
      const botMessage = conversation.addMessage({
        content: response.content,
        sender: 'bot',
        type: response.type || 'text',
        nodeId: response.nodeId,
        metadata: {
          ...response.metadata,
          processingTime: Date.now() - userMessage.createdAt?.getTime()
        }
      });

      // Update flow state
      if (response.flowState) {
        conversation.updateFlowState(response.flowState);
      }

      // Update lead data if provided
      if (response.leadData) {
        conversation.setLeadData(response.leadData);
      }

      // Handle special actions
      if (response.action) {
        await this.handleAction(response.action, conversation, response);
      }

      // Save conversation
      await conversation.save();

      // Update bot analytics
      if (!userInfo.isTest) {
        await this.updateBotAnalytics(conversation, { newMessage: true });
      }

      return {
        id: botMessage.id,
        content: response.content,
        type: response.type || 'text',
        options: response.options,
        metadata: response.metadata,
        conversationId: conversation.conversationId,
        flowState: conversation.flowState
      };

    } catch (error) {
      console.error('Bot runtime error:', error);
      return {
        id: uuidv4(),
        content: this.bot.settings.behavior.fallbackMessage,
        type: 'text',
        error: error.message
      };
    }
  }

  async createNewConversation(sessionId, userInfo) {
    const conversation = new BotConversation({
      conversationId: uuidv4(),
      botId: this.bot._id,
      sessionId,
      user: {
        sessionId,
        ipAddress: userInfo.ipAddress,
        userAgent: userInfo.userAgent,
        referrer: userInfo.referrer,
        location: userInfo.location,
        utm: userInfo.utm,
        customData: userInfo.customData
      },
      isTest: userInfo.isTest || false,
      flowState: {
        currentNode: this.findStartNode()?.id || null,
        variables: {},
        context: {},
        completedNodes: []
      }
    });

    // Add welcome message
    const welcomeMessage = this.bot.settings.appearance.welcomeMessage;
    if (welcomeMessage) {
      conversation.addMessage({
        content: welcomeMessage,
        sender: 'bot',
        type: 'text',
        nodeId: 'welcome'
      });
    }

    await conversation.save();

    // Update bot analytics for new conversation
    if (!userInfo.isTest) {
      await this.updateBotAnalytics(conversation, { newConversation: true });
    }

    return conversation;
  }

  async executeFlow(conversation, userMessage) {
    const currentNode = this.findNodeById(conversation.flowState.currentNode);
    
    if (!currentNode) {
      return {
        content: this.bot.settings.behavior.fallbackMessage,
        type: 'text'
      };
    }

    // Process based on node type
    switch (currentNode.type) {
      case 'message':
        return await this.processMessageNode(currentNode, conversation, userMessage);
      
      case 'question':
        return await this.processQuestionNode(currentNode, conversation, userMessage);
      
      case 'condition':
        return await this.processConditionNode(currentNode, conversation, userMessage);
      
      case 'action':
        return await this.processActionNode(currentNode, conversation, userMessage);
      
      case 'webhook':
        return await this.processWebhookNode(currentNode, conversation, userMessage);
      
      case 'handoff':
        return await this.processHandoffNode(currentNode, conversation, userMessage);
      
      default:
        return {
          content: this.bot.settings.behavior.fallbackMessage,
          type: 'text'
        };
    }
  }

  async processMessageNode(node, conversation, userMessage) {
    let content = node.data.content || '';
    
    // Process variables in content
    content = this.processVariables(content, conversation.flowState.variables);

    // Use AI if content is dynamic or needs enhancement
    if (this.bot.settings.ai.useRAG || content.includes('{{AI_RESPONSE}}')) {
      const aiResponse = await this.generateAIResponse(userMessage, conversation);
      content = content.replace('{{AI_RESPONSE}}', aiResponse);
    }

    // Find next node
    const nextNode = this.findNextNode(node, conversation);

    return {
      content,
      type: 'text',
      nodeId: node.id,
      flowState: {
        currentNode: nextNode?.id || null,
        nextNode: nextNode?.id || null
      }
    };
  }

  async processQuestionNode(node, conversation, userMessage) {
    const options = node.data.options || [];
    let content = node.data.content || '';
    
    // Process variables
    content = this.processVariables(content, conversation.flowState.variables);

    // Check if user provided an answer
    if (conversation.flowState.currentNode === node.id && userMessage) {
      // Store user's answer
      const variableName = node.data.variables?.[0] || `answer_${node.id}`;
      conversation.flowState.variables[variableName] = userMessage;

      // Find next node based on answer
      const nextNode = this.findNextNodeByAnswer(node, userMessage, conversation);
      
      // If it's a follow-up question, continue to next node
      if (nextNode) {
        return await this.executeFlow({
          ...conversation,
          flowState: {
            ...conversation.flowState,
            currentNode: nextNode.id
          }
        }, null);
      }
    }

    return {
      content,
      type: 'question',
      options: options.length > 0 ? options : undefined,
      nodeId: node.id,
      flowState: {
        currentNode: node.id // Stay on this node until answered
      }
    };
  }

  async processConditionNode(node, conversation, userMessage) {
    const conditions = node.data.conditions || [];
    let nextNode = null;

    // Evaluate conditions
    for (const condition of conditions) {
      if (this.evaluateCondition(condition, conversation.flowState.variables, userMessage)) {
        nextNode = this.findNodeById(condition.nextNode);
        break;
      }
    }

    // If no condition matches, find default next node
    if (!nextNode) {
      nextNode = this.findNextNode(node, conversation);
    }

    // Continue to next node
    if (nextNode) {
      return await this.executeFlow({
        ...conversation,
        flowState: {
          ...conversation.flowState,
          currentNode: nextNode.id
        }
      }, userMessage);
    }

    return {
      content: 'I encountered an issue processing your request.',
      type: 'text',
      nodeId: node.id
    };
  }

  async processActionNode(node, conversation, userMessage) {
    const actionType = node.data.actionType || 'custom';
    let content = node.data.content || 'Action completed.';

    // Process different action types
    switch (actionType) {
      case 'collect_email':
        if (this.isValidEmail(userMessage)) {
          conversation.flowState.variables.email = userMessage;
          content = 'Thank you! I\'ve saved your email address.';
        } else {
          content = 'Please provide a valid email address.';
          // Stay on current node
          return {
            content,
            type: 'text',
            nodeId: node.id,
            flowState: { currentNode: node.id }
          };
        }
        break;

      case 'collect_phone':
        if (this.isValidPhone(userMessage)) {
          conversation.flowState.variables.phone = userMessage;
          content = 'Thank you! I\'ve saved your phone number.';
        } else {
          content = 'Please provide a valid phone number.';
          return {
            content,
            type: 'text',
            nodeId: node.id,
            flowState: { currentNode: node.id }
          };
        }
        break;

      case 'save_lead':
        const leadData = this.extractLeadData(conversation.flowState.variables);
        return {
          content,
          type: 'text',
          nodeId: node.id,
          leadData,
          action: 'save_lead',
          flowState: {
            currentNode: this.findNextNode(node, conversation)?.id || null
          }
        };
    }

    const nextNode = this.findNextNode(node, conversation);

    return {
      content: this.processVariables(content, conversation.flowState.variables),
      type: 'text',
      nodeId: node.id,
      flowState: {
        currentNode: nextNode?.id || null
      }
    };
  }

  async processWebhookNode(node, conversation, userMessage) {
    try {
      const webhookData = node.data.webhook;
      if (!webhookData?.url) {
        throw new Error('Webhook URL not configured');
      }

      // Prepare webhook payload
      const payload = {
        botId: this.bot._id,
        conversationId: conversation.conversationId,
        sessionId: conversation.sessionId,
        userMessage,
        variables: conversation.flowState.variables,
        timestamp: new Date().toISOString()
      };

      // Make webhook request
      const response = await axios({
        method: webhookData.method || 'POST',
        url: webhookData.url,
        data: webhookData.method === 'GET' ? undefined : payload,
        params: webhookData.method === 'GET' ? payload : undefined,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ChatBot-Webhook/1.0',
          ...webhookData.headers
        },
        timeout: 10000
      });

      // Process webhook response
      let content = 'Request processed successfully.';
      let variables = {};

      if (response.data) {
        if (typeof response.data === 'string') {
          content = response.data;
        } else if (response.data.message) {
          content = response.data.message;
        }

        if (response.data.variables) {
          variables = response.data.variables;
        }
      }

      const nextNode = this.findNextNode(node, conversation);

      return {
        content: this.processVariables(content, conversation.flowState.variables),
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null,
          variables: { ...conversation.flowState.variables, ...variables }
        },
        metadata: {
          webhookResponse: response.data,
          webhookStatus: response.status
        }
      };

    } catch (error) {
      console.error('Webhook error:', error);
      
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'I encountered an issue processing your request. Please try again.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        },
        metadata: {
          webhookError: error.message
        }
      };
    }
  }

  async processHandoffNode(node, conversation, userMessage) {
    const reason = node.data.reason || 'User requested human assistance';
    
    // Mark conversation for handoff
    conversation.requestHandoff(reason);
    
    let content = node.data.content || 
      'I\'m connecting you with a human agent who can better assist you. Please wait a moment.';

    return {
      content: this.processVariables(content, conversation.flowState.variables),
      type: 'text',
      nodeId: node.id,
      action: 'handoff',
      flowState: {
        currentNode: null, // End flow
        isCompleted: true
      },
      metadata: {
        handoffReason: reason
      }
    };
  }

  async generateAIResponse(userMessage, conversation) {
    try {
      if (!this.openaiClient) {
        return 'I apologize, but AI responses are not available at the moment.';
      }

      let context = '';
      let searchResults = [];

      // Use RAG if enabled
      if (this.bot.settings.ai.useRAG) {
        searchResults = await this.searchKnowledgeBase(userMessage);
        if (searchResults.length > 0) {
          context = searchResults.map((result, index) => 
            `Document ${index + 1} (${result.document.name}):\n${result.chunk.content}`
          ).join('\n\n');
        }
      }

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context, conversation);

      const completion = await this.openaiClient.chat.completions.create({
        model: this.bot.settings.ai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: this.bot.settings.ai.temperature,
        max_tokens: this.bot.settings.ai.maxTokens
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('AI response error:', error);
      return 'I apologize, but I\'m having trouble processing your request right now.';
    }
  }

  buildSystemPrompt(context, conversation) {
    const bot = this.bot;
    const personality = bot.settings.personality;
    const variables = conversation.flowState.variables;

    let prompt = `You are ${bot.settings.appearance.name || bot.name}, a ${personality.tone} and ${personality.style} AI assistant.

Your role: ${bot.type.replace('_', ' ')} bot.
Personality: Be ${personality.tone} and ${personality.style} in your responses.

Current conversation context:
- User variables collected: ${JSON.stringify(variables, null, 2)}
- Current flow position: ${conversation.flowState.currentNode}

${context ? `Knowledge Base Context:\n${context}\n` : ''}

Instructions:
1. Stay in character as defined by your personality settings
2. Use the conversation context to provide personalized responses
3. If using knowledge base context, base your answer on that information
4. Keep responses concise and helpful
5. Guide the conversation toward the bot's objectives (${bot.type})

Response language: ${personality.language || 'en'}`;

    return prompt;
  }

  async searchKnowledgeBase(query) {
    try {
      const documents = await Document.find(
        { 
          $text: { $search: query },
          status: 'indexed'
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(this.bot.settings.ai.ragSettings.topK || 5);

      const results = [];
      for (const doc of documents) {
        const matchingChunks = doc.chunks.filter(chunk => {
          const chunkContent = chunk.content.toLowerCase();
          const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
          return chunkContent.includes(query.toLowerCase()) || 
                 searchTerms.some(term => chunkContent.includes(term));
        }).slice(0, 2);

        for (const chunk of matchingChunks) {
          results.push({
            chunk: {
              id: chunk.id,
              content: chunk.content,
              metadata: {
                ...chunk.metadata,
                source: doc.name
              }
            },
            score: Math.random() * 0.3 + 0.7,
            document: {
              id: doc._id,
              name: doc.name,
              type: doc.type
            }
          });
        }
      }

      return results.slice(0, this.bot.settings.ai.ragSettings.topK || 5);
    } catch (error) {
      console.error('Knowledge base search error:', error);
      return [];
    }
  }

  // Helper methods
  findStartNode() {
    return this.bot.flow.nodes.find(node => 
      node.type === 'message' || 
      node.id === 'start' || 
      node.data.isStart
    );
  }

  findNodeById(nodeId) {
    return this.bot.flow.nodes.find(node => node.id === nodeId);
  }

  findNextNode(currentNode, conversation) {
    const connections = this.bot.flow.connections.filter(conn => 
      conn.source === currentNode.id
    );

    if (connections.length === 0) return null;

    // If multiple connections, evaluate conditions
    for (const connection of connections) {
      if (!connection.condition) {
        return this.findNodeById(connection.target);
      }
      
      if (this.evaluateCondition(
        { field: 'userInput', operator: 'contains', value: connection.condition },
        conversation.flowState.variables,
        conversation.messages[conversation.messages.length - 1]?.content
      )) {
        return this.findNodeById(connection.target);
      }
    }

    // Return first connection if no conditions match
    return this.findNodeById(connections[0].target);
  }

  findNextNodeByAnswer(questionNode, answer, conversation) {
    const connections = this.bot.flow.connections.filter(conn => 
      conn.source === questionNode.id
    );

    // Find connection based on answer
    for (const connection of connections) {
      if (connection.label && answer.toLowerCase().includes(connection.label.toLowerCase())) {
        return this.findNodeById(connection.target);
      }
    }

    // Default to first connection
    return connections.length > 0 ? this.findNodeById(connections[0].target) : null;
  }

  evaluateCondition(condition, variables, userInput) {
    let value = variables[condition.field] || userInput || '';
    
    if (typeof value === 'string') {
      value = value.toLowerCase();
    }
    
    const conditionValue = condition.value.toLowerCase();

    switch (condition.operator) {
      case 'equals':
        return value === conditionValue;
      case 'contains':
        return value.includes(conditionValue);
      case 'greater':
        return parseFloat(value) > parseFloat(conditionValue);
      case 'less':
        return parseFloat(value) < parseFloat(conditionValue);
      default:
        return false;
    }
  }

  processVariables(content, variables) {
    let processedContent = content;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, variables[key] || '');
    });

    return processedContent;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  extractLeadData(variables) {
    return {
      name: variables.name || variables.fullName,
      email: variables.email,
      phone: variables.phone || variables.phoneNumber,
      company: variables.company || variables.companyName,
      jobTitle: variables.jobTitle || variables.position,
      requirements: variables.requirements || variables.needs,
      budget: variables.budget,
      timeline: variables.timeline,
      source: 'chatbot'
    };
  }

  async handleAction(action, conversation, response) {
    try {
      switch (action) {
        case 'save_lead':
          // Additional lead processing logic here
          console.log('Lead saved:', response.leadData);
          break;
        
        case 'handoff':
          // Trigger notifications, integrations, etc.
          await this.triggerHandoffNotifications(conversation);
          break;
      }
    } catch (error) {
      console.error('Action handler error:', error);
    }
  }

  async triggerHandoffNotifications(conversation) {
    // Implementation for handoff notifications
    // Could include email, Slack, webhook notifications
    console.log('Handoff requested for conversation:', conversation.conversationId);
  }

  async updateBotAnalytics(conversation, data) {
    try {
      const bot = await require('../models/Bot').findById(this.bot._id);
      if (bot) {
        bot.updateAnalytics(data);
        await bot.save();
      }
    } catch (error) {
      console.error('Analytics update error:', error);
    }
  }
}

module.exports = BotRuntime;
