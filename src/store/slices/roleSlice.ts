import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { rolesAPI } from '../../services/api'

export interface Role {
  id: string
  name: string
  description: string
  type: 'system' | 'custom'
  status: 'active' | 'inactive'
  permissions: {
    dashboard: { view: boolean; export: boolean }
    users: { view: boolean; create: boolean; edit: boolean; delete: boolean; manageRoles: boolean }
    bots: { view: boolean; create: boolean; edit: boolean; delete: boolean; publish: boolean }
    agents: { view: boolean; create: boolean; edit: boolean; delete: boolean; assign: boolean }
    analytics: { view: boolean; export: boolean; advanced: boolean }
    knowledgeBase: { view: boolean; upload: boolean; edit: boolean; delete: boolean }
    settings: { view: boolean; edit: boolean; system: boolean }
    chat: { view: boolean; moderate: boolean; export: boolean }
  }
  priority: number
  color: string
  userCount: number
  isSystemRole: boolean
  createdAt: string
  updatedAt: string
  createdBy?: {
    id: string
    email: string
    profile: { firstName: string; lastName: string }
  }
}

interface RoleState {
  roles: Role[]
  currentRole: Role | null
  isLoading: boolean
  error: string | null
  filters: {
    type: string
    status: string
    search: string
  }
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const initialState: RoleState = {
  roles: [],
  currentRole: null,
  isLoading: false,
  error: null,
  filters: {
    type: 'all',
    status: 'active',
    search: ''
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  }
}

// Async thunks
export const fetchRolesAsync = createAsyncThunk(
  'roles/fetchRoles',
  async (params: { type?: string; status?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await rolesAPI.getRoles(params)
      console.log('🔍 Fetched roles from API:', response.data)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch roles')
    }
  }
)

export const createRoleAsync = createAsyncThunk(
  'roles/createRole',
  async (roleData: Partial<Role>, { rejectWithValue }) => {
    try {
      const response = await rolesAPI.createRole(roleData)
      return response.data.data.role
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to create role')
    }
  }
)

export const updateRoleAsync = createAsyncThunk(
  'roles/updateRole',
  async ({ id, roleData }: { id: string; roleData: Partial<Role> }, { rejectWithValue }) => {
    try {
      const response = await rolesAPI.updateRole(id, roleData)
      return response.data.data.role
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update role')
    }
  }
)

export const deleteRoleAsync = createAsyncThunk(
  'roles/deleteRole',
  async (roleId: string, { rejectWithValue }) => {
    try {
      await rolesAPI.deleteRole(roleId)
      return roleId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to delete role')
    }
  }
)

export const updateRoleStatusAsync = createAsyncThunk(
  'roles/updateRoleStatus',
  async ({ roleId, status }: { roleId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await rolesAPI.updateRoleStatus(roleId, status)
      return response.data.data.role
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update role status')
    }
  }
)

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setRoles: (state, action: PayloadAction<Role[]>) => {
      state.roles = action.payload
    },
    setCurrentRole: (state, action: PayloadAction<Role | null>) => {
      state.currentRole = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    addRole: (state, action: PayloadAction<Role>) => {
      state.roles.unshift(action.payload)
      state.pagination.totalCount += 1
    },
    updateRole: (state, action: PayloadAction<Role>) => {
      const index = state.roles.findIndex(role => role.id === action.payload.id)
      if (index !== -1) {
        state.roles[index] = {
          ...state.roles[index],
          ...action.payload,
          updatedAt: new Date().toISOString()
        }
      }
    },
    removeRole: (state, action: PayloadAction<string>) => {
      state.roles = state.roles.filter(role => role.id !== action.payload)
      state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1)
    }
  },
  extraReducers: (builder) => {
    // Fetch roles
    builder
      .addCase(fetchRolesAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRolesAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.roles = action.payload.roles || []
        state.pagination = action.payload.pagination || initialState.pagination
        state.error = null
      })
      .addCase(fetchRolesAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Create role
    builder
      .addCase(createRoleAsync.pending, (state) => {
        state.error = null
      })
      .addCase(createRoleAsync.fulfilled, (state, action) => {
        state.roles.unshift(action.payload)
        state.pagination.totalCount += 1
        state.error = null
      })
      .addCase(createRoleAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })

    // Update role
    builder
      .addCase(updateRoleAsync.pending, (state) => {
        state.error = null
      })
      .addCase(updateRoleAsync.fulfilled, (state, action) => {
        const index = state.roles.findIndex(role => role.id === action.payload.id)
        if (index !== -1) {
          state.roles[index] = action.payload
        }
        if (state.currentRole?.id === action.payload.id) {
          state.currentRole = action.payload
        }
        state.error = null
      })
      .addCase(updateRoleAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })

    // Delete role
    builder
      .addCase(deleteRoleAsync.pending, (state) => {
        state.error = null
      })
      .addCase(deleteRoleAsync.fulfilled, (state, action) => {
        const roleId = action.payload
        state.roles = state.roles.filter(role => role.id !== roleId)
        state.pagination.totalCount = Math.max(0, state.pagination.totalCount - 1)
        if (state.currentRole?.id === roleId) {
          state.currentRole = null
        }
        state.error = null
      })
      .addCase(deleteRoleAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })

    // Update role status
    builder
      .addCase(updateRoleStatusAsync.pending, (state) => {
        state.error = null
      })
      .addCase(updateRoleStatusAsync.fulfilled, (state, action) => {
        const index = state.roles.findIndex(role => role.id === action.payload.id)
        if (index !== -1) {
          state.roles[index] = action.payload
        }
        state.error = null
      })
      .addCase(updateRoleStatusAsync.rejected, (state, action) => {
        state.error = action.payload as string
      })
  }
})

export const {
  setLoading,
  setError,
  setRoles,
  setCurrentRole,
  setFilters,
  addRole,
  updateRole,
  removeRole
} = roleSlice.actions

export default roleSlice.reducer