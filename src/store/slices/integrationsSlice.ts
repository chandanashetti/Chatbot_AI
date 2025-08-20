import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Integration {
  id: string
  name: string
  type: 'whatsapp' | 'instagram' | 'telegram' | 'webhook'
  isActive: boolean
  config: {
    apiKey?: string
    apiSecret?: string
    webhookUrl?: string
    phoneNumber?: string
    businessAccountId?: string
  }
  lastSync?: Date
  status: 'connected' | 'disconnected' | 'error'
}

interface IntegrationsState {
  integrations: Integration[]
  isLoading: boolean
  error: string | null
}

const initialState: IntegrationsState = {
  integrations: [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      type: 'whatsapp',
      isActive: false,
      config: {},
      status: 'disconnected'
    },
    {
      id: 'instagram',
      name: 'Instagram Direct',
      type: 'instagram',
      isActive: false,
      config: {},
      status: 'disconnected'
    },
    {
      id: 'webhook',
      name: 'Custom Webhook',
      type: 'webhook',
      isActive: false,
      config: {},
      status: 'disconnected'
    }
  ],
  isLoading: false,
  error: null,
}

const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    updateIntegration: (state, action: PayloadAction<Partial<Integration> & { id: string }>) => {
      const index = state.integrations.findIndex(i => i.id === action.payload.id)
      if (index !== -1) {
        state.integrations[index] = { ...state.integrations[index], ...action.payload }
      }
    },
    setIntegrationStatus: (state, action: PayloadAction<{ id: string; status: Integration['status'] }>) => {
      const integration = state.integrations.find(i => i.id === action.payload.id)
      if (integration) {
        integration.status = action.payload.status
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    addIntegration: (state, action: PayloadAction<Integration>) => {
      state.integrations.push(action.payload)
    },
    removeIntegration: (state, action: PayloadAction<string>) => {
      state.integrations = state.integrations.filter(i => i.id !== action.payload)
    },
  },
})

export const { 
  setLoading, 
  updateIntegration, 
  setIntegrationStatus, 
  setError, 
  addIntegration, 
  removeIntegration 
} = integrationsSlice.actions
export default integrationsSlice.reducer
