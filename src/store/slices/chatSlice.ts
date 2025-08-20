import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: Date
  channel?: 'web' | 'whatsapp' | 'instagram'
  attachments?: File[]
  metadata?: {
    ragUsed?: boolean
    searchResults?: any[]
    model?: string
    sources?: string[]
  }
}

interface ChatState {
  messages: Message[]
  isTyping: boolean
  isConnected: boolean
  error: string | null
  sessionId: string | null
}

const initialState: ChatState = {
  messages: [],
  isTyping: false,
  isConnected: false,
  error: null,
  sessionId: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload
    },
    clearChat: (state) => {
      state.messages = []
      state.sessionId = null
    },
    updateMessage: (state, action: PayloadAction<{ id: string; content: string }>) => {
      const message = state.messages.find(m => m.id === action.payload.id)
      if (message) {
        message.content = action.payload.content
      }
    },
  },
})

export const { 
  addMessage, 
  setTyping, 
  setConnected, 
  setError, 
  setSessionId, 
  clearChat,
  updateMessage 
} = chatSlice.actions
export default chatSlice.reducer
