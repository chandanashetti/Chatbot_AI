import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AnalyticsData {
  totalQueries: number
  averageResponseTime: number
  deflectionRate: number
  uptime: number
  positiveFeedback: number
  negativeFeedback: number
  queriesByChannel: {
    web: number
    whatsapp: number
    instagram: number
  }
  queriesByDate: Array<{
    date: string
    count: number
  }>
  responseTimeByDate: Array<{
    date: string
    avgTime: number
  }>
}

interface AnalyticsState {
  data: AnalyticsData | null
  isLoading: boolean
  error: string | null
  dateRange: {
    start: string
    end: string
  }
}

const initialState: AnalyticsState = {
  data: null,
  isLoading: false,
  error: null,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setData: (state, action: PayloadAction<AnalyticsData>) => {
      state.data = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setDateRange: (state, action: PayloadAction<{ start: string; end: string }>) => {
      state.dateRange = action.payload
    },
    clearData: (state) => {
      state.data = null
    },
  },
})

export const { 
  setLoading, 
  setData, 
  setError, 
  setDateRange, 
  clearData 
} = analyticsSlice.actions
export default analyticsSlice.reducer
