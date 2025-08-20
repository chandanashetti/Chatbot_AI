import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  metadata: {
    page?: number
    section?: string
    title?: string
    source?: string
    chunkIndex: number
  }
  embedding?: number[]
  createdAt: Date
}

export interface VectorStoreDocument {
  id: string
  name: string
  type: string
  chunks: DocumentChunk[]
  totalChunks: number
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'error'
  embeddingProgress: number
  lastEmbeddedAt?: Date
  error?: string
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

interface VectorStoreState {
  documents: VectorStoreDocument[]
  searchResults: SearchResult[]
  isSearching: boolean
  isEmbedding: boolean
  embeddingQueue: string[]
  searchQuery: string
  searchFilters: {
    documentTypes: string[]
    documentIds: string[]
    minScore: number
  }
  stats: {
    totalDocuments: number
    totalChunks: number
    embeddedChunks: number
    storageSize: number
  }
  error: string | null
}

const initialState: VectorStoreState = {
  documents: [],
  searchResults: [],
  isSearching: false,
  isEmbedding: false,
  embeddingQueue: [],
  searchQuery: '',
  searchFilters: {
    documentTypes: [],
    documentIds: [],
    minScore: 0.7
  },
  stats: {
    totalDocuments: 0,
    totalChunks: 0,
    embeddedChunks: 0,
    storageSize: 0
  },
  error: null
}

const vectorStoreSlice = createSlice({
  name: 'vectorStore',
  initialState,
  reducers: {
    // Document management
    addVectorDocument: (state, action: PayloadAction<VectorStoreDocument>) => {
      const existingIndex = state.documents.findIndex(doc => doc.id === action.payload.id)
      if (existingIndex >= 0) {
        state.documents[existingIndex] = action.payload
      } else {
        state.documents.push(action.payload)
      }
      vectorStoreSlice.caseReducers.updateStats(state)
    },

    removeVectorDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload)
      vectorStoreSlice.caseReducers.updateStats(state)
    },

    updateVectorDocument: (state, action: PayloadAction<{ id: string; updates: Partial<VectorStoreDocument> }>) => {
      const index = state.documents.findIndex(doc => doc.id === action.payload.id)
      if (index >= 0) {
        state.documents[index] = { ...state.documents[index], ...action.payload.updates }
      }
      vectorStoreSlice.caseReducers.updateStats(state)
    },

    // Chunk management
    addDocumentChunks: (state, action: PayloadAction<{ documentId: string; chunks: DocumentChunk[] }>) => {
      const document = state.documents.find(doc => doc.id === action.payload.documentId)
      if (document) {
        document.chunks = action.payload.chunks
        document.totalChunks = action.payload.chunks.length
        document.embeddingStatus = 'pending'
      }
      vectorStoreSlice.caseReducers.updateStats(state)
    },

    updateChunkEmbedding: (state, action: PayloadAction<{ chunkId: string; embedding: number[] }>) => {
      for (const document of state.documents) {
        const chunk = document.chunks.find(c => c.id === action.payload.chunkId)
        if (chunk) {
          chunk.embedding = action.payload.embedding
          break
        }
      }
      vectorStoreSlice.caseReducers.updateStats(state)
    },

    // Embedding management
    startEmbedding: (state, action: PayloadAction<string>) => {
      state.isEmbedding = true
      const document = state.documents.find(doc => doc.id === action.payload)
      if (document) {
        document.embeddingStatus = 'processing'
        document.embeddingProgress = 0
      }
    },

    updateEmbeddingProgress: (state, action: PayloadAction<{ documentId: string; progress: number }>) => {
      const document = state.documents.find(doc => doc.id === action.payload.documentId)
      if (document) {
        document.embeddingProgress = action.payload.progress
      }
    },

    completeEmbedding: (state, action: PayloadAction<string>) => {
      const document = state.documents.find(doc => doc.id === action.payload)
      if (document) {
        document.embeddingStatus = 'completed'
        document.embeddingProgress = 100
        document.lastEmbeddedAt = new Date()
      }
      state.isEmbedding = false
      state.embeddingQueue = state.embeddingQueue.filter(id => id !== action.payload)
      vectorStoreSlice.caseReducers.updateStats(state)
    },

    failEmbedding: (state, action: PayloadAction<{ documentId: string; error: string }>) => {
      const document = state.documents.find(doc => doc.id === action.payload.documentId)
      if (document) {
        document.embeddingStatus = 'error'
        document.error = action.payload.error
      }
      state.isEmbedding = false
      state.embeddingQueue = state.embeddingQueue.filter(id => id !== action.payload.documentId)
    },

    addToEmbeddingQueue: (state, action: PayloadAction<string>) => {
      if (!state.embeddingQueue.includes(action.payload)) {
        state.embeddingQueue.push(action.payload)
      }
    },

    // Search management
    setSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload
    },

    setSearchResults: (state, action: PayloadAction<SearchResult[]>) => {
      state.searchResults = action.payload
      state.isSearching = false
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    updateSearchFilters: (state, action: PayloadAction<Partial<VectorStoreState['searchFilters']>>) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload }
    },

    clearSearchResults: (state) => {
      state.searchResults = []
      state.searchQuery = ''
    },

    // Stats and utilities
    updateStats: (state) => {
      state.stats.totalDocuments = state.documents.length
      state.stats.totalChunks = state.documents.reduce((sum, doc) => sum + doc.totalChunks, 0)
      state.stats.embeddedChunks = state.documents.reduce((sum, doc) => 
        sum + doc.chunks.filter(chunk => chunk.embedding).length, 0
      )
      // Rough estimate of storage size (embedding vectors + metadata)
      state.stats.storageSize = state.stats.embeddedChunks * 1024 * 4 // Approx 4KB per chunk
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    clearError: (state) => {
      state.error = null
    },

    // Bulk operations
    reembedAllDocuments: (state) => {
      state.embeddingQueue = state.documents.map(doc => doc.id)
      state.documents.forEach(doc => {
        doc.embeddingStatus = 'pending'
        doc.embeddingProgress = 0
        doc.chunks.forEach(chunk => {
          chunk.embedding = undefined
        })
      })
      vectorStoreSlice.caseReducers.updateStats(state)
    },

    clearVectorStore: (state) => {
      state.documents = []
      state.searchResults = []
      state.embeddingQueue = []
      state.searchQuery = ''
      vectorStoreSlice.caseReducers.updateStats(state)
    }
  }
})

export const {
  addVectorDocument,
  removeVectorDocument,
  updateVectorDocument,
  addDocumentChunks,
  updateChunkEmbedding,
  startEmbedding,
  updateEmbeddingProgress,
  completeEmbedding,
  failEmbedding,
  addToEmbeddingQueue,
  setSearching,
  setSearchResults,
  setSearchQuery,
  updateSearchFilters,
  clearSearchResults,
  updateStats,
  setError,
  clearError,
  reembedAllDocuments,
  clearVectorStore
} = vectorStoreSlice.actions

export default vectorStoreSlice.reducer
