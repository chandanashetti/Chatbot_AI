import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Clock,
  User,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit3,
  Users,
  Brain,
  Zap,
  Calendar,
  Tag,
  Phone,
  Instagram,
  MessageCircle,
  Hash
} from 'lucide-react';

// Ticket System Types
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'pending_customer' | 'resolved' | 'closed';
export type TicketTier = 'tier1' | 'tier2' | 'tier3' | 'escalated';
export type TicketSource = 'chat' | 'email' | 'phone' | 'web_form' | 'api';
export type Platform = 'line' | 'facebook' | 'instagram' | 'discord' | 'whatsapp' | 'telegram' | 'web' | 'other';

export interface TicketAgent {
  id: string;
  name: string;
  email: string;
  tier: TicketTier;
  status: 'online' | 'offline' | 'busy';
  currentTickets: number;
  maxTickets: number;
  specialties: string[];
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  confidence: number;
  usage_count: number;
}

export interface TicketEscalation {
  id: string;
  timestamp: Date;
  fromTier: TicketTier;
  toTier: TicketTier;
  reason: string;
  escalatedBy: string;
  notes?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  tier: TicketTier;
  source: TicketSource;
  platform?: Platform;
  
  // Customer Information
  customerId: string;
  customerName: string;
  customerEmail?: string;
  
  // Assignment
  assignedTo?: string;
  assignedAgent?: TicketAgent;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  
  // AI Integration
  aiSuggestions: KnowledgeBaseEntry[];
  aiConfidence: number;
  aiAttempted: boolean;
  
  // Escalation History
  escalations: TicketEscalation[];
  
  // Related Data
  chatSessionId?: string;
  tags: string[];
  attachments: string[];
  
  // SLA
  slaDeadline: Date;
  responseTime?: number;
  resolutionTime?: number;
}

