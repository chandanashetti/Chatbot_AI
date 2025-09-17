import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  User,
  Phone,
  Globe,
  RefreshCw,
  Filter,
  Search,
  AlertTriangle,
  ArrowRight,
  Star
} from 'lucide-react';
import { handoffAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

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
  assignedAgent?: {
    _id: string;
    name: string;
    email: string;
  };
}

const HandoffRequests = () => {
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([]);
  const [queueRequests, setQueueRequests] = useState<HandoffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'assigned' | 'queue' | 'completed'>('assigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Mock agent ID - in real implementation, this would come from authentication
  const currentAgentId = '507f1f77bcf86cd799439011';

  useEffect(() => {
    loadHandoffRequests();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      loadHandoffRequests();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [selectedTab]);

  const loadHandoffRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading handoff requests...');

      if (selectedTab === 'assigned' || selectedTab === 'completed') {
        // Load requests assigned to this agent
        const response = await handoffAPI.getHandoffs({
          agentId: currentAgentId,
          status: selectedTab === 'completed' ? 'completed' : 'all',
          limit: 50
        });

        console.log('📋 Agent requests:', response.data.data.handoffs);
        setHandoffRequests(response.data.data.handoffs || []);
      } else {
        // Load queue requests
        const response = await handoffAPI.getQueue({});
        console.log('📋 Queue requests:', response.data.data);
        setQueueRequests(response.data.data || []);
      }
    } catch (error: any) {
      console.error('❌ Error loading handoff requests:', error);
      setError(error.response?.data?.error || 'Failed to load handoff requests');

      // Set mock data for demo
      const mockData: HandoffRequest[] = [
        {
          _id: '1',
          conversationId: 'conv1',
          userId: 'user123',
          userName: 'John Smith',
          platform: 'web',
          reason: 'Complex technical issue requiring human assistance',
          category: 'technical',
          priority: 'high',
          status: selectedTab === 'completed' ? 'completed' : 'accepted',
          aiConfidence: 0.3,
          queuePosition: 0,
          estimatedWaitTime: 0,
          createdAt: new Date(Date.now() - 300000), // 5 minutes ago
          updatedAt: new Date(),
          assignedAgent: {
            _id: currentAgentId,
            name: 'Sarah Johnson',
            email: 'sarah@company.com'
          }
        },
        {
          _id: '2',
          conversationId: 'conv2',
          userId: 'user456',
          userName: 'Lisa Wilson',
          platform: 'whatsapp',
          reason: 'Billing inquiry needs manual review',
          category: 'billing',
          priority: 'medium',
          status: selectedTab === 'queue' ? 'pending' : selectedTab === 'completed' ? 'completed' : 'assigned',
          aiConfidence: 0.2,
          queuePosition: selectedTab === 'queue' ? 1 : 0,
          estimatedWaitTime: selectedTab === 'queue' ? 5 : 0,
          createdAt: new Date(Date.now() - 600000), // 10 minutes ago
          updatedAt: new Date()
        },
        {
          _id: '3',
          conversationId: 'conv3',
          userId: 'user789',
          userName: 'Michael Brown',
          platform: 'instagram',
          reason: 'Product inquiry about premium features',
          category: 'sales',
          priority: 'low',
          status: selectedTab === 'queue' ? 'pending' : selectedTab === 'completed' ? 'completed' : 'assigned',
          aiConfidence: 0.4,
          queuePosition: selectedTab === 'queue' ? 2 : 0,
          estimatedWaitTime: selectedTab === 'queue' ? 8 : 0,
          createdAt: new Date(Date.now() - 900000), // 15 minutes ago
          updatedAt: new Date()
        }
      ];

      if (selectedTab === 'queue') {
        setQueueRequests(mockData.filter(r => r.status === 'pending'));
      } else {
        setHandoffRequests(mockData.filter(r =>
          selectedTab === 'completed' ? r.status === 'completed' : r.status !== 'pending' && r.status !== 'completed'
        ));
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

  const handleCompleteHandoff = async (requestId: string) => {
    try {
      console.log(`✅ Completing handoff ${requestId}...`);
      await handoffAPI.completeHandoff(requestId, currentAgentId);
      toast.success('Handoff completed successfully');
      await loadHandoffRequests();
    } catch (error: any) {
      console.error('❌ Error completing handoff:', error);
      toast.error(error.response?.data?.error || 'Failed to complete handoff');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'assigned': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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

  const getDisplayData = () => {
    return selectedTab === 'queue' ? queueRequests : handoffRequests;
  };

  const filteredData = getDisplayData().filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;

    return matchesSearch && matchesPriority && matchesCategory;
  });

  const categories = ['all', 'technical', 'billing', 'sales', 'support', 'general'];
  const priorities = ['all', 'low', 'medium', 'high', 'critical'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Handoff Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage customer handoff requests and assignments
          </p>
        </div>

        <button
          onClick={loadHandoffRequests}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div className="text-red-700 dark:text-red-300">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'assigned', label: 'My Assignments', icon: User },
            { key: 'queue', label: 'Available Queue', icon: MessageSquare },
            { key: 'completed', label: 'Completed', icon: CheckCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input-field"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="card p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No requests found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {selectedTab === 'assigned' ? 'No handoff requests assigned to you.' :
               selectedTab === 'queue' ? 'No pending requests in the queue.' :
               'No completed requests.'}
            </p>
          </div>
        ) : (
          filteredData.map((request) => (
            <div key={request._id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(request.platform)}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {request.userName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                    {request.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                    {request.status.toUpperCase()}
                  </span>
                  {selectedTab === 'queue' && request.queuePosition > 0 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      #{request.queuePosition}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {request.reason}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                  <span>AI Confidence: {Math.round(request.aiConfidence * 100)}%</span>
                  {selectedTab === 'queue' && request.estimatedWaitTime > 0 && (
                    <span>Wait: {request.estimatedWaitTime}min</span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {selectedTab === 'assigned' && request.status === 'assigned' && (
                    <>
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
                    </>
                  )}

                  {selectedTab === 'assigned' && request.status === 'accepted' && (
                    <>
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center space-x-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>Open Chat</span>
                      </button>
                      <button
                        onClick={() => handleCompleteHandoff(request._id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center space-x-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Complete</span>
                      </button>
                    </>
                  )}

                  {selectedTab === 'queue' && (
                    <button
                      onClick={() => handleAcceptHandoff(request._id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center space-x-1"
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>Take This</span>
                    </button>
                  )}

                  {selectedTab === 'completed' && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Star className="w-4 h-4" />
                      <span className="text-xs">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HandoffRequests;