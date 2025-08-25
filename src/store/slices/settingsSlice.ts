import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface OllamaSettings {
  enabled: boolean
  apiUrl: string
  model: string
  embeddingModel: string
  temperature: number
  maxTokens: number
  timeout: number
  ragEnabled: boolean
  chunkSize: number
  chunkOverlap: number
  topK: number
}

export interface OpenAISettings {
  enabled: boolean
  apiKey: string
  model: string
  embeddingModel: string
  temperature: number
  maxTokens: number
  ragEnabled: boolean
  topK: number
}

export interface UrlSource {
  id: string
  url: string
  name: string
  description: string
  enabled: boolean
  lastScraped?: Date
  scrapingStatus: 'pending' | 'success' | 'error' | 'disabled'
  errorMessage?: string
  contentLength: number
  addedAt: Date
}

export interface WebScrapingSettings {
  enabled: boolean
  urls: UrlSource[]
  cacheTimeout: number
  maxUrls: number
  requestTimeout: number
  userAgent: string
  respectRobotsTxt: boolean
  maxContentLength: number
  allowedDomains: string[]
  blockedDomains: string[]
}

export interface ChatWidgetSettings {
  enabled: boolean
  title: string
  initialMessage: string
  placeholder: string
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme: 'light' | 'dark' | 'auto'
  showOnLanding: boolean
  showOnAllPages: boolean
  hiddenPages: string[]
}

export interface BotSettings {
  temperature: number
  maxTokens: number
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3' | 'bedrock' | 'ollama' | 'openai'
  fallbackMessage: string
  greetingMessage: string
  promptTemplate: string
  ragPromptTemplate: string
  theme: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
  }
  ollama: OllamaSettings
  openai: OpenAISettings
  webScraping: WebScrapingSettings
  chatWidget: ChatWidgetSettings
}

interface SettingsState {
  settings: BotSettings
  isLoading: boolean
  error: string | null
  isSaving: boolean
}

const initialState: SettingsState = {
  settings: {
    temperature: 0.7,
    maxTokens: 1000,
    model: 'gpt-3.5-turbo',
    fallbackMessage: 'I apologize, but I\'m unable to process your request at the moment. Please try again later.',
    greetingMessage: 'Hello! I\'m your AI assistant. How can I help you today?',
    promptTemplate: 'You are a helpful AI assistant. Answer the user\'s question based on the provided context.',
    ragPromptTemplate: `You are an expert assistant that answers questions based on the provided documents.

Here are the relevant documents: {documents}

Question: {question}

Please provide a comprehensive answer based on the information in the documents. If the answer is not found in the documents, say so clearly.`,
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      backgroundColor: '#ffffff',
    },
    ollama: {
      enabled: false,
      apiUrl: 'http://localhost:11434',
      model: 'llama3.2',
      embeddingModel: 'mxbai-embed-large',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      ragEnabled: true,
      chunkSize: 1000,
      chunkOverlap: 200,
      topK: 5
    },
    openai: {
      enabled: true,
      apiKey: '',
      model: 'gpt-3.5-turbo',
      embeddingModel: 'text-embedding-ada-002',
      temperature: 0.7,
      maxTokens: 1000,
      ragEnabled: true,
      topK: 5
    },
    webScraping: {
      enabled: false,
      urls: [],
      cacheTimeout: 3600000, // 1 hour
      maxUrls: 10,
      requestTimeout: 10000,
      userAgent: 'Mozilla/5.0 (compatible; Chatbot-AI/1.0)',
      respectRobotsTxt: true,
      maxContentLength: 100000,
      allowedDomains: [],
      blockedDomains: []
    },
    chatWidget: {
      enabled: true,
      title: 'AI Assistant',
      initialMessage: 'Hi! How can I help you today?',
      placeholder: 'Type your message...',
      position: 'bottom-right',
      theme: 'auto',
      showOnLanding: true,
      showOnAllPages: false,
      hiddenPages: ['/admin', '/chat']
    }
  },
  isLoading: false,
  error: null,
  isSaving: false,
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload
    },
    updateSettings: (state, action: PayloadAction<Partial<BotSettings>>) => {
      state.settings = { ...state.settings, ...action.payload }
    },
    updateTheme: (state, action: PayloadAction<Partial<BotSettings['theme']>>) => {
      state.settings.theme = { ...state.settings.theme, ...action.payload }
    },
    updateOllamaSettings: (state, action: PayloadAction<Partial<OllamaSettings>>) => {
      state.settings.ollama = { ...state.settings.ollama, ...action.payload }
    },
    updateOpenAISettings: (state, action: PayloadAction<Partial<OpenAISettings>>) => {
      state.settings.openai = { ...state.settings.openai, ...action.payload }
    },
    updateWebScrapingSettings: (state, action: PayloadAction<Partial<WebScrapingSettings>>) => {
      state.settings.webScraping = { ...state.settings.webScraping, ...action.payload }
    },
    addUrl: (state, action: PayloadAction<UrlSource>) => {
      state.settings.webScraping.urls.push(action.payload)
    },
    removeUrl: (state, action: PayloadAction<string>) => {
      state.settings.webScraping.urls = state.settings.webScraping.urls.filter(url => url.id !== action.payload)
    },
    updateUrl: (state, action: PayloadAction<{ id: string; updates: Partial<UrlSource> }>) => {
      const { id, updates } = action.payload
      const index = state.settings.webScraping.urls.findIndex(url => url.id === id)
      if (index !== -1) {
        state.settings.webScraping.urls[index] = { ...state.settings.webScraping.urls[index], ...updates }
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    resetSettings: (state) => {
      state.settings = initialState.settings
    },
  },
})

export const { 
  setLoading, 
  setSaving, 
  updateSettings, 
  updateTheme, 
  updateOllamaSettings,
  updateOpenAISettings,
  updateWebScrapingSettings,
  addUrl,
  removeUrl,
  updateUrl,
  setError, 
  resetSettings 
} = settingsSlice.actions
export default settingsSlice.reducer
