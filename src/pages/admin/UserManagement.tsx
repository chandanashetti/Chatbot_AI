import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { 
  addUser, 
  updateUser, 
  deleteUser, 
  setFilters,
  addActivity,
  User,
  UserRole,
  UserStatus
} from '../../store/slices/userSlice'
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Eye,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const UserManagement = () => {
  const dispatch = useDispatch()
  const { users, filters } = useSelector((state: RootState) => state.users)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      // In a real app, this would call the API
      // const response = await usersAPI.getUsers({
      //   page: pagination.currentPage,
      //   limit: pagination.itemsPerPage,
      //   role: filters.role !== 'all' ? filters.role : undefined,
      //   status: filters.status !== 'all' ? filters.status : undefined,
      //   department: filters.department || undefined,
      //   search: filters.search || undefined
      // })
      // dispatch(setUsers(response.data.users))
      // dispatch(setPagination({ totalPages: response.data.totalPages, totalItems: response.data.totalItems }))
    } catch (error) {
      toast.error('Failed to load users')
    }
  }

  const handleCreateUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(addUser(userData))
    dispatch(addActivity({
      userId: '1', // Current user ID
      action: 'User Created',
      module: 'Users',
      details: `Created user: ${userData.name}`
    }))
    toast.success('User created successfully!')
    setShowCreateModal(false)
  }

  const handleUpdateUser = (userData: Partial<User> & { id: string }) => {
    dispatch(updateUser(userData))
    dispatch(addActivity({
      userId: '1',
      action: 'User Updated',
      module: 'Users',
      details: `Updated user: ${userData.name || 'Unknown'}`
    }))
    toast.success('User updated successfully!')
    setShowEditModal(false)
    setSelectedUser(null)
  }

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user && window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      dispatch(deleteUser(userId))
      dispatch(addActivity({
        userId: '1',
        action: 'User Deleted',
        module: 'Users',
        details: `Deleted user: ${user.name}`
      }))
      toast.success('User deleted successfully!')
    }
  }



  const handleStatusChange = (userId: string, status: UserStatus) => {
    dispatch(updateUser({ id: userId, status }))
    const user = users.find(u => u.id === userId)
    dispatch(addActivity({
      userId: '1',
      action: 'Status Updated',
      module: 'Users',
      details: `Changed status for ${user?.name} to ${status}`
    }))
    toast.success('User status updated successfully!')
  }

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first')
      return
    }

    switch (action) {
      case 'activate':
        selectedUsers.forEach(userId => handleStatusChange(userId, 'active'))
        break
      case 'deactivate':
        selectedUsers.forEach(userId => handleStatusChange(userId, 'inactive'))
        break
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
          selectedUsers.forEach(userId => dispatch(deleteUser(userId)))
          toast.success(`${selectedUsers.length} users deleted`)
        }
        break
    }
    setSelectedUsers([])
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />
      case 'manager': return <Users className="w-4 h-4 text-blue-500" />
      case 'operator': return <Settings className="w-4 h-4 text-green-500" />
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />
      default: return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-success-500" />
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-500" />
      case 'pending': return <Clock className="w-4 h-4 text-warning-500" />
      case 'suspended': return <AlertCircle className="w-4 h-4 text-error-500" />
      default: return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      case 'pending': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
      case 'suspended': return 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = filters.role === 'all' || user.role === filters.role
    const matchesStatus = filters.status === 'all' || user.status === filters.status
    const matchesDepartment = !filters.department || user.department?.toLowerCase().includes(filters.department.toLowerCase())
    const matchesSearch = !filters.search || 
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesRole && matchesStatus && matchesDepartment && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">User Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage users, roles, and permissions for your AI chatbot platform
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {/* Handle export */}}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => {/* Handle import */}}
            className="btn-secondary flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-2xl">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {users.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Users</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-2xl">
              <UserCheck className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {users.filter(u => u.status === 'active').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-2xl">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {users.filter(u => u.status === 'pending').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-accent-100 dark:bg-accent-900/20 rounded-2xl">
              <Activity className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Online Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.role}
              onChange={(e) => dispatch(setFilters({ role: e.target.value as any }))}
              className="input-field min-w-32"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => dispatch(setFilters({ status: e.target.value as any }))}
              className="input-field min-w-32"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <input
              type="text"
              placeholder="Department"
              value={filters.department}
              onChange={(e) => dispatch(setFilters({ department: e.target.value }))}
              className="input-field min-w-32"
            />
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center justify-between mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-200 dark:border-primary-800">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="btn-ghost text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 px-3 py-1 text-sm"
              >
                <UserCheck className="w-4 h-4 mr-1" />
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="btn-ghost text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 px-3 py-1 text-sm"
              >
                <UserX className="w-4 h-4 mr-1" />
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="btn-ghost text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 px-3 py-1 text-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id))
                      } else {
                        setSelectedUsers([])
                      }
                    }}
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center text-white font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {user.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(user.status)}
                      <span className={`px-2 py-1 rounded-xl text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-900 dark:text-slate-100">
                      {user.department || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowEditModal(true)
                        }}
                        className="btn-ghost p-2 text-slate-600 hover:text-primary-600"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)}
                        className="text-xs border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-800"
                        title="Change status"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn-ghost p-2 text-slate-600 hover:text-error-600"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No users found matching your filters
            </p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSubmit={handleUpdateUser}
        />
      )}
    </div>
  )
}

// Create User Modal Component
const CreateUserModal = ({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void
  onSubmit: (userData: any) => void 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'viewer' as UserRole,
    status: 'pending' as UserStatus,
    department: '',
    phoneNumber: '',
    timezone: 'UTC',
    language: 'en',
    twoFactorEnabled: false,
    loginAttempts: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Create New User
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="input-field"
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input-field"
                placeholder="Customer Support"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input-field"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="input-field"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Shanghai">Shanghai</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="twoFactor"
              checked={formData.twoFactorEnabled}
              onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="twoFactor" className="text-sm text-slate-700 dark:text-slate-300">
              Enable Two-Factor Authentication
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit User Modal Component
const EditUserModal = ({ 
  user, 
  onClose, 
  onSubmit 
}: { 
  user: User
  onClose: () => void
  onSubmit: (userData: any) => void 
}) => {
  const [formData, setFormData] = useState({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    department: user.department || '',
    phoneNumber: user.phoneNumber || '',
    timezone: user.timezone || 'UTC',
    language: user.language || 'en',
    twoFactorEnabled: user.twoFactorEnabled
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Edit User: {user.name}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="input-field"
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="editTwoFactor"
              checked={formData.twoFactorEnabled}
              onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="editTwoFactor" className="text-sm text-slate-700 dark:text-slate-300">
              Enable Two-Factor Authentication
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserManagement
