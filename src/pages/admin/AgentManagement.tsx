import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import { agentAPI, handoffAPI, usersAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Agent {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  status: 'available' | 'busy' | 'offline' | 'break';
  availability: {
    isOnline: boolean;
    lastSeen: Date;
    maxConcurrentChats: number;
  };
  metrics: {
    totalChatsHandled: number;
  activeChats: number;
    averageResponseTime: number;
    customerSatisfactionScore: number;
    ratingsCount: number;
  };
  skills?: Array<{
    name: string;
    categories: string[];
  }>;
  departments?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface HandoffRequest {
  _id: string;
  id?: string;
  conversationId: string;
  userId: string;
  userName: string;
  platform: string;
  reason: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'accepted' | 'declined' | 'completed' | 'expired';
  aiConfidence: number;
  assignedAgent?: {
    _id: string;
    name: string;
    email: string;
  };
  queuePosition: number;
  estimatedWaitTime: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateAgentFormData {
  name: string;
  email: string;
  phone?: string;
  userId?: string;
  departments: string[];
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    categories: string[];
  }>;
  languages: Array<{
    code: string;
    name: string;
    proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  }>;
  availability: {
    maxConcurrentChats: number;
    timezone: string;
  };
}

const AgentManagement = () => {
  // State management
  const [agents, setAgents] = useState<Agent[]>([]);
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Agent Creation Form
  const [formData, setFormData] = useState<CreateAgentFormData>({
    name: '',
    email: '',
    phone: '',
    userId: '',
    departments: [],
    skills: [],
    languages: [{ code: 'en', name: 'English', proficiency: 'fluent' }],
    availability: {
      maxConcurrentChats: 5,
      timezone: 'UTC'
    }
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadUsers();
    
    // Set up polling for real-time handoff updates
    const interval = setInterval(() => {
      loadData();
    }, 10000); // Poll every 10 seconds for handoff requests

    return () => clearInterval(interval);
  }, [statusFilter, searchTerm]);

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getUsers({
        status: 'active',
        limit: 100
      });
      setUsers(response.data.data.users || []);
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [agentsResponse, handoffsResponse] = await Promise.all([
        agentAPI.getAgents({
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchTerm || undefined,
          limit: 100
        }),
        handoffAPI.getHandoffs({
          status: 'pending',
          limit: 50
        })
      ]);

      console.log('📋 Loaded agents:', agentsResponse.data.data.agents);
      console.log('🔄 Loaded handoffs:', handoffsResponse.data.data.handoffs);

      setAgents(agentsResponse.data.data.agents || []);
      setHandoffRequests(handoffsResponse.data.data.handoffs || []);
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      setError(error.response?.data?.error || 'Failed to load data');
      toast.error('Failed to load agent data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (agentId: string, status: Agent['status']) => {
    try {
      console.log(`🔄 Updating agent ${agentId} status to ${status}...`);
      
      await agentAPI.updateAgentStatus(agentId, status);
      
      // Update local state
    setAgents(agents.map(agent =>
        (agent._id === agentId || agent.id === agentId) ? { ...agent, status } : agent
      ));
      
      toast.success(`Agent status updated to ${status}`);
    } catch (error: any) {
      console.error('❌ Error updating agent status:', error);
      toast.error(error.response?.data?.error || 'Failed to update agent status');
    }
  };

  const handleHandoffAction = async (requestId: string, action: 'accept' | 'decline', agentId?: string) => {
    try {
      console.log(`🔄 ${action}ing handoff ${requestId}...`);
      
      if (action === 'accept' && agentId) {
        await handoffAPI.acceptHandoff(requestId, agentId);
      } else if (action === 'decline' && agentId) {
        await handoffAPI.declineHandoff(requestId, agentId);
      }
      
      // Reload handoff requests
      await loadData();
      
      toast.success(`Handoff ${action}ed successfully`);
    } catch (error: any) {
      console.error(`❌ Error ${action}ing handoff:`, error);
      toast.error(error.response?.data?.error || `Failed to ${action} handoff`);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      console.log('➕ Creating new agent...', formData);
      
      const response = await agentAPI.createAgent(formData);
      
      // Add to local state
      setAgents([response.data.data, ...agents]);
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        phone: '',
        userId: '',
        departments: [],
        skills: [],
        languages: [{ code: 'en', name: 'English', proficiency: 'fluent' }],
        availability: {
          maxConcurrentChats: 5,
          timezone: 'UTC'
        }
      });
      setShowCreateModal(false);
      
      toast.success('Agent created successfully!');
    } catch (error: any) {
      console.error('❌ Error creating agent:', error);
      toast.error(error.response?.data?.error || 'Failed to create agent');
    } finally {
      setIsCreating(false);
    }
  };

  const addSkill = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { name: '', level: 'intermediate', categories: [] }]
    });
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  const updateSkill = (index: number, field: string, value: any) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setFormData({ ...formData, skills: updatedSkills });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage human agents and handle chat handoff requests
        </p>
      </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Agent</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
            <option value="break">On Break</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-blue-700 dark:text-blue-300">Loading agents and handoff requests...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-red-700 dark:text-red-300">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Agents</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {agents.length === 0 && !isLoading ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No agents found. {searchTerm && 'Try adjusting your search terms.'}
                </div>
              ) : (
                agents.map(agent => (
                  <div key={agent._id || agent.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {agent.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {agent.email}
                          </span>
                            {agent.phone && (
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {agent.phone}
                          </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                            <span>Last seen: {new Date(agent.availability.lastSeen).toLocaleString()}</span>
                            {agent.availability.isOnline && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Online</span>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Active Chats</div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {agent.metrics.activeChats}
                          </div>
                          <div className="text-xs text-gray-500">
                            Max: {agent.availability.maxConcurrentChats}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Total Handled</div>
                          <div className="text-lg font-medium text-gray-900 dark:text-white">
                            {agent.metrics.totalChatsHandled}
                          </div>
                          <div className="text-xs text-gray-500">
                            Avg: {agent.metrics.averageResponseTime.toFixed(1)}s
                        </div>
                      </div>
                      <select
                        value={agent.status}
                          onChange={(e) => handleStatusChange(agent._id || agent.id!, e.target.value as Agent['status'])}
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          agent.status === 'available'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : agent.status === 'busy'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : agent.status === 'break'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                          <option value="break">On Break</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Handoff Requests */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Handoff Requests</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {handoffRequests.length === 0 && !isLoading ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No pending handoff requests
                </div>
              ) : (
                handoffRequests.map(request => (
                  <div key={request._id || request.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{request.userName}</h4>
                      <div className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                          {new Date(request.createdAt).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            request.priority === 'critical' ? 'bg-red-100 text-red-800' :
                            request.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {request.priority.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {request.platform.toUpperCase()}
                          </span>
                          {request.queuePosition > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                              Queue #{request.queuePosition}
                            </span>
                          )}
                        </div>
                    </div>
                    <div className="text-sm">
                        <div className="text-gray-500">AI Confidence</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                          {Math.round(request.aiConfidence * 100)}%
                        </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {request.reason}
                  </p>

                    {request.assignedAgent && (
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        Assigned to: {request.assignedAgent.name}
                      </div>
                    )}

                  {request.status === 'pending' ? (
                    <div className="flex space-x-2">
                      <button
                          onClick={() => handleHandoffAction(request._id || request.id!, 'accept', agents.find(a => a.status === 'available')?._id)}
                          disabled={!agents.some(a => a.status === 'available')}
                          className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Accept
                      </button>
                      <button
                          onClick={() => handleHandoffAction(request._id || request.id!, 'decline', agents.find(a => a.status === 'available')?._id)}
                        className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center py-2 rounded-md text-sm font-medium ${
                        request.status === 'accepted' || request.status === 'assigned'
                        ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                          : request.status === 'completed'
                          ? 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
                        : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
                    }`}>
                        {request.status === 'accepted' || request.status === 'assigned' ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {request.status === 'accepted' ? 'Accepted' : 'Assigned'}
                          </>
                        ) : request.status === 'completed' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                            Completed
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                            {request.status}
                        </>
                      )}
                    </div>
                  )}
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Agent</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateAgent} className="px-6 py-4">
              <div className="space-y-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Link to User *
                      </label>
                      <select
                        required
                        value={formData.userId}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a user...</option>
                        {users.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.profile?.firstName} {user.profile?.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Departments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Departments
                  </label>
                  <input
                    type="text"
                    placeholder="Enter departments separated by commas (e.g. customer-service, technical-support)"
                    value={formData.departments.join(', ')}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      departments: e.target.value.split(',').map(d => d.trim()).filter(d => d) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Availability Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Availability Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Concurrent Chats
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.availability.maxConcurrentChats}
                        onChange={(e) => setFormData({
                          ...formData,
                          availability: {
                            ...formData.availability,
                            maxConcurrentChats: parseInt(e.target.value) || 5
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Timezone
                      </label>
                      <select
                        value={formData.availability.timezone}
                        onChange={(e) => setFormData({
                          ...formData,
                          availability: {
                            ...formData.availability,
                            timezone: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Asia/Shanghai">Shanghai</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Skills</h3>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Skill</span>
                    </button>
                  </div>
                  
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Skill name"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkill(index, 'level', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                      
                      <input
                        type="text"
                        placeholder="Categories (comma-separated)"
                        value={skill.categories.join(', ')}
                        onChange={(e) => updateSkill(index, 'categories', e.target.value.split(',').map(c => c.trim()).filter(c => c))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Agent</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentManagement;
