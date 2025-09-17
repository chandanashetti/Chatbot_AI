import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  username?: string
  role: 'superadministrator' | 'admin' | 'manager' | 'operator' | 'viewer' | 'agent'
  status: string
  profile: {
    firstName: string
    lastName: string
    avatar?: string
    phone?: string
    department?: string
    jobTitle?: string
    timezone?: string
    language?: string
  }
  permissions: any
  preferences?: any
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Helper function to load user from localStorage
const loadUserFromStorage = (): User | null => {
  try {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  } catch (error) {
    console.error('Error loading user from localStorage:', error)
    localStorage.removeItem('user')
    return null
  }
}

const initialState: AuthState = {
  user: loadUserFromStorage(),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token') && !!loadUserFromStorage(), // Authenticated if both token and user exist
  isLoading: !!localStorage.getItem('token') && !loadUserFromStorage(), // Loading if we have a token but no user data
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    clearError: (state) => {
      state.error = null
    },
    validateTokenStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    validateTokenSuccess: (state, action: PayloadAction<{ user: User }>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    validateTokenFailure: (state) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  validateTokenStart,
  validateTokenSuccess,
  validateTokenFailure
} = authSlice.actions
export default authSlice.reducer
