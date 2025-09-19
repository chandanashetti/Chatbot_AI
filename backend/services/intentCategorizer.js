const BotConversation = require('../models/BotConversation');
const ChatSession = require('../models/Chat');
const Settings = require('../models/Settings');

class IntentCategorizer {
  constructor() {
    this.openaiClient = null;
    this.initializeAI();
  }

  async initializeAI() {
    try {
      const settings = await Settings.findOne({ isDefault: true });
      if (settings?.openai?.apiKey) {
        const OpenAI = require('openai');
        this.openaiClient = new OpenAI({ apiKey: settings.openai.apiKey });
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI client for intent categorization:', error);
    }
  }

  // Category mapping for intents to chat categories
  getIntentCategoryMapping() {
    return {
      // Complaints
      'complaint': 'complaints',
      'dissatisfied': 'complaints',
      'angry': 'complaints',
      'frustrated': 'complaints',
      'problem': 'complaints',
      'issue': 'complaints',
      'error': 'complaints',
      'bug': 'complaints',
      'broken': 'complaints',

      // Queries
      'question': 'queries',
      'information': 'queries',
      'inquiry': 'queries',
      'help': 'queries',
      'how_to': 'queries',
      'clarification': 'queries',
      'explanation': 'queries',

      // Feedback
      'feedback': 'feedback',
      'review': 'feedback',
      'rating': 'feedback',
      'compliment': 'feedback',
      'positive_feedback': 'feedback',
      'suggestion': 'feedback',
      'recommendation': 'feedback',

      // Purchase
      'purchase': 'purchase',
      'buy': 'purchase',
      'payment': 'purchase',
      'checkout': 'purchase',
      'pricing': 'purchase',
      'quote': 'purchase',
      'billing': 'purchase',

      // Order Related
      'order_status': 'order_related',
      'shipping': 'order_related',
      'delivery': 'order_related',
      'tracking': 'order_related',
      'return': 'order_related',
      'refund': 'order_related',
      'exchange': 'order_related',
      'cancel_order': 'order_related',

      // Support
      'support': 'support',
      'technical_support': 'support',
      'assistance': 'support',
      'troubleshooting': 'support',
      'account_help': 'support',
      'reset_password': 'support',

      // General
      'greeting': 'general',
      'goodbye': 'general',
      'small_talk': 'general',
      'general_inquiry': 'general',
      'unknown': 'general'
    };
  }

  // AI-powered intent detection for chat categorization
  async detectChatIntent(messageContent, conversationContext = '') {
    if (!this.openaiClient) {
      console.warn('OpenAI client not available for intent detection');
      return { intent: 'general', confidence: 0.5, category: 'general' };
    }

    try {
      const intentCategories = [
        'complaints', 'queries', 'feedback', 'purchase',
        'order_related', 'support', 'general'
      ];

      const systemPrompt = `You are an expert intent classifier for customer service conversations. You work for the company and understand customer inquiries from a first-person company perspective.

Analyze the message and classify it into one of these chat categories:

1. **complaints** - Customer dissatisfaction, problems, issues, errors, bugs, broken features, anger, frustration
2. **queries** - General questions, information requests, how-to questions, clarifications, explanations about our company/services
3. **feedback** - Reviews, ratings, compliments, suggestions, recommendations, positive/negative feedback about our company
4. **purchase** - Buying inquiries, payment questions, pricing, quotes, billing, checkout assistance for our products/services
5. **order_related** - Order status, shipping, delivery, tracking, returns, refunds, exchanges, cancellations for our orders
6. **support** - Technical support, account help, troubleshooting, password resets, assistance requests for our services
7. **general** - Greetings, small talk, general conversation, unclear intent

Consider the context and emotional tone of the message. Remember you represent the company directly. Return ONLY a JSON object with:
{
  "intent": "category_name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen"
}`;

      const userPrompt = `${conversationContext ? 'Conversation context: ' + conversationContext + '\n\n' : ''}Current message: "${messageContent}"

Classify this message into the most appropriate category.`;

      const completion = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 150
      });

      let result = { intent: 'general', confidence: 0.5, category: 'general' };

      try {
        const aiResponse = JSON.parse(completion.choices[0].message.content);
        result = {
          intent: aiResponse.intent,
          confidence: aiResponse.confidence || 0.8,
          category: aiResponse.intent,
          reasoning: aiResponse.reasoning
        };
      } catch (parseError) {
        console.error('Intent parsing error:', parseError);
      }

      return result;

    } catch (error) {
      console.error('AI intent detection error:', error);
      return { intent: 'general', confidence: 0.1, category: 'general' };
    }
  }

  // Categorize conversation based on detected intents
  categorizeConversation(conversation) {
    // Check if conversation already has intent data
    const messages = conversation.messages || [];
    const userMessages = messages.filter(msg => msg.sender === 'user');

    if (userMessages.length === 0) {
      return 'general';
    }

    // Look for intent data in message metadata
    const intentsFound = [];

    userMessages.forEach(message => {
      if (message.metadata?.intent) {
        intentsFound.push({
          intent: message.metadata.intent,
          confidence: message.metadata.confidence || 0.5
        });
      }
    });

    // If we have intent data, use it
    if (intentsFound.length > 0) {
      // Find the highest confidence intent
      const bestIntent = intentsFound.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      // Map intent to category
      const categoryMapping = this.getIntentCategoryMapping();
      return categoryMapping[bestIntent.intent] || 'general';
    }

    // Fallback: analyze conversation content with AI
    const conversationText = userMessages
      .map(msg => msg.content)
      .join(' ')
      .substring(0, 500); // Limit length

    return this.detectChatIntent(conversationText);
  }

  // Process a batch of conversations and return category counts
  async categorizeConversations(conversations) {
    const categories = {
      complaints: { count: 0, percentage: 0 },
      queries: { count: 0, percentage: 0 },
      feedback: { count: 0, percentage: 0 },
      purchase: { count: 0, percentage: 0 },
      order_related: { count: 0, percentage: 0 },
      support: { count: 0, percentage: 0 },
      general: { count: 0, percentage: 0 }
    };

    const categorizedConversations = [];

    for (const conversation of conversations) {
      try {
        let category = this.categorizeConversation(conversation);

        // If category is a promise (from AI detection), await it
        if (category && typeof category.then === 'function') {
          const intentResult = await category;
          category = intentResult.category || 'general';
        }

        // Ensure category is valid
        if (!categories.hasOwnProperty(category)) {
          category = 'general';
        }

        categories[category].count++;
        categorizedConversations.push({
          conversationId: conversation.conversationId || conversation._id,
          category,
          confidence: 0.8 // Default confidence for existing data
        });

      } catch (error) {
        console.error('Error categorizing conversation:', error);
        categories.general.count++;
        categorizedConversations.push({
          conversationId: conversation.conversationId || conversation._id,
          category: 'general',
          confidence: 0.1
        });
      }
    }

    // Calculate percentages
    const totalConversations = conversations.length;
    if (totalConversations > 0) {
      Object.keys(categories).forEach(category => {
        categories[category].percentage = Math.round(
          (categories[category].count / totalConversations) * 100
        );
      });
    }

    return {
      categories,
      totalConversations,
      categorizedConversations
    };
  }

  // Update conversation with detected intent
  async updateConversationIntent(conversationId, messageContent) {
    try {
      const intentResult = await this.detectChatIntent(messageContent);

      // Update the conversation in database
      await BotConversation.updateOne(
        { conversationId },
        {
          $set: {
            'metadata.detectedIntent': intentResult.intent,
            'metadata.intentConfidence': intentResult.confidence,
            'metadata.intentCategory': intentResult.category,
            'metadata.lastIntentUpdate': new Date()
          }
        }
      );

      return intentResult;
    } catch (error) {
      console.error('Error updating conversation intent:', error);
      return null;
    }
  }
}

module.exports = IntentCategorizer;