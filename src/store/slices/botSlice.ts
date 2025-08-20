import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type BotType = 'lead_generation' | 'customer_support' | 'data_collection' | 'sales' | 'survey' | 'custom'
export type BotStatus = 'draft' | 'active' | 'inactive' | 'testing' | 'archived'
export type BotPlatform = 'website' | 'facebook' | 'whatsapp' | 'telegram' | 'slack' | 'discord'

export interface BotTemplate {
  id: string
  name: string
  description: string
  type: BotType
  icon: string
  category: string
  features: string[]
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  isPopular: boolean
  preview: {
    messages: Array<{
      type: 'bot' | 'user'
      content: string
    }>
  }
}

export interface BotFlow {
  id: string
  name: string
  description: string
  nodes: BotNode[]
  connections: BotConnection[]
}

export interface BotNode {
  id: string
  type: 'message' | 'question' | 'condition' | 'action' | 'webhook' | 'handoff'
  position: { x: number; y: number }
  data: {
    title: string
    content?: string
    options?: string[]
    conditions?: Array<{
      field: string
      operator: string
      value: string
    }>
    webhook?: {
      url: string
      method: 'GET' | 'POST'
      headers?: Record<string, string>
    }
  }
}

export interface BotConnection {
  id: string
  source: string
  target: string
  condition?: string
}

export interface BotSettings {
  personality: {
    tone: 'professional' | 'friendly' | 'casual' | 'formal'
    style: 'concise' | 'detailed' | 'conversational'
    language: string
  }
  behavior: {
    responseDelay: number
    typingIndicator: boolean
    fallbackMessage: string
    maxRetries: number
    handoffTriggers: string[]
  }
  appearance: {
    avatar: string
    name: string
    welcomeMessage: string
    theme: {
      primaryColor: string
      backgroundColor: string
      textColor: string
    }
  }
  integrations: {
    platforms: BotPlatform[]
    webhooks: Array<{
      id: string
      name: string
      url: string
      events: string[]
    }>
    crm: {
      enabled: boolean
      provider?: 'salesforce' | 'hubspot' | 'pipedrive'
      apiKey?: string
    }
  }
}

export interface Bot {
  id: string
  name: string
  description: string
  type: BotType
  status: BotStatus
  templateId?: string
  flow: BotFlow
  settings: BotSettings
  analytics: {
    totalConversations: number
    activeConversations: number
    completionRate: number
    averageRating: number
    lastActivity: Date
  }
  createdAt: Date
  updatedAt: Date
  createdBy: string
  isPublished: boolean
  version: string
}

export interface BotConversation {
  id: string
  botId: string
  userId: string
  userName: string
  status: 'active' | 'completed' | 'abandoned' | 'handed_off'
  messages: Array<{
    id: string
    type: 'bot' | 'user'
    content: string
    timestamp: Date
    metadata?: Record<string, any>
  }>
  startedAt: Date
  endedAt?: Date
  rating?: number
  feedback?: string
  tags: string[]
}

interface BotState {
  bots: Bot[]
  templates: BotTemplate[]
  conversations: BotConversation[]
  currentBot: Bot | null
  isLoading: boolean
  error: string | null
  filters: {
    type: BotType | 'all'
    status: BotStatus | 'all'
    platform: BotPlatform | 'all'
    search: string
  }
  pagination: {
    currentPage: number
    totalPages: number
    itemsPerPage: number
    totalItems: number
  }
  builderState: {
    selectedNode: string | null
    isEditing: boolean
    zoom: number
    showGrid: boolean
  }
}

