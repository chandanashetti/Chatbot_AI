import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  activeChats: number;
  totalHandled: number;
  avgResponseTime: number;
}

interface HandoffRequest {
  id: string;
  userId: string;
  userName: string;
  requestTime: Date;
  status: 'pending' | 'accepted' | 'declined';
  reason: string;
  confidence: number;
  assignedAgent?: string;
}

const AgentManagement = () => {
  // Mock data for demo
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      phone: '+1 (555) 123-4567',
      status: 'available',
      activeChats: 3,
      totalHandled: 127,
      avgResponseTime: 2.5
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@company.com',
      phone: '+1 (555) 234-5678',
      status: 'busy',
      activeChats: 5,
      totalHandled: 89,
      avgResponseTime: 1.8
    },
    {
      id: '3',
      name: 'Emma Davis',
      email: 'emma@company.com',
      phone: '+1 (555) 345-6789',
      status: 'offline',
      activeChats: 0,
      totalHandled: 203,
      avgResponseTime: 3.1
    }
  ]);
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([
    {
      id: '1',
      userId: 'user123',
      userName: 'John Smith',
      requestTime: new Date(Date.now() - 300000), // 5 minutes ago
      status: 'pending',
      reason: 'Complex technical issue requiring human assistance',
      confidence: 0.3,
    },
    {
      id: '2',
      userId: 'user456',
      userName: 'Lisa Wilson',
      requestTime: new Date(Date.now() - 600000), // 10 minutes ago
      status: 'accepted',
      reason: 'Billing inquiry needs manual review',
      confidence: 0.2,
      assignedAgent: 'Sarah Johnson'
    }
  ]);

  const handleStatusChange = (agentId: string, status: Agent['status']) => {
    setAgents(agents.map(agent =>
      agent.id === agentId ? { ...agent, status } : agent
    ));
  };

  const handleHandoffAction = (requestId: string, action: 'accept' | 'decline', agentId?: string) => {
    setHandoffRequests(requests =>
      requests.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: action === 'accept' ? 'accepted' : 'declined',
              assignedAgent: agentId
            }
          : request
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage human agents and handle chat handoff requests
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Agents</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {agents.map(agent => (
                <div key={agent.id} className="px-4 py-4">
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
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {agent.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Active Chats</div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                          {agent.activeChats}
                        </div>
                      </div>
                      <select
                        value={agent.status}
                        onChange={(e) => handleStatusChange(agent.id, e.target.value as Agent['status'])}
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          agent.status === 'available'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : agent.status === 'busy'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
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
              {handoffRequests.map(request => (
                <div key={request.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{request.userName}</h4>
                      <div className="text-sm text-gray-500">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(request.requestTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-500">Confidence</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {Math.round(request.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {request.reason}
                  </p>

                  {request.status === 'pending' ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleHandoffAction(request.id, 'accept')}
                        className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleHandoffAction(request.id, 'decline')}
                        className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center py-2 rounded-md text-sm font-medium ${
                      request.status === 'accepted'
                        ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                        : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
                    }`}>
                      {request.status === 'accepted' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accepted
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-1" />
                          Declined
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentManagement;