const TicketManagement = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterTier, setFilterTier] = useState<TicketTier | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Platform configuration
  const platforms = [
    { id: 'all' as const, name: 'All Platforms', icon: MessageSquare, color: 'gray' },
    { id: 'line' as const, name: 'LINE', icon: MessageCircle, color: 'green' },
    { id: 'facebook' as const, name: 'Facebook', icon: MessageCircle, color: 'blue' },
    { id: 'instagram' as const, name: 'Instagram', icon: Instagram, color: 'pink' },
    { id: 'discord' as const, name: 'Discord', icon: Hash, color: 'indigo' },
    { id: 'whatsapp' as const, name: 'WhatsApp', icon: Phone, color: 'green' },
    { id: 'telegram' as const, name: 'Telegram', icon: Zap, color: 'blue' },
    { id: 'web' as const, name: 'Web Chat', icon: MessageSquare, color: 'gray' },
    { id: 'other' as const, name: 'Other', icon: MessageCircle, color: 'gray' }
  ];

  // Mock agents data
  const agents: TicketAgent[] = [
    {
      id: 'agent1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      tier: 'tier1',
      status: 'online',
      currentTickets: 8,
      maxTickets: 15,
      specialties: ['billing', 'account-setup', 'basic-support']
    },
    {
      id: 'agent2',
      name: 'Mike Chen',
      email: 'mike@company.com',
      tier: 'tier2',
      status: 'online',
      currentTickets: 5,
      maxTickets: 10,
      specialties: ['technical-integration', 'api-support', 'troubleshooting']
    },
    {
      id: 'agent3',
      name: 'Lisa Rodriguez',
      email: 'lisa@company.com',
      tier: 'tier3',
      status: 'busy',
      currentTickets: 3,
      maxTickets: 5,
      specialties: ['enterprise-support', 'security', 'escalations']
    }
  ];

  // Mock tickets data
  const mockTickets: Ticket[] = [
    {
      id: 'TKT-001',
      title: 'Billing inquiry - Account overcharged',
      description: 'Customer reports being charged twice for premium subscription',
      status: 'open',
      priority: 'medium',
      tier: 'tier1',
      source: 'chat',
      platform: 'web',
      customerId: 'user123',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      assignedTo: 'agent1',
      assignedAgent: agents[0],
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 1800000),
      aiSuggestions: [
        {
          id: 'kb1',
          title: 'Billing Double Charge Resolution',
          content: 'Steps to resolve double billing issues...',
          tags: ['billing', 'refund'],
          confidence: 0.92,
          usage_count: 156
        }
      ],
      aiConfidence: 0.92,
      aiAttempted: true,
      escalations: [],
      chatSessionId: '1',
      tags: ['billing', 'resolved'],
      attachments: [],
      slaDeadline: new Date(Date.now() + 86400000), // 24 hours
      responseTime: 300 // 5 minutes
    },
    {
      id: 'TKT-002',
      title: 'API Integration Issues - Discord Bot',
      description: 'Customer having trouble with Discord bot permissions and setup',
      status: 'in_progress',
      priority: 'high',
      tier: 'tier2',
      source: 'chat',
      platform: 'discord',
      customerId: 'user505',
      customerName: 'Carlos Rodriguez',
      customerEmail: 'carlos@example.com',
      assignedTo: 'agent2',
      assignedAgent: agents[1],
      createdAt: new Date(Date.now() - 10800000),
      updatedAt: new Date(Date.now() - 900000),
      aiSuggestions: [
        {
          id: 'kb2',
          title: 'Discord Bot Setup Guide',
          content: 'Complete guide for Discord bot integration...',
          tags: ['discord', 'bot-setup', 'permissions'],
          confidence: 0.87,
          usage_count: 89
        }
      ],
      aiConfidence: 0.87,
      aiAttempted: true,
      escalations: [
        {
          id: 'esc1',
          timestamp: new Date(Date.now() - 7200000),
          fromTier: 'tier1',
          toTier: 'tier2',
          reason: 'Technical complexity beyond Tier 1 scope',
          escalatedBy: 'agent1',
          notes: 'Customer needs advanced Discord permissions configuration'
        }
      ],
      chatSessionId: '8',
      tags: ['technical', 'bot-setup', 'complex'],
      attachments: [],
      slaDeadline: new Date(Date.now() + 43200000), // 12 hours
      responseTime: 180
    },
    {
      id: 'TKT-003',
      title: 'Security Incident - Unauthorized Access',
      description: 'Customer reports potential security breach in account',
      status: 'in_progress',
      priority: 'critical',
      tier: 'tier3',
      source: 'chat',
      platform: 'line',
      customerId: 'user707',
      customerName: 'James Wilson',
      customerEmail: 'james@example.com',
      assignedTo: 'agent3',
      assignedAgent: agents[2],
      createdAt: new Date(Date.now() - 14400000),
      updatedAt: new Date(Date.now() - 600000),
      aiSuggestions: [
        {
          id: 'kb3',
          title: 'Security Incident Response Protocol',
          content: 'Immediate steps for handling security breaches...',
          tags: ['security', 'incident-response', 'urgent'],
          confidence: 0.95,
          usage_count: 23
        }
      ],
      aiConfidence: 0.95,
      aiAttempted: false,
      escalations: [
        {
          id: 'esc2',
          timestamp: new Date(Date.now() - 12600000),
          fromTier: 'tier1',
          toTier: 'tier2',
          reason: 'Security concern requires specialized handling',
          escalatedBy: 'agent1'
        },
        {
          id: 'esc3',
          timestamp: new Date(Date.now() - 10800000),
          fromTier: 'tier2',
          toTier: 'tier3',
          reason: 'Critical security incident - immediate escalation',
          escalatedBy: 'agent2',
          notes: 'Potential data breach - requires senior security specialist'
        }
      ],
      chatSessionId: '10',
      tags: ['account-recovery', 'security', 'resolved'],
      attachments: [],
      slaDeadline: new Date(Date.now() + 7200000), // 2 hours for critical
      responseTime: 120
    }
  ];

  // Initialize tickets
  useState(() => {
    setTickets(mockTickets);
  });

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-purple-600 bg-purple-100';
      case 'pending_customer': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierColor = (tier: TicketTier) => {
    switch (tier) {
      case 'tier1': return 'text-green-600 bg-green-100';
      case 'tier2': return 'text-yellow-600 bg-yellow-100';
      case 'tier3': return 'text-red-600 bg-red-100';
      case 'escalated': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlatformIcon = (platform?: Platform) => {
    switch (platform) {
      case 'line': return MessageCircle;
      case 'facebook': return MessageCircle;
      case 'instagram': return Instagram;
      case 'discord': return Hash;
      case 'whatsapp': return Phone;
      case 'telegram': return Zap;
      case 'web': return MessageSquare;
      default: return MessageCircle;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterTier !== 'all' && ticket.tier !== filterTier) return false;
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false;
    if (searchTerm && !ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff < 0) return 'Overdue';
    if (hours < 1) return `${minutes}m remaining`;
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage and track support tickets across all tiers</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Agent Status */}
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {agents.filter(a => a.status === 'online').length} agents online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Ticket List */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>

              {/* Filter Row */}
              <div className="flex space-x-2">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value as any)}
                  className="block rounded-md border-gray-300 text-sm"
                >
                  <option value="all">All Tiers</option>
                  <option value="tier1">Tier 1</option>
                  <option value="tier2">Tier 2</option>
                  <option value="tier3">Tier 3</option>
                  <option value="escalated">Escalated</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="block rounded-md border-gray-300 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending_customer">Pending Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="block rounded-md border-gray-300 text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ticket List */}
          <div className="overflow-y-auto">
            {filteredTickets.map((ticket) => {
              const PlatformIcon = getPlatformIcon(ticket.platform);
              const isOverdue = new Date() > ticket.slaDeadline;
              
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedTicket?.id === ticket.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">{ticket.id}</span>
                      <PlatformIcon className="h-4 w-4 text-primary-500" />
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium">
                        {platforms.find(p => p.id === ticket.platform)?.name || ticket.platform?.toUpperCase() || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getTierColor(ticket.tier)}`}>
                        {ticket.tier.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {ticket.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{ticket.customerName}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Chat Session Information */}
                  {ticket.chatSessionId && (
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                      <div className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span className="font-medium">Chat Session:</span>
                        <span className="ml-1 font-mono text-gray-700 dark:text-gray-300">#{ticket.chatSessionId}</span>
                        <span className="mx-2">•</span>
                        <span>Source: {ticket.source}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent ticket selection
                          navigate(`/admin/chats?chatId=${ticket.chatSessionId}`);
                        }}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium hover:underline"
                      >
                        View
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                    </div>
                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      {getTimeRemaining(ticket.slaDeadline)}
                    </span>
                  </div>

                  {ticket.aiAttempted && (
                    <div className="flex items-center mt-2 text-xs text-blue-600">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Confidence: {Math.round(ticket.aiConfidence * 100)}%
                    </div>
                  )}

                  {ticket.escalations.length > 0 && (
                    <div className="flex items-center mt-1 text-xs text-orange-600">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Escalated {ticket.escalations.length} time(s)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Ticket Details */}
        <div className="flex-1 bg-white dark:bg-gray-800">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              {/* Ticket Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedTicket.id}
                      </h2>
                      <span className={`px-2 py-1 text-xs rounded-full ${getTierColor(selectedTicket.tier)}`}>
                        {selectedTicket.tier.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg text-gray-900 dark:text-white mb-2">
                      {selectedTicket.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedTicket.description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {selectedTicket.chatSessionId && (
                      <button 
                        onClick={() => navigate(`/admin/chats?chatId=${selectedTicket.chatSessionId}`)}
                        className="flex items-center px-3 py-1.5 text-sm bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        View Chat
                      </button>
                    )}
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Edit3 className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Customer & Assignment Info */}
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Customer:</span>
                      <p className="text-gray-600 dark:text-gray-400">{selectedTicket.customerName}</p>
                      {selectedTicket.customerEmail && (
                        <p className="text-gray-500 text-xs">{selectedTicket.customerEmail}</p>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Platform & Source:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        {(() => {
                          const PlatformIcon = getPlatformIcon(selectedTicket.platform);
                          return <PlatformIcon className="h-4 w-4 text-primary-500" />;
                        })()}
                        <span className="text-gray-600 dark:text-gray-400">
                          {platforms.find(p => p.id === selectedTicket.platform)?.name || selectedTicket.platform?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs">Source: {selectedTicket.source}</p>
                      {selectedTicket.chatSessionId && (
                        <p className="text-gray-500 text-xs">Chat: #{selectedTicket.chatSessionId}</p>
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Assigned to:</span>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedTicket.assignedAgent?.name || 'Unassigned'}
                      </p>
                      {selectedTicket.assignedAgent && (
                        <p className="text-gray-500 text-xs">{selectedTicket.assignedAgent.email}</p>
                      )}
                    </div>
                  </div>
              </div>

              {/* AI Suggestions */}
              {selectedTicket.aiSuggestions.length > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-2">
                    <Brain className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      AI Knowledge Base Suggestions
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedTicket.aiSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {suggestion.title}
                          </h4>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                            {Math.round(suggestion.confidence * 100)}% match
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {suggestion.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex flex-wrap gap-1">
                            {suggestion.tags.map((tag) => (
                              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            Used {suggestion.usage_count} times
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Escalation History */}
              {selectedTicket.escalations.length > 0 && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <ArrowUp className="h-4 w-4 mr-2 text-orange-500" />
                    Escalation History
                  </h4>
                  <div className="space-y-3">
                    {selectedTicket.escalations.map((escalation) => (
                      <div key={escalation.id} className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-orange-900 dark:text-orange-100">
                            {escalation.fromTier.toUpperCase()} → {escalation.toTier.toUpperCase()}
                          </span>
                          <span className="text-xs text-orange-600">
                            {new Date(escalation.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                          <strong>Reason:</strong> {escalation.reason}
                        </p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          <strong>By:</strong> {escalation.escalatedBy}
                        </p>
                        {escalation.notes && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            <strong>Notes:</strong> {escalation.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket Timeline/Activity would go here */}
              <div className="flex-1 p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Activity Timeline</h4>
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Activity timeline coming soon...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketManagement;
