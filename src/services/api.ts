import axios from 'axios'
import { store } from '../store/store'
import { logout } from '../store/slices/authSlice'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
    // Only logout if it's a 401 and we're actually authenticated
    // This prevents logout on initial failed requests during token validation
    if (error.response?.status === 401 && store.getState().auth.isAuthenticated) {
      store.dispatch(logout())
    }
    return Promise.reject(error)
  }
)

// Authentication API (comprehensive)
export const authAPI = {
  // User registration
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username?: string;
  }) => api.post('/auth/register', userData),

  // User login
  login: (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => api.post('/auth/login', credentials),

  // User logout
  logout: () => api.post('/auth/logout'),

  // Forgot password
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  // Reset password
  resetPassword: (data: {
    token: string;
    password: string;
  }) => api.post('/auth/reset-password', data),

  // Verify email
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),

  // Change password (authenticated user)
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.post('/auth/change-password', data),

  // Get current user profile
  getProfile: () => api.get('/auth/me'),

  // Update current user profile
  updateProfile: (data: {
    profile?: any;
    preferences?: any;
  }) => api.put('/auth/profile', data),
}

// Chat API
export const chatAPI = {
  sendMessage: (message: { content: string; sessionId?: string; attachments?: File[]; model?: string }) => {
    const formData = new FormData()
    formData.append('content', message.content)
    if (message.sessionId) formData.append('sessionId', message.sessionId)
    if (message.model) formData.append('model', message.model)
    if (message.attachments) {
      message.attachments.forEach(file => formData.append('attachments', file))
    }
    return api.post('/chat/send', formData)
  },
  
  getHistory: (sessionId: string) =>
    api.get(`/chat/history/${sessionId}`),
    
  getHandoffStatus: (handoffId: string) =>
    api.get(`/handoffs/${handoffId}`),
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

// Web Scraping API
export const webScrapingAPI = {
  getSettings: () => api.get('/web-scraping/settings'),
  updateSettings: (settings: any) => api.put('/web-scraping/settings', settings),
  addUrl: (url: string, name: string, description?: string) => 
    api.post('/web-scraping/urls', { url, name, description }),
  removeUrl: (id: string) => api.delete(`/web-scraping/urls/${id}`),
  scrapeUrl: (id: string) => api.post(`/web-scraping/scrape/${id}`),
  getScrapedContent: () => api.get('/web-scraping/content'),
  searchWebContent: (query: string, topK = 5) => 
    api.post('/web-scraping/search', { query, topK }),
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

// Agent Management API
export const agentAPI = {
  // Get all agents with filtering
  getAgents: (params?: {
    status?: string;
    department?: string;
    skills?: string[];
    availability?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/agents', { params }),

  // Get available agents for handoff
  getAvailableAgents: (params?: {
    skills?: string[];
    departments?: string[];
    languages?: string[];
    priority?: string;
  }) => api.get('/agents/available', { params }),

  // Get specific agent
  getAgent: (id: string) => api.get(`/agents/${id}`),

  // Create new agent
  createAgent: (agentData: any) => api.post('/agents', agentData),

  // Update agent
  updateAgent: (id: string, agentData: any) => api.put(`/agents/${id}`, agentData),

  // Update agent status
  updateAgentStatus: (id: string, status: string) =>
    api.patch(`/agents/${id}/status`, { status }),

  // Update agent availability
  updateAgentAvailability: (id: string, availability: {
    isOnline?: boolean;
    maxConcurrentChats?: number;
  }) => api.patch(`/agents/${id}/availability`, availability),

  // Deactivate agent
  deactivateAgent: (id: string) => api.delete(`/agents/${id}`),

  // Get agent statistics
  getAgentStats: (id: string, period?: string) =>
    api.get(`/agents/${id}/stats`, { params: { period } }),

  // Get agent analytics
  getAgentAnalytics: (id: string, dateRange?: { start: string; end: string }) =>
    api.get(`/agents/${id}/analytics`, {
      params: dateRange ? {
        startDate: dateRange.start,
        endDate: dateRange.end
      } : {}
    }),

  // Get dashboard summary
  getDashboardSummary: () => api.get('/agents/dashboard/summary'),

  // Get current agent profile
  getCurrentAgent: () => api.get('/agents/me'),

  // Update agent heartbeat
  updateHeartbeat: () => api.post('/agents/me/heartbeat'),

  // Set agent offline
  setOffline: () => api.post('/agents/me/offline'),
}

// Handoff Management API
export const handoffAPI = {
  // Get all handoff requests with filtering
  getHandoffs: (params?: {
    status?: string;
    priority?: string;
    category?: string;
    agentId?: string;
    platform?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get('/handoffs', { params }),

  // Get handoff queue
  getQueue: (params?: {
    skills?: string[];
    departments?: string[];
    languages?: string[];
  }) => api.get('/handoffs/queue', { params }),

  // Get specific handoff request
  getHandoff: (id: string) => api.get(`/handoffs/${id}`),

  // Create new handoff request
  createHandoff: (handoffData: any) => api.post('/handoffs', handoffData),

  // Assign handoff to agent
  assignHandoff: (id: string, agentId: string) =>
    api.post(`/handoffs/${id}/assign`, { agentId }),

  // Agent accepts handoff
  acceptHandoff: (id: string, agentId: string) =>
    api.post(`/handoffs/${id}/accept`, { agentId }),

  // Agent declines handoff
  declineHandoff: (id: string, agentId: string, reason?: string) =>
    api.post(`/handoffs/${id}/decline`, { agentId, reason }),

  // Complete handoff
  completeHandoff: (id: string, agentId: string, resolution?: any) =>
    api.post(`/handoffs/${id}/complete`, { agentId, resolution }),

  // Escalate handoff
  escalateHandoff: (id: string, reason: string, escalatedBy?: string) =>
    api.post(`/handoffs/${id}/escalate`, { reason, escalatedBy }),

  // Add note to handoff
  addNote: (id: string, content: string, author?: string, isInternal?: boolean) =>
    api.post(`/handoffs/${id}/notes`, { content, author, isInternal }),

  // Get handoff statistics
  getStats: (period?: string) =>
    api.get('/handoffs/stats/summary', { params: { period } }),
}

// Roles API
export const rolesAPI = {
  getRoles: (params?: {
    type?: string
    status?: string
    search?: string
  }) => api.get('/roles', { params }),
  
  getRole: (id: string) => api.get(`/roles/${id}`),
  
  createRole: (roleData: any) => api.post('/roles', roleData),
  
  updateRole: (id: string, roleData: any) => api.put(`/roles/${id}`, roleData),
  
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  
  updateRoleStatus: (id: string, status: string) => api.patch(`/roles/${id}/status`, { status }),
  
  getRoleStats: () => api.get('/roles/stats'),
  
  initializeRoles: () => api.post('/roles/initialize'),
}

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
  
  publishBot: (id: string) => api.post(`/bots/${id}/publish`),
  
  unpublishBot: (id: string) => api.post(`/bots/${id}/unpublish`),
  
  updateBotFlow: (id: string, flow: any) => api.put(`/bots/${id}/flow`, flow),
  
  updateBotSettings: (id: string, settings: any) => api.put(`/bots/${id}/settings`, settings),
  
  testBot: (id: string, message: string, sessionId?: string) => api.post(`/bots/${id}/test`, { message, sessionId }),
  
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

// OpenAI API
export const openaiAPI = {
  // Chat
  chat: (message: string, options?: {
    model?: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  }) => api.post('/openai/chat', { message, ...options }),

  // RAG Chat
  ragChat: (message: string, options?: {
    useRAG?: boolean
    topK?: number
    model?: string
    temperature?: number
    maxTokens?: number
  }) => api.post('/openai/rag-chat', { message, ...options }),

  // Embeddings
  createEmbedding: (text: string, model?: string) =>
    api.post('/openai/embeddings', { text, model }),

  // Test connection
  testConnection: () => api.post('/openai/test'),

  // Available models
  getModels: () => Promise.resolve({
    data: {
      chat: [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
        { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest GPT-4 with improved performance' },
      ],
      embedding: [
        { id: 'text-embedding-ada-002', name: 'Ada v2', description: 'Most capable embedding model' },
        { id: 'text-embedding-3-small', name: 'Embedding v3 Small', description: 'Smaller, faster embedding model' },
        { id: 'text-embedding-3-large', name: 'Embedding v3 Large', description: 'Most capable embedding model' },
      ]
    }
  })
}

// Message Reactions API
export const reactionsAPI = {
  // Submit message reaction
  submitReaction: (messageId: string, reaction: 'like' | 'dislike' | null, sessionId?: string) =>
    api.post(`/messages/${messageId}/reaction`, { reaction, sessionId }),

  // Get reaction analytics
  getAnalytics: () => api.get('/messages/reactions/analytics'),
}

// User Management API
export const userAPI = {
  // Get all users with filtering and pagination
  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
    department?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/users', { params }),

  // Get user statistics
  getUserStats: () => api.get('/users/stats'),

  // Search users
  searchUsers: (query: string, limit?: number) => 
    api.get('/users/search', { params: { q: query, limit } }),

  // Get user by ID
  getUser: (id: string) => api.get(`/users/${id}`),

  // Create new user
  createUser: (userData: {
    email: string;
    username?: string;
    password?: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
      phone?: string;
      department?: string;
      jobTitle?: string;
      manager?: string;
      timezone?: string;
      language?: string;
    };
    permissions?: any;
    preferences?: any;
    sendInvite?: boolean;
  }) => api.post('/users', userData),

  // Update user
  updateUser: (id: string, userData: any) => api.put(`/users/${id}`, userData),

  // Update user status
  updateUserStatus: (id: string, status: string) => 
    api.patch(`/users/${id}/status`, { status }),

  // Update user password
  updateUserPassword: (id: string, data: {
    newPassword: string;
    currentPassword?: string;
    forceChange?: boolean;
  }) => api.patch(`/users/${id}/password`, data),

  // Upload user avatar
  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Resend user invitation
  resendInvitation: (id: string) => api.post(`/users/${id}/resend-invitation`),

  // Delete user (soft delete)
  deleteUser: (id: string) => api.delete(`/users/${id}`),

  // Restore deleted user
  restoreUser: (id: string) => api.post(`/users/${id}/restore`),

  // Get available roles
  getRoles: () => api.get('/users/roles/list'),
}

// Channel Accounts API
export const channelAccountsAPI = {
  // Get all channel accounts with filtering
  getChannelAccounts: (params?: {
    platform?: string;
    status?: string;
    userId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/channel-accounts', { params }),

  // Get accounts by platform
  getAccountsByPlatform: (platform: string, params?: {
    userId?: string;
    status?: string;
  }) => api.get(`/channel-accounts/platform/${platform}`, { params }),

  // Get account details
  getAccountDetails: (id: string) => api.get(`/channel-accounts/${id}`),

  // Create new account
  createAccount: (accountData: {
    accountId: string;
    name: string;
    platform: string;
    details?: any;
    credentials?: any;
    settings?: any;
    botId: string;
    userId: string;
    organizationId?: string;
  }) => api.post('/channel-accounts', accountData),

  // Update account
  updateAccount: (id: string, updateData: any) => api.put(`/channel-accounts/${id}`, updateData),

  // Delete account
  deleteAccount: (id: string) => api.delete(`/channel-accounts/${id}`),

  // Get account conversations
  getAccountConversations: (id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get(`/channel-accounts/${id}/conversations`, { params }),

  // Get account analytics
  getAccountAnalytics: (id: string, params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get(`/channel-accounts/${id}/analytics`, { params }),
}

// Conversations API
export const conversationsAPI = {
  // Get all conversations with filtering
  getConversations: (params?: {
    platform?: string;
    channelAccountId?: string;
    botId?: string;
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) => api.get('/conversations', { params }),

  // Get conversations by platform
  getConversationsByPlatform: (platform: string, params?: {
    channelAccountId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/conversations/platform/${platform}`, { params }),

  // Get conversations for specific account
  getAccountConversations: (accountId: string, params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get(`/conversations/account/${accountId}`, { params }),

  // Get conversation details
  getConversationDetails: (id: string) => api.get(`/conversations/${id}`),

  // Get conversation analytics summary
  getAnalyticsSummary: (params?: {
    platform?: string;
    channelAccountId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/conversations/analytics/summary', { params }),
}

// Role Management API


export default api
