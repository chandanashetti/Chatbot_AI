import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type UserRole = 'superadministrator' | 'admin' | 'manager' | 'operator' | 'viewer' | 'agent'
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export interface Permission {
  id: string
  name: string
  description: string
  module: string
}

export interface UserPermissions {
  dashboard: {
    view: boolean
    export: boolean
  }
  users: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    manageRoles: boolean
  }
  integrations: {
    view: boolean
    create: boolean
    edit: boolean
    delete: boolean
    test: boolean
  }
  knowledgeBase: {
    view: boolean
    upload: boolean
    edit: boolean
    delete: boolean
    reindex: boolean
  }
  analytics: {
    view: boolean
    export: boolean
    advanced: boolean
  }
  logs: {
    view: boolean
    export: boolean
    delete: boolean
  }
  settings: {
    view: boolean
    edit: boolean
    system: boolean
  }
  chat: {
    view: boolean
    moderate: boolean
    export: boolean
  }
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  status: UserStatus
  permissions: UserPermissions
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  department?: string
  phoneNumber?: string
  timezone?: string
  language?: string
  twoFactorEnabled: boolean
  loginAttempts: number
  lastPasswordChange?: Date
}

export interface UserActivity {
  id: string
  userId: string
  action: string
  module: string
  details: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

interface UserState {
  users: User[]
  currentUser: User | null
  activities: UserActivity[]
  isLoading: boolean
  error: string | null
  filters: {
    role: UserRole | 'all'
    status: UserStatus | 'all'
    department: string
    search: string
  }
  pagination: {
    currentPage: number
    totalPages: number
    itemsPerPage: number
    totalItems: number
  }
}

// Default permissions for each role
const getDefaultPermissions = (role: UserRole): UserPermissions => {
  const basePermissions: UserPermissions = {
    dashboard: { view: false, export: false },
    users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
    integrations: { view: false, create: false, edit: false, delete: false, test: false },
    knowledgeBase: { view: false, upload: false, edit: false, delete: false, reindex: false },
    analytics: { view: false, export: false, advanced: false },
    logs: { view: false, export: false, delete: false },
    settings: { view: false, edit: false, system: false },
    chat: { view: false, moderate: false, export: false }
  }

  switch (role) {
    case 'superadministrator':
      return {
        dashboard: { view: true, export: true },
        users: { view: true, create: true, edit: true, delete: true, manageRoles: true },
        integrations: { view: true, create: true, edit: true, delete: true, test: true },
        knowledgeBase: { view: true, upload: true, edit: true, delete: true, reindex: true },
        analytics: { view: true, export: true, advanced: true },
        logs: { view: true, export: true, delete: true },
        settings: { view: true, edit: true, system: true },
        chat: { view: true, moderate: true, export: true }
      }
    case 'admin':
      return {
        dashboard: { view: true, export: true },
        users: { view: true, create: true, edit: true, delete: false, manageRoles: false },
        integrations: { view: true, create: true, edit: true, delete: false, test: true },
        knowledgeBase: { view: true, upload: true, edit: true, delete: false, reindex: true },
        analytics: { view: true, export: true, advanced: true },
        logs: { view: true, export: true, delete: false },
        settings: { view: true, edit: true, system: false },
        chat: { view: true, moderate: true, export: true }
      }
    case 'manager':
      return {
        dashboard: { view: true, export: true },
        users: { view: true, create: false, edit: false, delete: false, manageRoles: false },
        integrations: { view: true, create: false, edit: false, delete: false, test: true },
        knowledgeBase: { view: true, upload: true, edit: true, delete: false, reindex: false },
        analytics: { view: true, export: true, advanced: false },
        logs: { view: true, export: false, delete: false },
        settings: { view: true, edit: false, system: false },
        chat: { view: true, moderate: true, export: true }
      }
    case 'operator':
      return {
        dashboard: { view: true, export: false },
        users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
        integrations: { view: true, create: false, edit: false, delete: false, test: false },
        knowledgeBase: { view: true, upload: true, edit: false, delete: false, reindex: false },
        analytics: { view: true, export: false, advanced: false },
        logs: { view: true, export: false, delete: false },
        settings: { view: false, edit: false, system: false },
        chat: { view: true, moderate: false, export: false }
      }
    case 'viewer':
      return {
        dashboard: { view: true, export: false },
        users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
        integrations: { view: true, create: false, edit: false, delete: false, test: false },
        knowledgeBase: { view: true, upload: false, edit: false, delete: false, reindex: false },
        analytics: { view: true, export: false, advanced: false },
        logs: { view: true, export: false, delete: false },
        settings: { view: false, edit: false, system: false },
        chat: { view: true, moderate: false, export: false }
      }
    case 'agent':
      return {
        dashboard: { view: true, export: false },
        users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
        integrations: { view: false, create: false, edit: false, delete: false, test: false },
        knowledgeBase: { view: true, upload: false, edit: false, delete: false, reindex: false },
        analytics: { view: true, export: false, advanced: false },
        logs: { view: true, export: false, delete: false },
        settings: { view: false, edit: false, system: false },
        chat: { view: true, moderate: true, export: false }
      }
    default:
      return basePermissions
  }
}

const initialState: UserState = {
  users: [
    {
      id: '1',
      email: 'admin@chatbot.ai',
      name: 'System Administrator',
      role: 'superadministrator',
      status: 'active',
      permissions: getDefaultPermissions('superadministrator'),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      department: 'IT',
      timezone: 'UTC',
      language: 'en',
      twoFactorEnabled: true,
      loginAttempts: 0
    },
    {
      id: '2',
      email: 'manager@chatbot.ai',
      name: 'Sarah Johnson',
      role: 'manager',
      status: 'active',
      permissions: getDefaultPermissions('manager'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      department: 'Customer Success',
      timezone: 'America/New_York',
      language: 'en',
      twoFactorEnabled: false,
      loginAttempts: 0,
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '3',
      email: 'operator@chatbot.ai',
      name: 'Mike Chen',
      role: 'operator',
      status: 'active',
      permissions: getDefaultPermissions('operator'),
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date(),
      department: 'Support',
      timezone: 'Asia/Shanghai',
      language: 'en',
      twoFactorEnabled: true,
      loginAttempts: 0,
      lastLogin: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    {
      id: '4',
      email: 'viewer@chatbot.ai',
      name: 'Emma Davis',
      role: 'viewer',
      status: 'inactive',
      permissions: getDefaultPermissions('viewer'),
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date(),
      department: 'Analytics',
      timezone: 'Europe/London',
      language: 'en',
      twoFactorEnabled: false,
      loginAttempts: 0,
      lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
    }
  ],
  currentUser: null,
  activities: [
    {
      id: '1',
      userId: '1',
      action: 'User Created',
      module: 'Users',
      details: 'Created user: Mike Chen',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      ipAddress: '192.168.1.1'
    },
    {
      id: '2',
      userId: '2',
      action: 'Settings Updated',
      module: 'Settings',
      details: 'Updated bot temperature settings',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      ipAddress: '192.168.1.2'
    },
    {
      id: '3',
      userId: '3',
      action: 'Document Uploaded',
      module: 'Knowledge Base',
      details: 'Uploaded FAQ document',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      ipAddress: '192.168.1.3'
    }
  ],
  isLoading: false,
  error: null,
  filters: {
    role: 'all',
    status: 'all',
    department: '',
    search: ''
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 4
  }
}

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload
    },
    addUser: (state, action: PayloadAction<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newUser: User = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: getDefaultPermissions(action.payload.role)
      }
      state.users.push(newUser)
      state.pagination.totalItems += 1
    },
    updateUser: (state, action: PayloadAction<Partial<User> & { id: string }>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id)
      if (index !== -1) {
        state.users[index] = {
          ...state.users[index],
          ...action.payload,
          updatedAt: new Date()
        }
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload)
      state.pagination.totalItems -= 1
    },
    updateUserRole: (state, action: PayloadAction<{ userId: string; role: UserRole }>) => {
      const user = state.users.find(u => u.id === action.payload.userId)
      if (user) {
        user.role = action.payload.role
        user.permissions = getDefaultPermissions(action.payload.role)
        user.updatedAt = new Date()
      }
    },
    updateUserPermissions: (state, action: PayloadAction<{ userId: string; permissions: Partial<UserPermissions> }>) => {
      const user = state.users.find(u => u.id === action.payload.userId)
      if (user) {
        user.permissions = { ...user.permissions, ...action.payload.permissions }
        user.updatedAt = new Date()
      }
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
    addActivity: (state, action: PayloadAction<Omit<UserActivity, 'id' | 'timestamp'>>) => {
      const newActivity: UserActivity = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date()
      }
      state.activities.unshift(newActivity)
    },
    setActivities: (state, action: PayloadAction<UserActivity[]>) => {
      state.activities = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<UserState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action: PayloadAction<Partial<UserState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    clearUsers: (state) => {
      state.users = []
      state.pagination.totalItems = 0
    }
  }
})

export const {
  setLoading,
  setError,
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserPermissions,
  setCurrentUser,
  addActivity,
  setActivities,
  setFilters,
  setPagination,
  clearUsers
} = userSlice.actions

export default userSlice.reducer
