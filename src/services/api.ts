import axios from 'axios'
import { store } from '../store/store'
import { logout } from '../store/slices/authSlice'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
}

// Chat API
export const chatAPI = {
  sendMessage: (message: { content: string; sessionId?: string; attachments?: File[] }) => {
    const formData = new FormData()
    formData.append('content', message.content)
    if (message.sessionId) formData.append('sessionId', message.sessionId)
    if (message.attachments) {
      message.attachments.forEach(file => formData.append('attachments', file))
    }
    return api.post('/chat/send', formData)
  },
  
  getHistory: (sessionId: string) =>
    api.get(`/chat/history/${sessionId}`),
}

// Integrations API
export const integrationsAPI = {
  getAll: () => api.get('/integrations'),
  
  update: (id: string, config: any) =>
    api.put(`/integrations/${id}`, config),
  
  test: (id: string) => api.post(`/integrations/${id}/test`),
  
  connect: (id: string) => api.post(`/integrations/${id}/connect`),
  
  disconnect: (id: string) => api.post(`/integrations/${id}/disconnect`),
}

// Knowledge Base API
export const knowledgeBaseAPI = {
  uploadDocument: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/knowledge-base/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },
  
  getDocuments: () => api.get('/knowledge-base/documents'),
  
  deleteDocument: (id: string) => api.delete(`/knowledge-base/documents/${id}`),
  
  reindexDocument: (id: string) => api.post(`/knowledge-base/documents/${id}/reindex`),
}

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  
  updateSettings: (settings: any) => api.put('/settings', settings),
  
  getModels: () => api.get('/settings/models'),
}

// Logs API
export const logsAPI = {
  getLogs: (params: {
    page?: number
    limit?: number
    channel?: string
    startDate?: string
    endDate?: string
    keywords?: string
    status?: string
  }) => api.get('/logs', { params }),
  
  exportLogs: (params: any) => api.get('/logs/export', { params }),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: (dateRange: { start: string; end: string }) =>
    api.get('/analytics/dashboard', { params: dateRange }),
  
  getCharts: (dateRange: { start: string; end: string }) =>
    api.get('/analytics/charts', { params: dateRange }),
  
  getMetrics: (dateRange: { start: string; end: string }) =>
    api.get('/analytics/metrics', { params: dateRange }),
}

// Users API
export const usersAPI = {
  getUsers: (params: {
    page?: number
    limit?: number
    role?: string
    status?: string
    department?: string
    search?: string
  }) => api.get('/users', { params }),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  createUser: (userData: any) => api.post('/users', userData),
  
  updateUser: (id: string, userData: any) => api.put(`/users/${id}`, userData),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  
  updateUserRole: (id: string, role: string) => 
    api.patch(`/users/${id}/role`, { role }),
  
  updateUserPermissions: (id: string, permissions: any) =>
    api.patch(`/users/${id}/permissions`, { permissions }),
  
  updateUserStatus: (id: string, status: string) =>
    api.patch(`/users/${id}/status`, { status }),
  
  resetUserPassword: (id: string) => api.post(`/users/${id}/reset-password`),
  
  getUserActivities: (id: string, params?: {
    page?: number
    limit?: number
    module?: string
    startDate?: string
    endDate?: string
  }) => api.get(`/users/${id}/activities`, { params }),
  
  getAllActivities: (params?: {
    page?: number
    limit?: number
    userId?: string
    module?: string
    startDate?: string
    endDate?: string
  }) => api.get('/users/activities', { params }),
  
  inviteUser: (userData: {
    email: string
    name: string
    role: string
    department?: string
  }) => api.post('/users/invite', userData),
  
  resendInvitation: (id: string) => api.post(`/users/${id}/resend-invitation`),
  
  bulkUpdateUsers: (userIds: string[], updates: any) =>
    api.patch('/users/bulk', { userIds, updates }),
  
  exportUsers: (params?: any) => api.get('/users/export', { params }),
  
  importUsers: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/users/import', formData)
  }
}

