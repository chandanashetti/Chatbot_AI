import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  Phone,
  Globe,
  RefreshCw,
  Award
} from 'lucide-react';
import { handoffAPI, agentAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { RootState } from '../../store/store';

interface Agent {
  _id: string;
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
}

interface HandoffRequest {
  _id: string;
  conversationId: string;
  userId: string;
  userName: string;
  platform: string;
  reason: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'accepted' | 'declined' | 'completed';
  aiConfidence: number;
  queuePosition: number;
  estimatedWaitTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const AgentDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // State management
  const [agent, setAgent] = useState<Agent | null>(null);
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<HandoffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current agent ID from authenticated user
  const currentAgentId = user?.id || null;

  // Load data on component mount
  useEffect(() => {
    loadAgentData();
    loadHandoffRequests();

    // Set up polling for real-time updates
    const handoffInterval = setInterval(() => {
      loadHandoffRequests();
    }, 30000); // Poll every 30 seconds

    // Set up heartbeat to keep agent online
    const heartbeatInterval = setInterval(async () => {
      if (currentAgentId) {
        try {
          await agentAPI.updateHeartbeat();
          console.log('💗 Heartbeat sent');
        } catch (error) {
          console.warn('⚠️ Heartbeat failed:', error);
        }
      }
    }, 60000); // Heartbeat every minute

    // Set agent offline when component unmounts (browser closes/navigates away)
    const handleBeforeUnload = async () => {
      if (currentAgentId) {
        try {
          await agentAPI.setOffline();
          console.log('👋 Agent set offline on page unload');
        } catch (error) {
          console.warn('⚠️ Failed to set agent offline:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(handoffInterval);
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Try to set offline on cleanup
      if (currentAgentId) {
        agentAPI.setOffline().catch(console.warn);
      }
    };
  }, [currentAgentId]);

  const loadAgentData = async () => {
    if (!currentAgentId) {
      console.warn('⚠️ No agent ID available - user may not be logged in');
      setError('Please log in to access the agent dashboard');
      return;
    }

    try {
      console.log('📋 Loading agent data for user:', currentAgentId);

      // Get current agent profile (creates if doesn't exist)
      const response = await agentAPI.getCurrentAgent();
      const agentData = response.data;

      setAgent(agentData);
      console.log('✅ Loaded agent data:', agentData.name);
    } catch (error: any) {
      console.error('❌ Error loading agent data:', error);

      // Fall back to user data if API call fails
      if (user) {
        const fallbackAgent: Agent = {
          _id: currentAgentId,
          name: user.profile?.firstName && user.profile?.lastName
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.email,
          email: user.email,
          phone: user.profile?.phone || '',
          status: 'available',
          availability: {
            isOnline: true,
            lastSeen: new Date(),
            maxConcurrentChats: 5
          },
          metrics: {
            totalChatsHandled: 0,
            activeChats: 0,
            averageResponseTime: 2.5,
            customerSatisfactionScore: 4.0,
            ratingsCount: 0
          }
        };

        setAgent(fallbackAgent);
        console.log('✅ Using fallback agent data from user info');
      } else {
        setError('Failed to load agent data');
      }
    }
  };

  const loadHandoffRequests = async () => {
    if (!currentAgentId) {
      console.warn('⚠️ No agent ID available for loading handoff requests');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading handoff requests for agent:', currentAgentId);

      // Load assigned requests for this agent
      const [assignedResponse, queueResponse] = await Promise.all([
        handoffAPI.getHandoffs({
          agentId: currentAgentId,
          status: 'all',
          limit: 50
        }),
        handoffAPI.getQueue({})
      ]);

      console.log('📋 Assigned requests:', assignedResponse.data.data.handoffs);
      console.log('📋 Queue requests:', queueResponse.data.data);

      setHandoffRequests(assignedResponse.data.data.handoffs || []);
      setPendingRequests(queueResponse.data.data || []);
    } catch (error: any) {
      console.error('❌ Error loading handoff requests:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load handoff requests';

      if (error.response?.status === 404) {
        console.log('🔄 No handoff requests found, using empty arrays');
        setHandoffRequests([]);
        setPendingRequests([]);
      } else {
        setError(errorMessage);

        // Set mock data for demo when there's an error
        console.log('🔄 Using mock handoff data due to error');
        setHandoffRequests([
          {
            _id: '1',
            conversationId: 'conv1',
            userId: 'user123',
            userName: 'John Smith',
            platform: 'web',
            reason: 'Complex technical issue requiring human assistance',
            category: 'technical',
            priority: 'high',
            status: 'accepted',
            aiConfidence: 0.3,
            queuePosition: 0,
            estimatedWaitTime: 0,
            createdAt: new Date(Date.now() - 300000), // 5 minutes ago
            updatedAt: new Date()
          }
        ]);

        setPendingRequests([
          {
            _id: '2',
            conversationId: 'conv2',
            userId: 'user456',
            userName: 'Lisa Wilson',
            platform: 'whatsapp',
            reason: 'Billing inquiry needs manual review',
            category: 'billing',
            priority: 'medium',
            status: 'pending',
            aiConfidence: 0.2,
            queuePosition: 1,
            estimatedWaitTime: 5,
            createdAt: new Date(Date.now() - 600000), // 10 minutes ago
            updatedAt: new Date()
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptHandoff = async (requestId: string) => {
    try {
      console.log(`✅ Accepting handoff ${requestId}...`);
      await handoffAPI.acceptHandoff(requestId, currentAgentId);
      toast.success('Handoff accepted successfully');
      await loadHandoffRequests();
    } catch (error: any) {
      console.error('❌ Error accepting handoff:', error);
      toast.error(error.response?.data?.error || 'Failed to accept handoff');
    }
  };

  const handleDeclineHandoff = async (requestId: string, reason?: string) => {
    try {
      console.log(`❌ Declining handoff ${requestId}...`);
      await handoffAPI.declineHandoff(requestId, currentAgentId, reason);
      toast.success('Handoff declined');
      await loadHandoffRequests();
    } catch (error: any) {
      console.error('❌ Error declining handoff:', error);
      toast.error(error.response?.data?.error || 'Failed to decline handoff');
    }
  };

  const updateAgentStatus = async (status: Agent['status']) => {
    if (!agent) return;
    
    try {
      console.log(`🔄 Updating status to ${status}...`);
      await agentAPI.updateAgentStatus(agent._id, status);
      setAgent({ ...agent, status });
      toast.success(`Status updated to ${status}`);
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return <Globe className="w-4 h-4" />;
      case 'whatsapp': return <Phone className="w-4 h-4" />;
      case 'facebook': return <MessageSquare className="w-4 h-4" />;
      case 'instagram': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Agent Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back, {agent.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status Selector */}
              <select
                value={agent.status}
                onChange={(e) => updateAgentStatus(e.target.value as Agent['status'])}
                className={`px-3 py-1 rounded-full text-sm font-medium border-0 ${
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
              
              <button
                onClick={loadHandoffRequests}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-red-700 dark:text-red-300">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{agent.metrics.activeChats}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Handled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{agent.metrics.totalChatsHandled}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{agent.metrics.averageResponseTime.toFixed(1)}s</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{agent.metrics.customerSatisfactionScore.toFixed(1)}/5</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Active Handoffs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Active Handoffs</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {handoffRequests.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No active handoffs assigned to you
                </div>
              ) : (
                handoffRequests.map((request) => (
                  <div key={request._id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getPlatformIcon(request.platform)}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{request.userName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{request.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                          {request.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          request.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {request.reason}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(request.createdAt).toLocaleTimeString()}
                        </span>
                        <span>AI: {Math.round(request.aiConfidence * 100)}%</span>
                      </div>
                      
                      {request.status === 'assigned' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptHandoff(request._id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineHandoff(request._id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      
                      {request.status === 'accepted' && (
                        <button
                          onClick={() => window.open(`/agent/chat/${request._id}`, '_blank')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                        >
                          Open Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Queue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available Queue</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingRequests.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No pending handoffs in queue
                </div>
              ) : (
                pendingRequests.slice(0, 5).map((request) => (
                  <div key={request._id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getPlatformIcon(request.platform)}
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{request.userName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{request.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                          {request.priority.toUpperCase()}
                        </span>
                        {request.queuePosition > 0 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            #{request.queuePosition}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {request.reason}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(request.createdAt).toLocaleTimeString()}
                        </span>
                        <span>Wait: {request.estimatedWaitTime}min</span>
                      </div>
                      
                      {agent.status === 'available' && (
                        <button
                          onClick={() => handleAcceptHandoff(request._id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                        >
                          Take This
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