// Default bot templates
const defaultTemplates: BotTemplate[] = [
  {
    id: 'lead-gen-1',
    name: 'Lead Generation Bot',
    description: 'Capture and qualify leads automatically with smart questions',
    type: 'lead_generation',
    icon: '🎯',
    category: 'Marketing',
    features: ['Lead Capture', 'Qualification', 'CRM Integration', 'Follow-up'],
    complexity: 'beginner',
    estimatedTime: '10 minutes',
    isPopular: true,
    preview: {
      messages: [
        { type: 'bot', content: 'Hi! I\'d love to help you learn more about our services. What\'s your name?' },
        { type: 'user', content: 'John Smith' },
        { type: 'bot', content: 'Nice to meet you John! What\'s your business email?' },
        { type: 'user', content: 'john@company.com' },
        { type: 'bot', content: 'Perfect! What size is your company?' }
      ]
    }
  },
  {
    id: 'support-1',
    name: 'Customer Support Bot',
    description: 'Provide 24/7 customer support with intelligent responses',
    type: 'customer_support',
    icon: '🎧',
    category: 'Support',
    features: ['FAQ Answers', 'Ticket Creation', 'Live Handoff', 'Knowledge Base'],
    complexity: 'intermediate',
    estimatedTime: '15 minutes',
    isPopular: true,
    preview: {
      messages: [
        { type: 'bot', content: 'Hello! How can I help you today?' },
        { type: 'user', content: 'I need help with my order' },
        { type: 'bot', content: 'I\'d be happy to help! Can you provide your order number?' },
        { type: 'user', content: 'ORDER-12345' },
        { type: 'bot', content: 'Let me check that for you...' }
      ]
    }
  },
  {
    id: 'data-collection-1',
    name: 'Data Collection Bot',
    description: 'Gather customer feedback and survey responses efficiently',
    type: 'data_collection',
    icon: '📊',
    category: 'Research',
    features: ['Survey Forms', 'Data Export', 'Analytics', 'Custom Fields'],
    complexity: 'beginner',
    estimatedTime: '8 minutes',
    isPopular: false,
    preview: {
      messages: [
        { type: 'bot', content: 'We\'d love your feedback! How was your experience?' },
        { type: 'user', content: 'It was great!' },
        { type: 'bot', content: 'Wonderful! On a scale of 1-10, how likely are you to recommend us?' },
        { type: 'user', content: '9' },
        { type: 'bot', content: 'Thank you for the feedback!' }
      ]
    }
  }
]