// Bots API
export const botsAPI = {
  getBots: (params: {
    page?: number
    limit?: number
    type?: string
    status?: string
    search?: string
  }) => api.get('/bots', { params }),
  
  getBot: (id: string) => api.get(`/bots/${id}`),
  
  createBot: (botData: any) => api.post('/bots', botData),
  
  updateBot: (id: string, botData: any) => api.put(`/bots/${id}`, botData),
  
  deleteBot: (id: string) => api.delete(`/bots/${id}`),
  
  duplicateBot: (id: string) => api.post(`/bots/${id}/duplicate`),
  
  publishBot: (id: string) => api.patch(`/bots/${id}/publish`),
  
  unpublishBot: (id: string) => api.patch(`/bots/${id}/unpublish`),
  
  updateBotFlow: (id: string, flow: any) => api.put(`/bots/${id}/flow`, flow),
  
  updateBotSettings: (id: string, settings: any) => api.put(`/bots/${id}/settings`, settings),
  
  testBot: (id: string, message: string) => api.post(`/bots/${id}/test`, { message }),
  
  getBotAnalytics: (id: string, params?: {
    startDate?: string
    endDate?: string
    granularity?: 'hour' | 'day' | 'week' | 'month'
  }) => api.get(`/bots/${id}/analytics`, { params }),
  
  getBotConversations: (id: string, params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }) => api.get(`/bots/${id}/conversations`, { params }),
  
  getBotTemplates: () => api.get('/bots/templates'),
  
  createBotFromTemplate: (templateId: string, botData: any) => 
    api.post(`/bots/templates/${templateId}/create`, botData),
  
  exportBot: (id: string) => api.get(`/bots/${id}/export`),
  
    importBot: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/bots/import', formData)
  },

  deployBot: (id: string, platforms: string[]) =>
    api.post(`/bots/${id}/deploy`, { platforms }),

  getBotMetrics: (id: string) => api.get(`/bots/${id}/metrics`),

  updateBotTraining: (id: string, trainingData: any) =>
    api.put(`/bots/${id}/training`, trainingData),

  getBotLogs: (id: string, params?: {
    page?: number
    limit?: number
    level?: 'info' | 'warn' | 'error'
    startDate?: string
    endDate?: string
  }) => api.get(`/bots/${id}/logs`, { params })
}

// RAG API
export const ragAPI = {
  // Document processing
  processDocument: (file: File, options?: {
    chunkSize?: number
    chunkOverlap?: number
  }) => {
    const formData = new FormData()
    formData.append('file', file)
    if (options) {
      formData.append('options', JSON.stringify(options))
    }
    return api.post('/rag/process', formData)
  },

  // Embeddings
  createEmbedding: (text: string, model?: string) =>
    api.post('/rag/embed', { text, model }),

  createBatchEmbeddings: (texts: string[], model?: string) =>
    api.post('/rag/embed/batch', { texts, model }),

  embedDocument: (documentId: string, options?: {
    model?: string
    batchSize?: number
  }) => api.post(`/rag/embed/document/${documentId}`, options),

  // Vector search
  searchSimilar: (query: string, options?: {
    topK?: number
    minScore?: number
    documentIds?: string[]
    documentTypes?: string[]
  }) => api.post('/rag/search', { query, ...options }),

  // RAG Chat
  chatWithDocuments: (message: string, options?: {
    useRAG?: boolean
    topK?: number
    model?: string
    temperature?: number
    maxTokens?: number
  }) => api.post('/rag/chat', { message, ...options }),

  // Ollama integration
  testOllamaConnection: (apiUrl: string) =>
    api.post('/rag/ollama/test', { apiUrl }),

  listOllamaModels: (apiUrl: string) =>
    api.post('/rag/ollama/models', { apiUrl }),

  pullOllamaModel: (apiUrl: string, model: string) =>
    api.post('/rag/ollama/pull', { apiUrl, model }),

  // Vector store management
  getVectorStoreStats: () => api.get('/rag/stats'),

  deleteDocumentEmbeddings: (documentId: string) =>
    api.delete(`/rag/documents/${documentId}/embeddings`),

  reembedDocument: (documentId: string, model?: string) =>
    api.post(`/rag/documents/${documentId}/reembed`, { model }),

  clearVectorStore: () => api.delete('/rag/clear'),

  // Health check
  ragHealthCheck: () => api.get('/rag/health')
}

export default api
