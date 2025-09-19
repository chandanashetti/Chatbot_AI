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

      // Detect intent for user message
      let intentData = {};
      try {
        const IntentCategorizer = require('./intentCategorizer');
        const intentCategorizer = new IntentCategorizer();
        const intentResult = await intentCategorizer.detectChatIntent(message);

        intentData = {
          intent: intentResult.intent,
          confidence: intentResult.confidence,
          category: intentResult.category
        };

        console.log(`🤖 Intent detected for message: ${intentResult.intent} (${Math.round(intentResult.confidence * 100)}%)`);
      } catch (error) {
        console.warn('Intent detection failed:', error.message);
      }

      // Add user message to conversation
      const userMessage = conversation.addMessage({
        content: message,
        sender: 'user',
        metadata: {
          timestamp: new Date(),
          userAgent: userInfo.userAgent,
          ipAddress: userInfo.ipAddress,
          ...intentData
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
      // Basic nodes
      case 'message':
        return await this.processMessageNode(currentNode, conversation, userMessage);
      case 'question':
        return await this.processQuestionNode(currentNode, conversation, userMessage);
      case 'quick_replies':
        return await this.processQuickRepliesNode(currentNode, conversation, userMessage);
      case 'input':
        return await this.processInputNode(currentNode, conversation, userMessage);
      
      // Logic & flow control
      case 'condition':
        return await this.processConditionNode(currentNode, conversation, userMessage);
      case 'random':
        return await this.processRandomNode(currentNode, conversation, userMessage);
      case 'delay':
        return await this.processDelayNode(currentNode, conversation, userMessage);
      
      // Actions & processing
      case 'action':
        return await this.processActionNode(currentNode, conversation, userMessage);
      case 'variable':
        return await this.processVariableNode(currentNode, conversation, userMessage);
      case 'validation':
        return await this.processValidationNode(currentNode, conversation, userMessage);
      
      // AI & intelligence
      case 'ai_response':
        return await this.processAIResponseNode(currentNode, conversation, userMessage);
      case 'intent_recognition':
        return await this.processIntentRecognitionNode(currentNode, conversation, userMessage);
      case 'entity_extraction':
        return await this.processEntityExtractionNode(currentNode, conversation, userMessage);
      case 'sentiment_analysis':
        return await this.processSentimentAnalysisNode(currentNode, conversation, userMessage);
      case 'language_detection':
        return await this.processLanguageDetectionNode(currentNode, conversation, userMessage);
      case 'translation':
        return await this.processTranslationNode(currentNode, conversation, userMessage);
      
      // Media & rich content
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
        return await this.processMediaNode(currentNode, conversation, userMessage);
      
      // Forms & data collection
      case 'email_input':
      case 'phone_input':
      case 'number_input':
      case 'rating':
      case 'date_input':
      case 'time_input':
        return await this.processFormInputNode(currentNode, conversation, userMessage);
      case 'survey':
        return await this.processSurveyNode(currentNode, conversation, userMessage);
      case 'location':
        return await this.processLocationNode(currentNode, conversation, userMessage);
      case 'qr_code':
        return await this.processQRCodeNode(currentNode, conversation, userMessage);
      
      // Integrations
      case 'webhook':
        return await this.processWebhookNode(currentNode, conversation, userMessage);
      
      // Analytics & tracking
      case 'analytics_event':
        return await this.processAnalyticsEventNode(currentNode, conversation, userMessage);
      
      // Advanced features
      case 'handoff':
        return await this.processHandoffNode(currentNode, conversation, userMessage);
      
      default:
        return {
          content: this.bot.settings.behavior.fallbackMessage || 'I\'m not sure how to handle that. Can you rephrase?',
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
      let hasRelevantData = false;

      // GUARD RAIL 1: Use RAG (uploaded documents) if enabled
      if (this.bot.settings.ai.useRAG) {
        console.log('🔍 Searching Knowledge Base for:', userMessage);

        // Enhanced search query: include conversation context for follow-up questions
        let searchQuery = userMessage;
        if (conversation.messages && conversation.messages.length > 0) {
          const lastFewMessages = conversation.messages.slice(-3).map(m => m.content).join(' ');
          // If current message is short and might be a follow-up, include previous context
          if (userMessage.length < 50 && (userMessage.toLowerCase().includes('address') ||
              userMessage.toLowerCase().includes('location') || userMessage.toLowerCase().includes('where'))) {
            searchQuery = lastFewMessages + ' ' + userMessage;
            console.log('🔍 Enhanced search query with context:', searchQuery);
          }
        }

        searchResults = await this.searchKnowledgeBase(searchQuery);
        console.log('📚 KB Search Results:', searchResults.length, 'documents found');
        if (searchResults.length > 0) {
          const kbContext = searchResults.map((result, index) =>
            `Document ${index + 1} (${result.document.name}):\n${result.chunk.content}`
          ).join('\n\n');
          context += (context ? '\n\n' : '') + kbContext;
          hasRelevantData = true;
          console.log('✅ KB context added, length:', kbContext.length);
        }
      }

      // GUARD RAIL 2: Use web scraping data if enabled (can be used alongside KB)
      if (this.bot.settings.webScraping?.enabled) {
        console.log('🌐 Searching Web Scraping Data for:', userMessage);
        const webScrapingResults = await this.searchWebScrapingData(userMessage);
        console.log('🕷️ Web Scraping Results:', webScrapingResults.length, 'pages found');
        if (webScrapingResults.length > 0) {
          const webContext = webScrapingResults.map((result, index) =>
            `Web Content ${index + 1} (${result.source}):\n${result.content}`
          ).join('\n\n');
          context += (context ? '\n\n' : '') + webContext;
          hasRelevantData = true;
          console.log('✅ Web context added, length:', webContext.length);
        }
      }

      // GUARD RAIL 3: If no relevant data found, use predefined fallback responses
      if (!hasRelevantData) {
        console.log('❌ No relevant data found, using fallback response');
        return this.getFallbackResponse(userMessage);
      }

      console.log('📝 Total context length:', context.length, 'characters');
      console.log('🎯 hasRelevantData:', hasRelevantData);

      // GUARD RAIL 4: Build system prompt with strict instructions
      const systemPrompt = this.buildGuardedSystemPrompt(context, conversation);

      // Build conversation history for context
      const conversationMessages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add recent conversation history (last 10 messages to avoid token limits)
      if (conversation.messages && conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(-10);
        for (const msg of recentMessages) {
          if (msg.sender === 'user') {
            conversationMessages.push({ role: 'user', content: msg.content });
          } else if (msg.sender === 'bot') {
            conversationMessages.push({ role: 'assistant', content: msg.content });
          }
        }
      }

      // Add current user message
      conversationMessages.push({ role: 'user', content: userMessage });

      console.log('💬 Sending', conversationMessages.length, 'messages to OpenAI (including', conversationMessages.length - 2, 'history messages)');

      const completion = await this.openaiClient.chat.completions.create({
        model: this.bot.settings.ai.model,
        messages: conversationMessages,
        temperature: this.bot.settings.ai.temperature,
        max_tokens: this.bot.settings.ai.maxTokens
      });

      let response = completion.choices[0].message.content;

      // GUARD RAIL 5: Validate response doesn't contain internet references
      if (this.containsInternetReferences(response)) {
        return this.getFallbackResponse(userMessage);
      }

      // CRITICAL FIX: Post-process response to ensure first-person company representation
      response = this.enforceFirstPersonResponse(response);

      return response;

    } catch (error) {
      console.error('AI response error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  buildSystemPrompt(context, conversation) {
    const bot = this.bot;
    const personality = bot.settings.personality;
    const variables = conversation.flowState.variables;

    let prompt = `You are ${bot.settings.appearance.name || bot.name}, a ${personality.tone} and ${personality.style} AI assistant representing our company directly.

CRITICAL IDENTITY RULES:
1. You represent the company/organization directly - use "we", "us", "our" when referring to the company
2. Speak as an official representative, not as an external observer
3. When providing company information (address, contact, services), say "our address", "you can reach us", "our services"
4. NEVER refer to the company in third person ("they", "them", "their company")

Your role: ${bot.type.replace('_', ' ')} bot representing our organization.
Personality: Be ${personality.tone} and ${personality.style} in your responses while maintaining professional company representation.

Current conversation context:
- User variables collected: ${JSON.stringify(variables, null, 2)}
- Current flow position: ${conversation.flowState.currentNode}

${context ? `Knowledge Base Context:\n${context}\n` : ''}

Instructions:
1. Stay in character as defined by your personality settings
2. ALWAYS represent the company in first person (we/us/our)
3. Use the conversation context to provide personalized responses
4. If using knowledge base context, base your answer on that information
5. Keep responses concise and helpful
6. Guide the conversation toward the bot's objectives (${bot.type})
7. When providing contact information, say "You can reach us at..." not "You can reach them at..."
8. NEVER start responses with phrases like "Based on the information from the knowledge base documents" or "According to the documents provided" - respond naturally and directly

Response language: ${personality.language || 'en'}`;

    return prompt;
  }

  buildGuardedSystemPrompt(context, conversation) {
    const bot = this.bot;
    const personality = bot.settings.personality;
    const variables = conversation.flowState.variables;

    let prompt = `You are ${bot.settings.appearance.name || bot.name}, a ${personality.tone} and ${personality.style} AI assistant. YOU ARE AN EMPLOYEE AND OFFICIAL REPRESENTATIVE OF AMARIN/THIS COMPANY.

MANDATORY IDENTITY RULES - VIOLATION WILL RESULT IN RESPONSE REJECTION:
1. You are an employee of this company - ALWAYS use "we", "us", "our" when referring to the company
2. NEVER use "they", "them", "their" when talking about the company - you work FOR the company
3. When providing company information: "our address", "you can reach us", "our contact number", "our services"
4. You are NOT an external chatbot talking ABOUT the company - you ARE the company talking to customers
5. Replace ANY third-person company references with first-person immediately

CRITICAL RESTRICTIONS - YOU MUST FOLLOW THESE RULES:
1. ONLY use the provided context data (documents and web content) to answer questions
2. NEVER access the internet or external sources in real-time
3. NEVER make up information not in the provided context
4. If the answer is not in the provided context, say "I don't have that information available at the moment"
5. NEVER provide URLs, links, or suggest searching the internet
6. NEVER give general knowledge answers unless specifically in the context
7. PAY ATTENTION to conversation history - if user asks follow-up questions like "what's the address?" after discussing a company, use context from previous messages to understand what they're referring to
8. NEVER start responses with phrases like "Based on the information from the knowledge base documents" or "According to the documents provided" - respond naturally and directly

Your role: ${bot.type.replace('_', ' ')} bot representing our organization.
Personality: Be ${personality.tone} and ${personality.style} in your responses while maintaining professional company representation.

Current conversation context:
- User variables collected: ${JSON.stringify(variables, null, 2)}
- Current flow position: ${conversation.flowState.currentNode}

${context ? `AUTHORIZED KNOWLEDGE BASE AND WEB CONTENT:\n${context}\n` : ''}

Instructions:
1. Stay in character as defined by your personality settings
2. ALWAYS represent the company in first person (we/us/our)
3. ONLY use the provided context data to answer questions
4. If the context doesn't contain the answer, politely say you don't have that information available
5. Keep responses concise and helpful
6. Guide the conversation toward the bot's objectives (${bot.type})
7. NEVER suggest external sources or internet searches
8. When providing contact information, say "You can reach us at..." not "You can reach them at..."

Response language: ${personality.language || 'en'}`;

    return prompt;
  }

  async searchKnowledgeBase(query) {
    try {
      console.log(`🔍 RAG Search: "${query}"`);

      // Enhanced query expansion for contact information
      let expandedQuery = query;
      const contactKeywords = ['contact', 'phone', 'telephone', 'tel', 'number', 'call', 'reach'];
      const isContactQuery = contactKeywords.some(keyword =>
        query.toLowerCase().includes(keyword)
      );

      if (isContactQuery) {
        expandedQuery = query + ' contact phone telephone number tel address details';
        console.log(`📞 Enhanced contact query: "${expandedQuery}"`);
      }

      // Try text search first
      let documents = await Document.find(
        {
          $text: { $search: expandedQuery },
          status: 'indexed'
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(this.bot.settings.ai.ragSettings.topK || 5);

      console.log(`📚 Text search found: ${documents.length} documents`);

      // If no results from text search, try regex search for contact queries
      if (documents.length === 0 && isContactQuery) {
        console.log(`🔄 Fallback: Trying regex search for contact info...`);
        documents = await Document.find({
          status: 'indexed',
          $or: [
            { textContent: { $regex: /contact|phone|tel|number/i } },
            { name: { $regex: /contact|phone|directory/i } }
          ]
        }).limit(this.bot.settings.ai.ragSettings.topK || 5);

        console.log(`📱 Regex search found: ${documents.length} documents`);
      }

      // If still no results, try searching by company name mentioned in query
      if (documents.length === 0) {
        const companyNames = this.extractCompanyNames(query);
        if (companyNames.length > 0) {
          console.log(`🏢 Searching by company names: ${companyNames.join(', ')}`);
          documents = await Document.find({
            status: 'indexed',
            $or: companyNames.map(name => ({
              textContent: { $regex: new RegExp(name, 'i') }
            }))
          }).limit(this.bot.settings.ai.ragSettings.topK || 5);

          console.log(`🏢 Company search found: ${documents.length} documents`);
        }
      }

      const results = [];
      for (const doc of documents) {
        // Enhanced chunk filtering for contact information
        const matchingChunks = doc.chunks.filter(chunk => {
          const chunkContent = chunk.content.toLowerCase();
          const searchTerms = expandedQuery.toLowerCase().split(' ').filter(term => term.length > 2);

          // For contact queries, look for specific patterns
          if (isContactQuery) {
            const hasContactInfo = /(?:tel|phone|contact|call|number|address).*[\d\-\(\)\s]{7,}/i.test(chunk.content) ||
                                  /(?:address|location|office).*[\w\s,]+/i.test(chunk.content);
            if (hasContactInfo) {
              console.log(`📞 Found contact info in chunk: ${chunk.content.substring(0, 100)}...`);
              return true;
            }
          }

          // Standard keyword matching
          return chunkContent.includes(query.toLowerCase()) ||
                 searchTerms.some(term => chunkContent.includes(term));
        }).slice(0, 3); // Increased from 2 to 3 for contact info

        for (const chunk of matchingChunks) {
          results.push({
            chunk: {
              id: chunk.id,
              content: chunk.content,
              metadata: {
                ...chunk.metadata,
                source: doc.name,
                isContactInfo: isContactQuery
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

      console.log(`✅ RAG Search Results: ${results.length} chunks found`);
      return results.slice(0, this.bot.settings.ai.ragSettings.topK || 5);
    } catch (error) {
      console.error('Knowledge base search error:', error);
      return [];
    }
  }

  // Helper method to extract company names from queries
  extractCompanyNames(query) {
    const companyPatterns = [
      /(?:amarin|book center|bookstore)/gi,
      /(?:company|corp|corporation|ltd|limited|inc)/gi
    ];

    const matches = [];
    companyPatterns.forEach(pattern => {
      const found = query.match(pattern);
      if (found) {
        matches.push(...found.map(m => m.trim()));
      }
    });

    return [...new Set(matches)]; // Remove duplicates
  }

  async searchWebScrapingData(query) {
    try {
      const ScrapedContent = require('../models/ScrapedContent');
      
      const scrapedContent = await ScrapedContent.find(
        {
          $text: { $search: query },
          status: 'success'
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(5);

      const results = [];
      for (const content of scrapedContent) {
        // Check if content matches the query
        const contentText = content.content.toLowerCase();
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
        
        if (contentText.includes(query.toLowerCase()) || 
            searchTerms.some(term => contentText.includes(term))) {
          results.push({
            content: content.content.substring(0, 1000), // Limit content length
            source: content.url,
            title: content.title || content.url,
            score: Math.random() * 0.3 + 0.7
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Web scraping search error:', error);
      return [];
    }
  }

  getFallbackResponse(userMessage) {
    const fallbackResponses = [
      "I don't have that information available at the moment. Could you please rephrase your question or ask about something else we can help with?",
      "I'm sorry, but I don't have access to that information. Is there something else we can assist you with?",
      "That's not something I have information about right now. Let me know if you have any other questions about our services!",
      "I don't have that information available currently. Could you try asking about something else we offer?",
      "I'm not able to provide information on that topic at the moment. Is there anything else we can help you with?"
    ];

    // Simple keyword matching for common questions - with company representation
    const message = userMessage.toLowerCase();

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! How can we help you today?";
    }

    if (message.includes('thank') || message.includes('thanks')) {
      return "You're welcome! Is there anything else we can help you with?";
    }

    if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
      return "Goodbye! Thank you for contacting us. Have a great day!";
    }

    if (message.includes('help') || message.includes('what can you do')) {
      return "We can help answer questions about our services and company. What would you like to know?";
    }

    // Return random fallback response
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  // CRITICAL FIX: Enforce first-person company representation
  enforceFirstPersonResponse(response) {
    if (!response) return response;

    let fixedResponse = response;

    // Replace third-person company references with first-person
    const thirdPersonFixes = [
      // Basic pronouns
      { pattern: /\btheir\s+(contact|phone|number|address|office|store|service|website|email|location)/gi, replacement: 'our $1' },
      { pattern: /\btheir\s+(bookstore|company|business|organization|headquarters)/gi, replacement: 'our $1' },
      { pattern: /\bthey\s+(offer|provide|have|are|operate|run|specialize)/gi, replacement: 'we $1' },
      { pattern: /\bthem\s+(at|for|about)/gi, replacement: 'us $1' },

      // Company-specific fixes
      { pattern: /\bAmarin's\s+(contact|phone|number|address|office|store|service)/gi, replacement: 'our $1' },
      { pattern: /\bAmarin\s+(offers|provides|has|operates|runs|specializes)/gi, replacement: 'We $1' },
      { pattern: /\bthe\s+company's\s+(contact|phone|number|address|office|store)/gi, replacement: 'our $1' },
      { pattern: /\bthe\s+company\s+(offers|provides|has|operates|runs|specializes)/gi, replacement: 'we $1' },

      // Contact-specific fixes
      { pattern: /you can reach them at/gi, replacement: 'you can reach us at' },
      { pattern: /contact them at/gi, replacement: 'contact us at' },
      { pattern: /reach out to them/gi, replacement: 'reach out to us' },
      { pattern: /call them at/gi, replacement: 'call us at' },

      // Business operation fixes
      { pattern: /they are located at/gi, replacement: 'we are located at' },
      { pattern: /their location is/gi, replacement: 'our location is' },
      { pattern: /their address is/gi, replacement: 'our address is' },
      { pattern: /their main office/gi, replacement: 'our main office' },
      { pattern: /their headquarters/gi, replacement: 'our headquarters' },

      // Service fixes
      { pattern: /their services include/gi, replacement: 'our services include' },
      { pattern: /they offer services/gi, replacement: 'we offer services' },
      { pattern: /their bookstore/gi, replacement: 'our bookstore' },
      { pattern: /their business/gi, replacement: 'our business' },

      // Generic company references
      { pattern: /if you are looking for their/gi, replacement: 'if you are looking for our' },
      { pattern: /about their company/gi, replacement: 'about our company' },
      { pattern: /visit their website/gi, replacement: 'visit our website' }
    ];

    // Apply all fixes
    thirdPersonFixes.forEach(fix => {
      fixedResponse = fixedResponse.replace(fix.pattern, fix.replacement);
    });

    // Additional check for missed third-person references
    if (this.containsThirdPersonReferences(fixedResponse)) {
      console.warn('⚠️ Third-person references still detected after fixes:', fixedResponse);
    }

    return fixedResponse;
  }

  // Check if response still contains third-person references
  containsThirdPersonReferences(response) {
    const thirdPersonPatterns = [
      /\btheir\s+(contact|phone|number|address|office|store|service|website|email|location|bookstore|company|business)/i,
      /\bthey\s+(offer|provide|have|are|operate|run|specialize)/i,
      /you can reach them at/i,
      /contact them at/i,
      /their address is/i,
      /their location/i
    ];

    return thirdPersonPatterns.some(pattern => pattern.test(response));
  }

  containsInternetReferences(response) {
    const internetKeywords = [
      'search the internet',
      'google it',
      'look it up online',
      'check the web',
      'browse the internet',
      'visit this website',
      'go to this link',
      'http://',
      'https://',
      'www.',
      '.com',
      '.org',
      '.net',
      'as of my last update',
      'my training data',
      'i was trained',
      'in my training',
      'according to my knowledge',
      'based on my training'
    ];

    const responseLower = response.toLowerCase();
    return internetKeywords.some(keyword => responseLower.includes(keyword));
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

  isValidDate(dateString) {
    // Support multiple date formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or D/M/YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];

    const isFormatValid = dateFormats.some(format => format.test(dateString));
    if (!isFormatValid) return false;

    // Try to parse the date
    let date;
    if (dateString.includes('-')) {
      date = new Date(dateString);
    } else if (dateString.includes('/')) {
      // Handle different slash formats
      date = new Date(dateString);
    }

    return date instanceof Date && !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
  }

  isValidTime(timeString) {
    // Support multiple time formats: HH:MM, HH:MM:SS, 12-hour format with AM/PM
    const timeFormats = [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM (24-hour)
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, // HH:MM:SS (24-hour)
      /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM)$/i, // HH:MM AM/PM
      /^(1[0-2]|0?[1-9]):[0-5][0-9]:[0-5][0-9]\s?(AM|PM)$/i, // HH:MM:SS AM/PM
    ];

    return timeFormats.some(format => format.test(timeString.trim()));
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

  // New node processors for advanced functionality

  async processQuickRepliesNode(node, conversation, userMessage) {
    let content = node.data.content || 'Please choose an option:';
    content = this.processVariables(content, conversation.flowState.variables);

    const buttons = node.data.buttons || [];
    const nextNode = this.findNextNode(node, conversation);

    return {
      content,
      type: 'quick_replies',
      options: buttons.map(btn => btn.title),
      nodeId: node.id,
      flowState: {
        currentNode: nextNode?.id || null
      }
    };
  }

  async processInputNode(node, conversation, userMessage) {
    const validation = node.data.validation || {};
    
    if (conversation.flowState.currentNode === node.id && userMessage) {
      // Validate input if validation is configured
      if (validation.type && validation.type !== 'none') {
        const isValid = this.validateInput(userMessage, validation);
        if (!isValid) {
          return {
            content: validation.message || 'Please provide a valid input.',
            type: 'text',
            nodeId: node.id,
            flowState: { currentNode: node.id } // Stay on current node
          };
        }
      }

      // Store the input
      const variableName = node.data.variableName || `input_${node.id}`;
      conversation.flowState.variables[variableName] = userMessage;

      // Move to next node
      const nextNode = this.findNextNode(node, conversation);
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

    // Show input prompt
    let content = node.data.content || 'Please provide your input:';
    content = this.processVariables(content, conversation.flowState.variables);

    return {
      content,
      type: 'input',
      nodeId: node.id,
      flowState: { currentNode: node.id }
    };
  }

  async processRandomNode(node, conversation, userMessage) {
    const connections = this.bot.flow.connections.filter(conn => conn.source === node.id);
    
    if (connections.length > 0) {
      const randomConnection = connections[Math.floor(Math.random() * connections.length)];
      const nextNode = this.findNodeById(randomConnection.target);
      
      if (nextNode) {
        return await this.executeFlow({
          ...conversation,
          flowState: {
            ...conversation.flowState,
            currentNode: nextNode.id
          }
        }, userMessage);
      }
    }

    return {
      content: 'Random selection could not be made.',
      type: 'text',
      nodeId: node.id
    };
  }

  async processDelayNode(node, conversation, userMessage) {
    const delayDuration = (node.data.delayDuration || 3) * 1000; // Convert to milliseconds
    
    // Simulate delay (in real implementation, you might use a job queue)
    setTimeout(async () => {
      const nextNode = this.findNextNode(node, conversation);
      if (nextNode) {
        // In a real implementation, you'd need to continue the flow after delay
        // This is a simplified version
        console.log(`Continuing flow after ${delayDuration}ms delay to node ${nextNode.id}`);
      }
    }, delayDuration);

    const nextNode = this.findNextNode(node, conversation);
    
    return {
      content: node.data.content || `Processing... (${node.data.delayDuration || 3}s)`,
      type: 'text',
      nodeId: node.id,
      flowState: {
        currentNode: nextNode?.id || null
      },
      metadata: {
        delayDuration: delayDuration
      }
    };
  }

  async processVariableNode(node, conversation, userMessage) {
    const variableName = node.data.variableName;
    const variableValue = node.data.variableValue;

    if (variableName) {
      // Process variable value (might contain other variables)
      const processedValue = this.processVariables(variableValue || '', conversation.flowState.variables);
      conversation.flowState.variables[variableName] = processedValue;
    }

    const nextNode = this.findNextNode(node, conversation);
    let content = node.data.content || `Variable ${variableName} set to ${variableValue}`;
    content = this.processVariables(content, conversation.flowState.variables);

    return {
      content,
      type: 'text',
      nodeId: node.id,
      flowState: {
        currentNode: nextNode?.id || null,
        variables: conversation.flowState.variables
      }
    };
  }

  async processValidationNode(node, conversation, userMessage) {
    const validation = node.data.validation || {};
    
    if (userMessage) {
      const isValid = this.validateInput(userMessage, validation);
      
      // Store validation result
      conversation.flowState.variables[`${node.id}_valid`] = isValid;
      
      if (isValid) {
        conversation.flowState.variables[`${node.id}_value`] = userMessage;
      }

      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: isValid ? 
          (node.data.successMessage || 'Input is valid!') : 
          (node.data.errorMessage || validation.message || 'Invalid input provided.'),
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        },
        metadata: {
          validationResult: isValid,
          validatedValue: isValid ? userMessage : null
        }
      };
    }

    return {
      content: node.data.content || 'Please provide input for validation:',
      type: 'text',
      nodeId: node.id,
      flowState: { currentNode: node.id }
    };
  }

  async processAIResponseNode(node, conversation, userMessage) {
    try {
      if (!this.openaiClient) {
        return {
          content: 'AI response is not available at the moment.',
          type: 'text',
          nodeId: node.id
        };
      }

      // Get context from KB and web scraping - SAME AS generateAIResponse
      let context = '';
      let searchResults = [];
      let hasRelevantData = false;

      console.log('🤖 AI Response Node - Settings check:');
      console.log('   RAG enabled:', this.bot.settings.ai.useRAG);
      console.log('   Web scraping enabled:', this.bot.settings.webScraping?.enabled);

      // GUARD RAIL 1: Use RAG (uploaded documents) if enabled
      if (this.bot.settings.ai.useRAG) {
        console.log('🔍 [AI Node] Searching Knowledge Base for:', userMessage || 'Hello');
        searchResults = await this.searchKnowledgeBase(userMessage || 'Hello');
        console.log('📚 [AI Node] KB Search Results:', searchResults.length, 'documents found');
        if (searchResults.length > 0) {
          const kbContext = searchResults.map((result, index) =>
            `Document ${index + 1} (${result.document.name}):\n${result.chunk.content}`
          ).join('\n\n');
          context += (context ? '\n\n' : '') + kbContext;
          hasRelevantData = true;
          console.log('✅ [AI Node] KB context added, length:', kbContext.length);
        }
      }

      // GUARD RAIL 2: Use web scraping data if enabled (can be used alongside KB)
      if (this.bot.settings.webScraping?.enabled) {
        console.log('🌐 [AI Node] Searching Web Scraping Data for:', userMessage || 'Hello');
        const webScrapingResults = await this.searchWebScrapingData(userMessage || 'Hello');
        console.log('🕷️ [AI Node] Web Scraping Results:', webScrapingResults.length, 'pages found');
        if (webScrapingResults.length > 0) {
          const webContext = webScrapingResults.map((result, index) =>
            `Web Content ${index + 1} (${result.source}):\n${result.content}`
          ).join('\n\n');
          context += (context ? '\n\n' : '') + webContext;
          hasRelevantData = true;
          console.log('✅ [AI Node] Web context added, length:', webContext.length);
        }
      }

      // GUARD RAIL 3: If no relevant data found, use predefined fallback responses
      if (!hasRelevantData) {
        return {
          content: this.getFallbackResponse(userMessage || 'Hello'),
          type: 'text',
          nodeId: node.id
        };
      }

      // Use custom prompt if provided, otherwise use guarded system prompt with context
      const systemPrompt = node.data.aiPrompt || this.buildGuardedSystemPrompt(context, conversation);
      const model = node.data.aiModel || this.bot.settings.ai.model || 'gpt-3.5-turbo';
      const temperature = node.data.temperature || this.bot.settings.ai.temperature || 0.7;

      // Build conversation history for context
      const conversationMessages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add recent conversation history (last 10 messages to avoid token limits)
      if (conversation.messages && conversation.messages.length > 0) {
        const recentMessages = conversation.messages.slice(-10);
        for (const msg of recentMessages) {
          if (msg.sender === 'user') {
            conversationMessages.push({ role: 'user', content: msg.content });
          } else if (msg.sender === 'bot') {
            conversationMessages.push({ role: 'assistant', content: msg.content });
          }
        }
      }

      // Add current user message
      conversationMessages.push({ role: 'user', content: userMessage || 'Hello' });

      console.log('💬 [AI Node] Sending', conversationMessages.length, 'messages to OpenAI (including', conversationMessages.length - 2, 'history messages)');

      const completion = await this.openaiClient.chat.completions.create({
        model,
        messages: conversationMessages,
        temperature,
        max_tokens: this.bot.settings.ai.maxTokens || 1000
      });

      let aiResponse = completion.choices[0].message.content;

      // GUARD RAIL 5: Validate response doesn't contain internet references
      if (this.containsInternetReferences(aiResponse)) {
        return {
          content: this.getFallbackResponse(userMessage || 'Hello'),
          type: 'text',
          nodeId: node.id
        };
      }

      // CRITICAL FIX: Post-process response to ensure first-person company representation
      aiResponse = this.enforceFirstPersonResponse(aiResponse);

      const nextNode = this.findNextNode(node, conversation);

      return {
        content: aiResponse,
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        },
        metadata: {
          aiModel: model,
          temperature,
          usage: completion.usage
        }
      };

    } catch (error) {
      console.error('AI Response error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'I encountered an issue generating a response. Please try again.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }

  async processMediaNode(node, conversation, userMessage) {
    const mediaUrl = node.data.mediaUrl;
    const mediaType = node.type;
    
    if (!mediaUrl) {
      return {
        content: `${mediaType} content is not configured.`,
        type: 'text',
        nodeId: node.id
      };
    }

    const nextNode = this.findNextNode(node, conversation);
    let content = node.data.content || '';

    return {
      content,
      type: mediaType,
      mediaUrl,
      nodeId: node.id,
      flowState: {
        currentNode: nextNode?.id || null
      }
    };
  }

  async processFormInputNode(node, conversation, userMessage) {
    const inputType = node.type;
    
    if (conversation.flowState.currentNode === node.id && userMessage) {
      let isValid = true;
      let errorMessage = '';

      // Validate based on input type
      switch (inputType) {
        case 'email_input':
          isValid = this.isValidEmail(userMessage);
          errorMessage = 'Please provide a valid email address.';
          break;
        case 'phone_input':
          isValid = this.isValidPhone(userMessage);
          errorMessage = 'Please provide a valid phone number.';
          break;
        case 'number_input':
          isValid = !isNaN(parseFloat(userMessage));
          errorMessage = 'Please provide a valid number.';
          break;
        case 'rating':
          const ratingScale = node.data.ratingScale || 5;
          const rating = parseInt(userMessage);
          isValid = !isNaN(rating) && rating >= 1 && rating <= ratingScale;
          errorMessage = `Please provide a rating between 1 and ${ratingScale}.`;
          break;
        case 'date_input':
          isValid = this.isValidDate(userMessage);
          errorMessage = 'Please provide a valid date (YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY).';
          break;
        case 'time_input':
          isValid = this.isValidTime(userMessage);
          errorMessage = 'Please provide a valid time (HH:MM or HH:MM:SS, 12-hour or 24-hour format).';
          break;
      }

      if (!isValid) {
        return {
          content: errorMessage,
          type: 'text',
          nodeId: node.id,
          flowState: { currentNode: node.id }
        };
      }

      // Store the validated input
      const variableName = inputType === 'email_input' ? 'email' : 
                          inputType === 'phone_input' ? 'phone' :
                          inputType === 'number_input' ? 'number' :
                          inputType === 'rating' ? 'rating' :
                          inputType === 'date_input' ? 'date' :
                          inputType === 'time_input' ? 'time' : `${node.id}_value`;
      
      conversation.flowState.variables[variableName] = userMessage;

      const nextNode = this.findNextNode(node, conversation);
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

    // Show input prompt
    let content = node.data.content || '';
    if (!content) {
      switch (inputType) {
        case 'email_input':
          content = 'Please provide your email address:';
          break;
        case 'phone_input':
          content = 'Please provide your phone number:';
          break;
        case 'number_input':
          content = 'Please provide a number:';
          break;
        case 'rating':
          const scale = node.data.ratingScale || 5;
          content = `Please rate from 1 to ${scale}:`;
          break;
        case 'date_input':
          content = 'Please provide a date (e.g., 2024-03-15, 03/15/2024, or 15/03/2024):';
          break;
        case 'time_input':
          content = 'Please provide a time (e.g., 14:30, 2:30 PM, or 14:30:00):';
          break;
        default:
          content = 'Please provide your input:';
      }
    }

    content = this.processVariables(content, conversation.flowState.variables);

    return {
      content,
      type: inputType,
      nodeId: node.id,
      flowState: { currentNode: node.id },
      metadata: {
        inputType,
        ratingScale: node.data.ratingScale,
        ratingLabels: node.data.ratingLabels
      }
    };
  }

  async processAnalyticsEventNode(node, conversation, userMessage) {
    const eventName = node.data.eventName || `custom_event_${node.id}`;
    const eventProperties = node.data.eventProperties || {};

    // Track the event (in a real implementation, send to analytics service)
    console.log(`Analytics Event: ${eventName}`, {
      ...eventProperties,
      conversationId: conversation.conversationId,
      sessionId: conversation.sessionId,
      nodeId: node.id,
      timestamp: new Date()
    });

    // Store event in conversation metadata
    if (!conversation.metadata) conversation.metadata = {};
    if (!conversation.metadata.events) conversation.metadata.events = [];
    
    conversation.metadata.events.push({
      name: eventName,
      properties: eventProperties,
      timestamp: new Date(),
      nodeId: node.id
    });

    const nextNode = this.findNextNode(node, conversation);
    let content = node.data.content || '';

    return {
      content,
      type: 'text',
      nodeId: node.id,
      flowState: {
        currentNode: nextNode?.id || null
      },
      metadata: {
        eventTracked: eventName
      }
    };
  }

  // Helper method for input validation
  validateInput(input, validation) {
    if (!validation || !validation.type || validation.type === 'none') {
      return true;
    }

    switch (validation.type) {
      case 'email':
        return this.isValidEmail(input);
      case 'phone':
        return this.isValidPhone(input);
      case 'number':
        return !isNaN(parseFloat(input));
      case 'url':
        try {
          new URL(input);
          return true;
        } catch {
          return false;
        }
      case 'regex':
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern);
          return regex.test(input);
        }
        return true;
      default:
        return true;
    }
  }

  // AI & Intelligence Node Processors

  async processIntentRecognitionNode(node, conversation, userMessage) {
    try {
      if (!this.openaiClient || !userMessage) {
        const nextNode = this.findNextNode(node, conversation);
        return {
          content: node.data.content || 'Intent recognition not available.',
          type: 'text',
          nodeId: node.id,
          flowState: {
            currentNode: nextNode?.id || null
          }
        };
      }

      // Use predefined intents or detect dynamically
      const predefinedIntents = node.data.intents || [
        'greeting', 'question', 'request', 'complaint', 'compliment', 
        'booking', 'support', 'information', 'goodbye'
      ];

      const intentPrompt = `Analyze the following message and identify the user's intent. 
      Choose from these possible intents: ${predefinedIntents.join(', ')}.
      If none match exactly, provide the most similar one.
      
      User message: "${userMessage}"
      
      Respond with only the intent name and confidence score (0-1) in JSON format:
      {"intent": "intent_name", "confidence": 0.95}`;

      const completion = await this.openaiClient.chat.completions.create({
        model: node.data.aiModel || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an intent classification system.' },
          { role: 'user', content: intentPrompt }
        ],
        temperature: 0.1,
        max_tokens: 100
      });

      let intentResult = { intent: 'unknown', confidence: 0.0 };
      try {
        intentResult = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error('Intent parsing error:', parseError);
      }

      // Store intent in conversation variables
      conversation.flowState.variables.detected_intent = intentResult.intent;
      conversation.flowState.variables.intent_confidence = intentResult.confidence;

      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: node.data.content || `Intent detected: ${intentResult.intent} (${(intentResult.confidence * 100).toFixed(0)}% confidence)`,
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null,
          variables: conversation.flowState.variables
        },
        metadata: {
          intentResult,
          availableIntents: predefinedIntents
        }
      };

    } catch (error) {
      console.error('Intent recognition error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'Unable to analyze intent at the moment.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }

  async processEntityExtractionNode(node, conversation, userMessage) {
    try {
      if (!this.openaiClient || !userMessage) {
        const nextNode = this.findNextNode(node, conversation);
        return {
          content: node.data.content || 'Entity extraction not available.',
          type: 'text',
          nodeId: node.id,
          flowState: {
            currentNode: nextNode?.id || null
          }
        };
      }

      // Define entity types to extract
      const entityTypes = node.data.entityTypes || [
        'PERSON', 'EMAIL', 'PHONE', 'DATE', 'TIME', 'LOCATION', 'ORGANIZATION', 
        'MONEY', 'NUMBER', 'URL'
      ];

      const entityPrompt = `Extract the following types of entities from the user message: ${entityTypes.join(', ')}.
      
      User message: "${userMessage}"
      
      Return the results in JSON format with entity type, value, and position:
      {"entities": [{"type": "EMAIL", "value": "john@example.com", "start": 10, "end": 25}]}
      If no entities are found, return {"entities": []}.`;

      const completion = await this.openaiClient.chat.completions.create({
        model: node.data.aiModel || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an entity extraction system. Extract structured information from text.' },
          { role: 'user', content: entityPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      let extractedEntities = { entities: [] };
      try {
        extractedEntities = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error('Entity extraction parsing error:', parseError);
      }

      // Store extracted entities in conversation variables
      extractedEntities.entities.forEach(entity => {
        const variableName = `entity_${entity.type.toLowerCase()}`;
        conversation.flowState.variables[variableName] = entity.value;
      });

      conversation.flowState.variables.extracted_entities = extractedEntities.entities;

      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: node.data.content || `Extracted ${extractedEntities.entities.length} entities from your message.`,
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null,
          variables: conversation.flowState.variables
        },
        metadata: {
          extractedEntities: extractedEntities.entities,
          entityTypes
        }
      };

    } catch (error) {
      console.error('Entity extraction error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'Unable to extract entities at the moment.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }

  async processSentimentAnalysisNode(node, conversation, userMessage) {
    try {
      if (!this.openaiClient || !userMessage) {
        const nextNode = this.findNextNode(node, conversation);
        return {
          content: node.data.content || 'Sentiment analysis not available.',
          type: 'text',
          nodeId: node.id,
          flowState: {
            currentNode: nextNode?.id || null
          }
        };
      }

      const sentimentPrompt = `Analyze the sentiment of this message and provide a detailed analysis.
      
      User message: "${userMessage}"
      
      Return the results in JSON format:
      {
        "sentiment": "positive|negative|neutral",
        "confidence": 0.95,
        "emotions": ["joy", "anger", "fear", "sadness", "surprise"],
        "intensity": 0.8,
        "reasoning": "Brief explanation of the sentiment analysis"
      }`;

      const completion = await this.openaiClient.chat.completions.create({
        model: node.data.aiModel || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a sentiment analysis expert. Analyze the emotional tone and sentiment of text.' },
          { role: 'user', content: sentimentPrompt }
        ],
        temperature: 0.1,
        max_tokens: 300
      });

      let sentimentResult = { 
        sentiment: 'neutral', 
        confidence: 0.0, 
        emotions: [], 
        intensity: 0.0, 
        reasoning: 'Analysis failed' 
      };
      
      try {
        sentimentResult = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error('Sentiment analysis parsing error:', parseError);
      }

      // Store sentiment in conversation variables
      conversation.flowState.variables.sentiment = sentimentResult.sentiment;
      conversation.flowState.variables.sentiment_confidence = sentimentResult.confidence;
      conversation.flowState.variables.emotions = sentimentResult.emotions;
      conversation.flowState.variables.sentiment_intensity = sentimentResult.intensity;

      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: node.data.content || `Sentiment: ${sentimentResult.sentiment} (${(sentimentResult.confidence * 100).toFixed(0)}% confidence)`,
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null,
          variables: conversation.flowState.variables
        },
        metadata: {
          sentimentResult
        }
      };

    } catch (error) {
      console.error('Sentiment analysis error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'Unable to analyze sentiment at the moment.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }

  async processLanguageDetectionNode(node, conversation, userMessage) {
    try {
      if (!this.openaiClient || !userMessage) {
        const nextNode = this.findNextNode(node, conversation);
        return {
          content: node.data.content || 'Language detection not available.',
          type: 'text',
          nodeId: node.id,
          flowState: {
            currentNode: nextNode?.id || null
          }
        };
      }

      const languagePrompt = `Detect the language of the following text and provide confidence score.
      
      Text: "${userMessage}"
      
      Return the result in JSON format:
      {
        "language": "en",
        "language_name": "English",
        "confidence": 0.95,
        "alternatives": [{"language": "es", "language_name": "Spanish", "confidence": 0.05}]
      }`;

      const completion = await this.openaiClient.chat.completions.create({
        model: node.data.aiModel || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a language detection expert. Identify the language of text with high accuracy.' },
          { role: 'user', content: languagePrompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      let languageResult = { 
        language: 'en', 
        language_name: 'English', 
        confidence: 0.0, 
        alternatives: [] 
      };
      
      try {
        languageResult = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error('Language detection parsing error:', parseError);
      }

      // Store language in conversation variables
      conversation.flowState.variables.detected_language = languageResult.language;
      conversation.flowState.variables.language_name = languageResult.language_name;
      conversation.flowState.variables.language_confidence = languageResult.confidence;

      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: node.data.content || `Language detected: ${languageResult.language_name} (${(languageResult.confidence * 100).toFixed(0)}% confidence)`,
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null,
          variables: conversation.flowState.variables
        },
        metadata: {
          languageResult
        }
      };

    } catch (error) {
      console.error('Language detection error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'Unable to detect language at the moment.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }

  async processTranslationNode(node, conversation, userMessage) {
    try {
      if (!this.openaiClient || !userMessage) {
        const nextNode = this.findNextNode(node, conversation);
        return {
          content: node.data.content || 'Translation not available.',
          type: 'text',
          nodeId: node.id,
          flowState: {
            currentNode: nextNode?.id || null
          }
        };
      }

      // Get source and target languages
      const sourceLanguage = node.data.sourceLanguage || conversation.flowState.variables.detected_language || 'auto';
      const targetLanguage = node.data.targetLanguage || 'en';
      const textToTranslate = node.data.translateUserMessage ? userMessage : (node.data.textToTranslate || userMessage);

      const translationPrompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}.
      ${sourceLanguage === 'auto' ? 'Auto-detect the source language.' : ''}
      
      Text to translate: "${textToTranslate}"
      
      Return the result in JSON format:
      {
        "translated_text": "Hello, how are you?",
        "source_language": "es",
        "target_language": "en",
        "confidence": 0.95
      }`;

      const completion = await this.openaiClient.chat.completions.create({
        model: node.data.aiModel || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional translator. Provide accurate translations while preserving meaning and context.' },
          { role: 'user', content: translationPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      let translationResult = { 
        translated_text: textToTranslate, 
        source_language: sourceLanguage, 
        target_language: targetLanguage, 
        confidence: 0.0 
      };
      
      try {
        translationResult = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error('Translation parsing error:', parseError);
      }

      // Store translation in conversation variables
      conversation.flowState.variables.translated_text = translationResult.translated_text;
      conversation.flowState.variables.translation_source_language = translationResult.source_language;
      conversation.flowState.variables.translation_target_language = translationResult.target_language;
      conversation.flowState.variables.translation_confidence = translationResult.confidence;

      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: node.data.showTranslation ? 
          `Translation: ${translationResult.translated_text}` : 
          (node.data.content || translationResult.translated_text),
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null,
          variables: conversation.flowState.variables
        },
        metadata: {
          translationResult,
          originalText: textToTranslate
        }
      };

    } catch (error) {
      console.error('Translation error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'Unable to translate at the moment.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }

  // Forms & Data Collection Node Processors

  async processSurveyNode(node, conversation, userMessage) {
    try {
      const surveyQuestions = node.data.surveyQuestions || [];
      const currentQuestionIndex = conversation.flowState.variables[`${node.id}_question_index`] || 0;
      
      if (currentQuestionIndex >= surveyQuestions.length) {
        // Survey completed
        const nextNode = this.findNextNode(node, conversation);
        conversation.flowState.variables[`${node.id}_completed`] = true;
        
        return {
          content: node.data.completionMessage || 'Thank you for completing the survey!',
          type: 'text',
          nodeId: node.id,
          flowState: {
            currentNode: nextNode?.id || null,
            variables: conversation.flowState.variables
          },
          metadata: {
            surveyCompleted: true,
            totalQuestions: surveyQuestions.length
          }
        };
      }

      const currentQuestion = surveyQuestions[currentQuestionIndex];
      
      // If user provided an answer, store it and move to next question
      if (conversation.flowState.currentNode === node.id && userMessage) {
        const answerKey = `${node.id}_answer_${currentQuestionIndex}`;
        conversation.flowState.variables[answerKey] = userMessage;
        conversation.flowState.variables[`${node.id}_question_index`] = currentQuestionIndex + 1;
        
        // Recursively continue to next question
        return await this.processSurveyNode(node, conversation, null);
      }

      // Show current question
      const questionContent = `${currentQuestion.question}${currentQuestion.required ? ' *' : ''}`;
      const progress = `(${currentQuestionIndex + 1}/${surveyQuestions.length})`;
      
      return {
        content: `${questionContent}\n\n${progress}`,
        type: currentQuestion.type || 'text',
        options: currentQuestion.options,
        nodeId: node.id,
        flowState: {
          currentNode: node.id,
          variables: conversation.flowState.variables
        },
        metadata: {
          currentQuestion: currentQuestionIndex,
          totalQuestions: surveyQuestions.length,
          questionType: currentQuestion.type,
          required: currentQuestion.required
        }
      };

    } catch (error) {
      console.error('Survey processing error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'Unable to process survey at the moment.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }

  async processLocationNode(node, conversation, userMessage) {
    try {
      if (conversation.flowState.currentNode === node.id && userMessage) {
        // Try to parse location from user input
        let locationData = null;
        
        // Check if it's coordinates (lat, lng)
        const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
        const coordMatch = userMessage.match(coordPattern);
        
        if (coordMatch) {
          locationData = {
            type: 'coordinates',
            latitude: parseFloat(coordMatch[1]),
            longitude: parseFloat(coordMatch[2]),
            raw: userMessage
          };
        } else {
          // Treat as address/place name
          locationData = {
            type: 'address',
            address: userMessage.trim(),
            raw: userMessage
          };
        }

        // Store location data
        conversation.flowState.variables.location = locationData;
        conversation.flowState.variables.location_raw = userMessage;
        
        const nextNode = this.findNextNode(node, conversation);
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

      // Show location input prompt
      let content = node.data.content || 'Please share your location:';
      const inputMethod = node.data.inputMethod || 'text'; // text, coordinates, map
      
      if (!node.data.content) {
        switch (inputMethod) {
          case 'coordinates':
            content = 'Please provide your coordinates (latitude, longitude):';
            break;
          case 'address':
            content = 'Please provide your address or location:';
            break;
          default:
            content = 'Please share your location (address or coordinates):';
        }
      }

      content = this.processVariables(content, conversation.flowState.variables);

      return {
        content,
        type: 'location',
        nodeId: node.id,
        flowState: { currentNode: node.id },
        metadata: {
          inputMethod,
          acceptsCoordinates: inputMethod === 'coordinates' || inputMethod === 'text',
          acceptsAddress: inputMethod === 'address' || inputMethod === 'text'
        }
      };

    } catch (error) {
      console.error('Location processing error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'Unable to process location at the moment.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }

  async processQRCodeNode(node, conversation, userMessage) {
    try {
      if (conversation.flowState.currentNode === node.id && userMessage) {
        // Process QR code input - could be scanned data or manual input
        const qrData = userMessage.trim();
        
        // Validate QR code data if validation pattern is provided
        let isValid = true;
        if (node.data.validation && node.data.validation.pattern) {
          const validationRegex = new RegExp(node.data.validation.pattern);
          isValid = validationRegex.test(qrData);
        }

        if (!isValid) {
          return {
            content: node.data.validation?.message || 'Invalid QR code data. Please try again.',
            type: 'text',
            nodeId: node.id,
            flowState: { currentNode: node.id }
          };
        }

        // Store QR code data
        conversation.flowState.variables.qr_code_data = qrData;
        conversation.flowState.variables[`${node.id}_qr_data`] = qrData;
        
        // Try to parse if it's a URL or JSON
        let parsedData = { raw: qrData };
        try {
          // Try parsing as JSON
          parsedData.json = JSON.parse(qrData);
        } catch {
          // Try parsing as URL
          try {
            const url = new URL(qrData);
            parsedData.url = {
              href: url.href,
              protocol: url.protocol,
              hostname: url.hostname,
              pathname: url.pathname,
              search: url.search,
              params: Object.fromEntries(url.searchParams)
            };
          } catch {
            // Plain text data
            parsedData.text = qrData;
          }
        }

        conversation.flowState.variables.qr_parsed_data = parsedData;

        const nextNode = this.findNextNode(node, conversation);
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

      // Show QR code input prompt
      let content = node.data.content || 'Please scan the QR code or enter the data manually:';
      content = this.processVariables(content, conversation.flowState.variables);

      return {
        content,
        type: 'qr_code',
        nodeId: node.id,
        flowState: { currentNode: node.id },
        metadata: {
          expectsQRScan: true,
          allowsManualInput: node.data.allowManualInput !== false,
          validationPattern: node.data.validation?.pattern,
          qrCodeType: node.data.qrCodeType // url, json, text, custom
        }
      };

    } catch (error) {
      console.error('QR Code processing error:', error);
      const nextNode = this.findNextNode(node, conversation);
      
      return {
        content: 'Unable to process QR code at the moment.',
        type: 'text',
        nodeId: node.id,
        flowState: {
          currentNode: nextNode?.id || null
        }
      };
    }
  }
}

module.exports = BotRuntime;
