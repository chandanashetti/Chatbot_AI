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

export interface BotSettings {
  temperature: number
  maxTokens: number
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3' | 'bedrock' | 'ollama'
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
  setError, 
  resetSettings 
} = settingsSlice.actions
export default settingsSlice.reducer
