import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Document {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'txt' | 'csv'
  size: number
  uploadedAt: Date
  status: 'uploading' | 'processing' | 'indexed' | 'error'
  progress?: number
  error?: string
  indexedAt?: Date
}

interface KnowledgeBaseState {
  documents: Document[]
  isLoading: boolean
  error: string | null
  uploadProgress: { [key: string]: number }
}

const initialState: KnowledgeBaseState = {
  documents: [],
  isLoading: false,
  error: null,
  uploadProgress: {},
}

const knowledgeBaseSlice = createSlice({
  name: 'knowledgeBase',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload)
    },
    updateDocument: (state, action: PayloadAction<Partial<Document> & { id: string }>) => {
      const index = state.documents.findIndex(d => d.id === action.payload.id)
      if (index !== -1) {
        state.documents[index] = { ...state.documents[index], ...action.payload }
      }
    },
    removeDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(d => d.id !== action.payload)
    },
    setUploadProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      state.uploadProgress[action.payload.id] = action.payload.progress
    },
    clearUploadProgress: (state, action: PayloadAction<string>) => {
      delete state.uploadProgress[action.payload]
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearDocuments: (state) => {
      state.documents = []
    },
  },
})

export const { 
  setLoading, 
  addDocument, 
  updateDocument, 
  removeDocument, 
  setUploadProgress, 
  clearUploadProgress, 
  setError, 
  clearDocuments 
} = knowledgeBaseSlice.actions
export default knowledgeBaseSlice.reducer
