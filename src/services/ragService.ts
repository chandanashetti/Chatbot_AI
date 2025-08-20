import api from './api'

export interface DocumentChunk {
  id: string
  content: string
  metadata: {
    page?: number
    section?: string
    title?: string
    source?: string
    chunkIndex: number
  }
}

export interface ProcessedDocument {
  id: string
  name: string
  type: string
  chunks: DocumentChunk[]
  totalChunks: number
}

export interface EmbeddingRequest {
  text: string
  model?: string
}

export interface EmbeddingResponse {
  embedding: number[]
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

export interface SearchRequest {
  query: string
  topK?: number
  minScore?: number
  documentIds?: string[]
  documentTypes?: string[]
}

export interface SearchResult {
  chunk: DocumentChunk
  score: number
  document: {
    id: string
    name: string
    type: string
  }
}

export interface ChatRequest {
  message: string
  useRAG?: boolean
  searchResults?: SearchResult[]
  settings?: {
    model: string
    temperature: number
    maxTokens: number
    apiUrl?: string
  }
}

export interface ChatResponse {
  response: string
  searchResults?: SearchResult[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

class RAGService {
  private baseURL: string
  
  constructor() {
    this.baseURL = '/api/rag'
  }

  // Document processing
  async processDocument(file: File, options?: {
    chunkSize?: number
    chunkOverlap?: number
    extractImages?: boolean
  }): Promise<ProcessedDocument> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options) {
      formData.append('options', JSON.stringify(options))
    }

    const response = await api.post(`${this.baseURL}/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    
    return response.data
  }

  // Embedding operations
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await api.post(`${this.baseURL}/embed`, request)
    return response.data
  }

  async createBatchEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse[]> {
    const response = await api.post(`${this.baseURL}/embed/batch`, {
      texts,
      model
    })
    return response.data
  }

  async embedDocument(documentId: string, options?: {
    model?: string
    batchSize?: number
    onProgress?: (progress: number) => void
  }): Promise<void> {
    const response = await api.post(`${this.baseURL}/embed/document/${documentId}`, {
      model: options?.model,
      batchSize: options?.batchSize || 10
    })
    
    // If streaming progress updates are supported
    if (options?.onProgress && response.data.jobId) {
      this.trackEmbeddingProgress(response.data.jobId, options.onProgress)
    }
  }

  private async trackEmbeddingProgress(jobId: string, onProgress: (progress: number) => void): Promise<void> {
    const pollInterval = 1000 // 1 second
    
    const poll = async () => {
      try {
        const response = await api.get(`${this.baseURL}/jobs/${jobId}`)
        const { status, progress } = response.data
        
        onProgress(progress)
        
        if (status === 'completed' || status === 'failed') {
          return
        }
        
        setTimeout(poll, pollInterval)
      } catch (error) {
        console.error('Error polling embedding progress:', error)
      }
    }
    
    poll()
  }

  // Vector search
  async searchSimilar(request: SearchRequest): Promise<SearchResult[]> {
    const response = await api.post(`${this.baseURL}/search`, request)
    return response.data
  }

  async searchByEmbedding(embedding: number[], options?: {
    topK?: number
    minScore?: number
    documentIds?: string[]
    documentTypes?: string[]
  }): Promise<SearchResult[]> {
    const response = await api.post(`${this.baseURL}/search/embedding`, {
      embedding,
      ...options
    })
    return response.data
  }

  // RAG Chat
  async chatWithDocuments(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post(`${this.baseURL}/chat`, request)
    return response.data
  }

  // Ollama integration
  async testOllamaConnection(apiUrl: string): Promise<{
    connected: boolean
    models: string[]
    version?: string
  }> {
    const response = await api.post(`${this.baseURL}/ollama/test`, { apiUrl })
    return response.data
  }

  async listOllamaModels(apiUrl: string): Promise<string[]> {
    const response = await api.post(`${this.baseURL}/ollama/models`, { apiUrl })
    return response.data
  }

  async pullOllamaModel(apiUrl: string, model: string, onProgress?: (progress: number) => void): Promise<void> {
    const response = await api.post(`${this.baseURL}/ollama/pull`, {
      apiUrl,
      model
    })
    
    if (onProgress && response.data.jobId) {
      this.trackModelPullProgress(response.data.jobId, onProgress)
    }
  }

  private async trackModelPullProgress(jobId: string, onProgress: (progress: number) => void): Promise<void> {
    const pollInterval = 2000 // 2 seconds
    
    const poll = async () => {
      try {
        const response = await api.get(`${this.baseURL}/jobs/${jobId}`)
        const { status, progress } = response.data
        
        onProgress(progress)
        
        if (status === 'completed' || status === 'failed') {
          return
        }
        
        setTimeout(poll, pollInterval)
      } catch (error) {
        console.error('Error polling model pull progress:', error)
      }
    }
    
    poll()
  }

  // Vector store management
  async getVectorStoreStats(): Promise<{
    totalDocuments: number
    totalChunks: number
    embeddedChunks: number
    storageSize: number
    models: string[]
  }> {
    const response = await api.get(`${this.baseURL}/stats`)
    return response.data
  }

  async deleteDocumentEmbeddings(documentId: string): Promise<void> {
    await api.delete(`${this.baseURL}/documents/${documentId}/embeddings`)
  }

  async reembedDocument(documentId: string, model?: string): Promise<void> {
    await api.post(`${this.baseURL}/documents/${documentId}/reembed`, { model })
  }

  async clearVectorStore(): Promise<void> {
    await api.delete(`${this.baseURL}/clear`)
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: {
      vectorStore: boolean
      embeddings: boolean
      ollama?: boolean
    }
    uptime: number
  }> {
    const response = await api.get(`${this.baseURL}/health`)
    return response.data
  }
}

export const ragService = new RAGService()
export default ragService
