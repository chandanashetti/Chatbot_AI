import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface LogEntry {
  id: string
  message: string
  channel: 'web' | 'whatsapp' | 'instagram'
  timestamp: Date
  userId?: string
  sessionId: string
  responseTime: number
  status: 'success' | 'error' | 'timeout'
  feedback?: 'positive' | 'negative'
}

interface LogsState {
  logs: LogEntry[]
  filteredLogs: LogEntry[]
  isLoading: boolean
  error: string | null
  filters: {
    channel: string
    dateRange: {
      start: string
      end: string
    }
    keywords: string
    status: string
  }
  pagination: {
    currentPage: number
    totalPages: number
    itemsPerPage: number
  }
}

const initialState: LogsState = {
  logs: [],
  filteredLogs: [],
  isLoading: false,
  error: null,
  filters: {
    channel: '',
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    keywords: '',
    status: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 20,
  },
}

const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setLogs: (state, action: PayloadAction<LogEntry[]>) => {
      state.logs = action.payload
      state.filteredLogs = action.payload
    },
    addLog: (state, action: PayloadAction<LogEntry>) => {
      state.logs.unshift(action.payload)
      state.filteredLogs.unshift(action.payload)
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<LogsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action: PayloadAction<Partial<LogsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    clearLogs: (state) => {
      state.logs = []
      state.filteredLogs = []
    },
    updateLog: (state, action: PayloadAction<Partial<LogEntry> & { id: string }>) => {
      const logIndex = state.logs.findIndex(log => log.id === action.payload.id)
      if (logIndex !== -1) {
        state.logs[logIndex] = { ...state.logs[logIndex], ...action.payload }
      }
      
      const filteredIndex = state.filteredLogs.findIndex(log => log.id === action.payload.id)
      if (filteredIndex !== -1) {
        state.filteredLogs[filteredIndex] = { ...state.filteredLogs[filteredIndex], ...action.payload }
      }
    },
  },
})

export const { 
  setLoading, 
  setLogs, 
  addLog, 
  setError, 
  setFilters, 
  setPagination, 
  clearLogs, 
  updateLog 
} = logsSlice.actions
export default logsSlice.reducer