// Mock bot data
const mockBots: Bot[] = [
  {
    id: 'bot-1',
    name: 'Welleazy AI',
    description: 'Lead generation bot for our main website',
    type: 'lead_generation',
    status: 'active',
    templateId: 'lead-gen-1',
    flow: {
      id: 'flow-1',
      name: 'Main Flow',
      description: 'Primary conversation flow',
      nodes: [
        {
          id: 'start',
          type: 'message',
          position: { x: 100, y: 100 },
          data: {
            title: 'Welcome Message',
            content: 'Hi! Welcome to Welleazy. How can I help you today?'
          }
        }
      ],
      connections: []
    },
    settings: {
      personality: {
        tone: 'friendly',
        style: 'conversational',
        language: 'en'
      },
      behavior: {
        responseDelay: 1000,
        typingIndicator: true,
        fallbackMessage: 'I didn\'t understand that. Can you rephrase?',
        maxRetries: 3,
        handoffTriggers: ['human', 'agent', 'speak to someone']
      },
      appearance: {
        avatar: '/avatars/welleazy.png',
        name: 'Welleazy Assistant',
        welcomeMessage: 'Hi! I\'m here to help you get started.',
        theme: {
          primaryColor: '#3B82F6',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937'
        }
      },
      integrations: {
        platforms: ['website', 'facebook'],
        webhooks: [],
        crm: {
          enabled: false
        }
      }
    },
    analytics: {
      totalConversations: 1247,
      activeConversations: 23,
      completionRate: 78.5,
      averageRating: 4.6,
      lastActivity: new Date()
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    createdBy: '1',
    isPublished: true,
    version: '1.2.0'
  },
  {
    id: 'bot-2',
    name: 'Test',
    description: 'Testing bot for new features',
    type: 'custom',
    status: 'testing',
    flow: {
      id: 'flow-2',
      name: 'Test Flow',
      description: 'Testing conversation flow',
      nodes: [],
      connections: []
    },
    settings: {
      personality: {
        tone: 'casual',
        style: 'concise',
        language: 'en'
      },
      behavior: {
        responseDelay: 500,
        typingIndicator: false,
        fallbackMessage: 'Sorry, I don\'t understand.',
        maxRetries: 2,
        handoffTriggers: []
      },
      appearance: {
        avatar: '',
        name: 'Test Bot',
        welcomeMessage: 'Hello! This is a test.',
        theme: {
          primaryColor: '#10B981',
          backgroundColor: '#F3F4F6',
          textColor: '#374151'
        }
      },
      integrations: {
        platforms: ['website'],
        webhooks: [],
        crm: {
          enabled: false
        }
      }
    },
    analytics: {
      totalConversations: 45,
      activeConversations: 2,
      completionRate: 65.2,
      averageRating: 4.1,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date(),
    createdBy: '1',
    isPublished: false,
    version: '0.1.0'
  }
]

const initialState: BotState = {
  bots: mockBots,
  templates: defaultTemplates,
  conversations: [],
  currentBot: null,
  isLoading: false,
  error: null,
  filters: {
    type: 'all',
    status: 'all',
    platform: 'all',
    search: ''
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 12,
    totalItems: mockBots.length
  },
  builderState: {
    selectedNode: null,
    isEditing: false,
    zoom: 1,
    showGrid: true
  }
}

const botSlice = createSlice({
  name: 'bots',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setBots: (state, action: PayloadAction<Bot[]>) => {
      state.bots = action.payload
    },
    addBot: (state, action: PayloadAction<Omit<Bot, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>>) => {
      const newBot: Bot = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        analytics: {
          totalConversations: 0,
          activeConversations: 0,
          completionRate: 0,
          averageRating: 0,
          lastActivity: new Date()
        }
      }
      state.bots.push(newBot)
      state.pagination.totalItems += 1
    },
    updateBot: (state, action: PayloadAction<Partial<Bot> & { id: string }>) => {
      const index = state.bots.findIndex(bot => bot.id === action.payload.id)
      if (index !== -1) {
        state.bots[index] = {
          ...state.bots[index],
          ...action.payload,
          updatedAt: new Date()
        }
      }
    },
    deleteBot: (state, action: PayloadAction<string>) => {
      state.bots = state.bots.filter(bot => bot.id !== action.payload)
      state.pagination.totalItems -= 1
    },
    setCurrentBot: (state, action: PayloadAction<Bot | null>) => {
      state.currentBot = action.payload
    },
    updateBotFlow: (state, action: PayloadAction<{ botId: string; flow: BotFlow }>) => {
      const bot = state.bots.find(b => b.id === action.payload.botId)
      if (bot) {
        bot.flow = action.payload.flow
        bot.updatedAt = new Date()
      }
      if (state.currentBot?.id === action.payload.botId) {
        state.currentBot.flow = action.payload.flow
      }
    },
    updateBotSettings: (state, action: PayloadAction<{ botId: string; settings: Partial<BotSettings> }>) => {
      const bot = state.bots.find(b => b.id === action.payload.botId)
      if (bot) {
        bot.settings = { ...bot.settings, ...action.payload.settings }
        bot.updatedAt = new Date()
      }
    },
    setTemplates: (state, action: PayloadAction<BotTemplate[]>) => {
      state.templates = action.payload
    },
    setConversations: (state, action: PayloadAction<BotConversation[]>) => {
      state.conversations = action.payload
    },
    addConversation: (state, action: PayloadAction<BotConversation>) => {
      state.conversations.push(action.payload)
    },
    updateConversation: (state, action: PayloadAction<Partial<BotConversation> & { id: string }>) => {
      const index = state.conversations.findIndex(conv => conv.id === action.payload.id)
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...action.payload }
      }
    },
    setFilters: (state, action: PayloadAction<Partial<BotState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action: PayloadAction<Partial<BotState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setBuilderState: (state, action: PayloadAction<Partial<BotState['builderState']>>) => {
      state.builderState = { ...state.builderState, ...action.payload }
    },
    publishBot: (state, action: PayloadAction<string>) => {
      const bot = state.bots.find(b => b.id === action.payload)
      if (bot) {
        bot.isPublished = true
        bot.status = 'active'
        bot.updatedAt = new Date()
      }
    },
    unpublishBot: (state, action: PayloadAction<string>) => {
      const bot = state.bots.find(b => b.id === action.payload)
      if (bot) {
        bot.isPublished = false
        bot.status = 'inactive'
        bot.updatedAt = new Date()
      }
    },
    duplicateBot: (state, action: PayloadAction<string>) => {
      const originalBot = state.bots.find(b => b.id === action.payload)
      if (originalBot) {
        const duplicatedBot: Bot = {
          ...originalBot,
          id: Date.now().toString(),
          name: `${originalBot.name} (Copy)`,
          status: 'draft',
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          analytics: {
            totalConversations: 0,
            activeConversations: 0,
            completionRate: 0,
            averageRating: 0,
            lastActivity: new Date()
          }
        }
        state.bots.push(duplicatedBot)
        state.pagination.totalItems += 1
      }
    },
    clearBots: (state) => {
      state.bots = []
      state.pagination.totalItems = 0
    }
  }
})

export const {
  setLoading,
  setError,
  setBots,
  addBot,
  updateBot,
  deleteBot,
  setCurrentBot,
  updateBotFlow,
  updateBotSettings,
  setTemplates,
  setConversations,
  addConversation,
  updateConversation,
  setFilters,
  setPagination,
  setBuilderState,
  publishBot,
  unpublishBot,
  duplicateBot,
  clearBots
} = botSlice.actions

export default botSlice.reducer
