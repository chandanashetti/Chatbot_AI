import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Shield,
  Activity,
  Settings,
  X,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rolesAPI } from '../../services/api';
import { RootState } from '../../store/store';

interface Permission {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  export?: boolean;
  advanced?: boolean;
  upload?: boolean;
  system?: boolean;
  manageRoles?: boolean;
  assign?: boolean;
  moderate?: boolean;
  publish?: boolean;
  accept?: boolean;
  reject?: boolean;
  manage?: boolean;
}

interface RolePermissions {
  dashboard: Permission;
  users: Permission;
  bots: Permission;
  agents: Permission;
  analytics: Permission;
  knowledgeBase: Permission;
  settings: Permission;
  chat: Permission;
  handoffs: Permission;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  status: 'active' | 'inactive';
  permissions: RolePermissions;
  priority: number;
  color: string;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  isSystemRole: boolean;
}

interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  customRoles: number;
  systemRoles: number;
  typeDistribution: {
    system?: number;
    custom?: number;
  };
}

const RoleManagement = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userPermissions = user?.permissions || {};

  const [roles, setRoles] = useState<Role[]>([]);
  const [stats, setStats] = useState<RoleStats>({
    totalRoles: 0,
    activeRoles: 0,
    customRoles: 0,
    systemRoles: 0,
    typeDistribution: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all'
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form state
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    permissions: {
      dashboard: { view: false, export: false },
      users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
      bots: { view: false, create: false, edit: false, delete: false, publish: false },
      agents: { view: false, create: false, edit: false, delete: false, assign: false },
      analytics: { view: false, export: false, advanced: false },
      knowledgeBase: { view: false, upload: false, edit: false, delete: false },
      settings: { view: false, edit: false, system: false },
      chat: { view: false, moderate: false, export: false },
      handoffs: { view: false, accept: false, reject: false, manage: false }
    } as RolePermissions
  });

  // Load data on component mount
  useEffect(() => {
    console.log('🔐 User permissions:', userPermissions);
    console.log('👤 Current user:', user);
    loadRoles();
    loadStats();
  }, [filters]);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Loading roles...');

      const params: any = {};
      if (filters.search) params.search = filters.search;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.status !== 'all') params.status = filters.status;

      const response = await rolesAPI.getRoles(params);
      console.log('✅ Roles response:', response.data);

      if (response.data.success) {
        setRoles(response.data.data.roles);
        console.log('📊 Loaded roles:', response.data.data.roles.length);
      } else {
        const errorMessage = response.data.error?.message || 'Failed to load roles';
        console.error('❌ Load roles error:', response.data.error);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error loading roles:', error);

      // Handle specific error types
      if (error?.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error?.response?.status === 403) {
        toast.error('You do not have permission to view roles.');
      } else if (error?.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else {
        toast.error('Failed to load roles. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Loading role statistics...');
      const response = await rolesAPI.getRoleStats();
      console.log('✅ Stats response:', response.data);

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('❌ Error loading role stats:', error);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!roleForm.name.trim()) {
        toast.error('Role name is required');
        return;
      }

      console.log('👤 Creating new role:', roleForm);
      const response = await rolesAPI.createRole(roleForm);
      console.log('✅ Create role response:', response.data);

      if (response.data.success) {
        toast.success('Role created successfully');
        setShowCreateModal(false);
        resetForm();
        loadRoles();
        loadStats();
      } else {
        toast.error(response.data.error?.message || 'Failed to create role');
      }
    } catch (error: any) {
      console.error('❌ Error creating role:', error);
      toast.error('Failed to create role');
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole) return;

    try {
      console.log('✏️ Updating role:', selectedRole._id, roleForm);
      const response = await rolesAPI.updateRole(selectedRole._id, roleForm);
      console.log('✅ Update role response:', response.data);

      if (response.data.success) {
        toast.success('Role updated successfully');
        setShowEditModal(false);
        setSelectedRole(null);
        resetForm();
        loadRoles();
      } else {
        toast.error(response.data.error?.message || 'Failed to update role');
      }
    } catch (error: any) {
      console.error('❌ Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      console.log('🗑️ Deleting role:', selectedRole._id);
      const response = await rolesAPI.deleteRole(selectedRole._id);
      console.log('✅ Delete role response:', response.data);

      if (response.data.success) {
        toast.success('Role deleted successfully');
        setShowDeleteModal(false);
        setSelectedRole(null);
        loadRoles();
        loadStats();
      } else {
        toast.error(response.data.error?.message || 'Failed to delete role');
      }
    } catch (error: any) {
      console.error('❌ Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const handleStatusChange = async (role: Role, newStatus: string) => {
    try {
      console.log('🔄 Updating role status:', role._id, newStatus);
      const response = await rolesAPI.updateRoleStatus(role._id, newStatus);
      console.log('✅ Status update response:', response.data);

      if (response.data.success) {
        toast.success(`Role ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        loadRoles();
        loadStats();
      } else {
        toast.error(response.data.error?.message || 'Failed to update role status');
      }
    } catch (error: any) {
      console.error('❌ Error updating role status:', error);
      toast.error('Failed to update role status');
    }
  };

  const handleInitializeRoles = async () => {
    try {
      console.log('🔧 Initializing default system roles...');
      const response = await rolesAPI.initializeRoles();
      console.log('✅ Initialize roles response:', response.data);

      if (response.data.success) {
        toast.success('Default system roles initialized successfully');
        loadRoles();
        loadStats();
      } else {
        const errorMessage = response.data.error?.message || 'Failed to initialize roles';
        console.error('❌ Initialize roles error:', response.data.error);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Error initializing roles:', error);

      // Handle specific error types
      if (error?.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else if (error?.response?.status === 403) {
        toast.error('You do not have permission to initialize roles.');
      } else if (error?.response?.data?.error?.message) {
        toast.error(error.response.data.error.message);
      } else {
        toast.error('Failed to initialize roles. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setRoleForm({
      name: '',
      description: '',
      color: '#3B82F6',
      permissions: {
        dashboard: { view: false, export: false },
        users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
        bots: { view: false, create: false, edit: false, delete: false, publish: false },
        agents: { view: false, create: false, edit: false, delete: false, assign: false },
        analytics: { view: false, export: false, advanced: false },
        knowledgeBase: { view: false, upload: false, edit: false, delete: false },
        settings: { view: false, edit: false, system: false },
        chat: { view: false, moderate: false, export: false },
        handoffs: { view: false, accept: false, reject: false, manage: false }
      }
    });
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      color: role.color,
      permissions: role.permissions
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const updatePermission = (module: keyof RolePermissions, action: string, value: boolean) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: value
        }
      }
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'custom':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage user roles with custom permissions
          </p>
        </div>
        
        {(userPermissions.users?.manageRoles || userPermissions.users?.create) && (
          <button
            onClick={handleInitializeRoles}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Initialize Default Roles</span>
          </button>
        )}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-2xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalRoles}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Roles</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-2xl">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeRoles}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Roles</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-2xl">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.customRoles}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Custom Roles</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-2xl">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.systemRoles}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">System Roles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Roles
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="system">System Roles</option>
              <option value="custom">Custom Roles</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {roles.map((role) => (
                <tr key={role._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      ></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {role.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {role.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(role.type)}`}>
                      {role.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={role.status}
                      onChange={(e) => handleStatusChange(role, e.target.value)}
                      disabled={role.type === 'system' && user?.role !== 'superadministrator'}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(role.status)} ${
                        role.type === 'system' && user?.role !== 'superadministrator' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {role.userCount} users
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {role.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(role)}
                        disabled={role.type === 'system' && user?.role !== 'superadministrator'}
                        className={`text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 ${
                          role.type === 'system' && user?.role !== 'superadministrator' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title={
                          role.type === 'system' && user?.role !== 'superadministrator'
                            ? 'System roles can only be edited by Super Administrators' 
                            : 'Edit role'
                        }
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => openDeleteModal(role)}
                        disabled={(role.type === 'system' && user?.role !== 'superadministrator') || role.userCount > 0}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                          (role.type === 'system' && user?.role !== 'superadministrator') || role.userCount > 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title={
                          role.type === 'system' && user?.role !== 'superadministrator'
                            ? 'System roles can only be deleted by Super Administrators' 
                            : role.userCount > 0 
                            ? 'Cannot delete role with assigned users' 
                            : 'Delete role'
                        }
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
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {showCreateModal ? 'Create New Role' : 'Edit Role'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedRole(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Role Basic Info */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="e.g., Content Manager"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={roleForm.color}
                        onChange={(e) => setRoleForm(prev => ({ ...prev, color: e.target.value }))}
                        className="h-10 w-16 rounded border border-gray-300 dark:border-gray-600"
                      />
                      <input
                        type="text"
                        value={roleForm.color}
                        onChange={(e) => setRoleForm(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe the role's purpose and responsibilities..."
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Permissions
                </h3>
                <div className="space-y-6">
                  {Object.keys(roleForm.permissions).map((module) => (
                    <div key={module} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 capitalize">
                        {module === 'knowledgeBase' ? 'Knowledge Base' : module}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.keys(roleForm.permissions[module as keyof RolePermissions]).map((action) => (
                          <label key={action} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roleForm.permissions[module as keyof RolePermissions][action as keyof Permission] || false}
                              onChange={(e) => updatePermission(
                                module as keyof RolePermissions, 
                                action, 
                                e.target.checked
                              )}
                              className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {action === 'manageRoles' ? 'Manage Roles' : action}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedRole(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreateRole : handleEditRole}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {showCreateModal ? 'Create Role' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Role
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the role <strong>"{selectedRole.name}"</strong>?
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRole}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;