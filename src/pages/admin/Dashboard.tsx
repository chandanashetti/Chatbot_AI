import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import {
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Bot,
  CheckCircle,
  AlertCircle,
  Headphones,
  Circle,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  Heart,
  ShoppingCart,
  Package,
  Wrench,
  Hash
} from 'lucide-react'
import { useState, useEffect } from 'react'

const Dashboard = () => {
  const { } = useSelector((state: RootState) => state.analytics)
  const { integrations } = useSelector((state: RootState) => state.integrations)
  const { documents } = useSelector((state: RootState) => state.knowledgeBase)

  const [chatCategories, setChatCategories] = useState({
    complaints: { count: 0, percentage: 0 },
    queries: { count: 0, percentage: 0 },
    feedback: { count: 0, percentage: 0 },
    purchase: { count: 0, percentage: 0 },
    order_related: { count: 0, percentage: 0 },
    support: { count: 0, percentage: 0 },
    general: { count: 0, percentage: 0 }
  })
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Fetch chat categories data
  useEffect(() => {
    const fetchChatCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const response = await fetch('/api/analytics/chat-categories')
        const data = await response.json()

        if (data.success) {
          setChatCategories(data.data.categories)
        } else {
          console.error('Failed to fetch chat categories:', data.error)
          // Keep default empty categories instead of showing fake data
        }
      } catch (error) {
        console.error('Error fetching chat categories:', error)
        // Keep default empty categories instead of showing fake data
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchChatCategories()
  }, [])

  // Category display config
  const categoryConfig = {
    complaints: {
      label: 'Complaints',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    queries: {
      label: 'General Queries',
      icon: HelpCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    feedback: {
      label: 'Feedback',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20'
    },
    purchase: {
      label: 'Purchase',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    order_related: {
      label: 'Order Related',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    support: {
      label: 'Support',
      icon: Wrench,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    general: {
      label: 'General',
      icon: Hash,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-700'
    }
  }

  // Mock data for demo
  const stats = {
    totalQueries: 1247,
    averageResponseTime: 2.3,
    deflectionRate: 78.5,
    uptime: 99.9,
    activeIntegrations: integrations.filter(i => i.isActive).length,
    totalDocuments: documents.length,
    todayQueries: 89,
    weeklyGrowth: 12.5
  }

  const recentActivity = [
    {
      id: 1,
      type: 'message',
      content: 'New message from WhatsApp',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'integration',
      content: 'Instagram integration connected',
      time: '15 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'document',
      content: 'FAQ document uploaded',
      time: '1 hour ago',
      status: 'processing'
    },
    {
      id: 4,
      type: 'error',
      content: 'WhatsApp API connection failed',
      time: '2 hours ago',
      status: 'error'
    }
  ]

  // Mock data for active agents
  const activeAgents = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      role: 'agent',
      status: 'online',
      lastActive: '2 minutes ago',
      currentChats: 3,
      avatar: 'SJ'
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      role: 'agent',
      status: 'online',
      lastActive: '5 minutes ago',
      currentChats: 1,
      avatar: 'MC'
    },
    {
      id: 3,
      name: 'Emily Davis',
      email: 'emily.davis@company.com',
      role: 'agent',
      status: 'away',
      lastActive: '15 minutes ago',
      currentChats: 0,
      avatar: 'ED'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <Activity className="w-4 h-4 text-yellow-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      case 'processing':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your chatbot performance and activity
        </p>
      </div>

      {/* Stats Cards - 12 column grid */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 card p-6 h-full hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-xl">
              <MessageSquare className="w-7 h-7 text-primary-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Total Queries
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalQueries.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-medium">
              +{stats.weeklyGrowth}% this week
            </span>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 card p-6 h-full hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <Clock className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Avg Response Time
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.averageResponseTime}s
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-medium">
              -0.3s from last week
            </span>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 card p-6 h-full hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <Bot className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Deflection Rate
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.deflectionRate}%
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-medium">
              +2.1% from last week
            </span>
          </div>
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 card p-6 h-full hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Active Integrations
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeIntegrations}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end text-sm">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {integrations.length} total configured
            </span>
          </div>
        </div>
      </div>

      {/* Active Agents Section */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-6 card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Headphones className="w-5 h-5 mr-2 text-primary-600" />
            Active Agents
          </h3>
          <div className="space-y-4">
            {activeAgents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {agent.avatar}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                      agent.status === 'online' ? 'bg-green-500' : 
                      agent.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{agent.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{agent.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {agent.currentChats} chat{agent.currentChats !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {agent.lastActive}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary-600" />
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Circle className="w-3 h-3 text-green-500 fill-current" />
                <span className="font-medium text-gray-900 dark:text-white">Chatbot Service</span>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Circle className="w-3 h-3 text-green-500 fill-current" />
                <span className="font-medium text-gray-900 dark:text-white">Database</span>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Circle className="w-3 h-3 text-green-500 fill-current" />
                <span className="font-medium text-gray-900 dark:text-white">API Services</span>
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Running</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Circle className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="font-medium text-gray-900 dark:text-white">WhatsApp Integration</span>
              </div>
              <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Maintenance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity - 12 column grid */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-5 card p-6 h-full">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary-600" />
            Quick Stats
          </h3>
          <div className="space-y-5">
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Today's Queries</span>
              <span className="font-bold text-gray-900 dark:text-white text-lg">{stats.todayQueries}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-medium">System Uptime</span>
              <span className="font-bold text-green-600 dark:text-green-400 text-lg">{stats.uptime}%</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Knowledge Base</span>
              <span className="font-bold text-gray-900 dark:text-white text-lg">{stats.totalDocuments} documents</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Avg Response Time</span>
              <span className="font-bold text-gray-900 dark:text-white text-lg">{stats.averageResponseTime}s</span>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 card p-6 h-full">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-primary-600" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${getStatusColor(activity.status)} mb-1`}>
                    {activity.content}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Categories Section */}
      <div className="card p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
          Chat Categories
          <span className="ml-3 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-medium">
            🤖 AI Powered
          </span>
        </h3>
        {isLoadingCategories ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading categories...</span>
          </div>
        ) : (
          <>
            {Object.values(chatCategories).every(cat => cat.count === 0) ? (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                </div>
                <h4 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No Conversations Yet
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start chatting with your bot to see AI-powered categorization in action
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(chatCategories).map(([key, category]) => {
                  const config = categoryConfig[key as keyof typeof categoryConfig]
                  const IconComponent = config.icon

                  return (
                    <div
                      key={key}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <IconComponent className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {category.percentage}%
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {config.label}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {category.count.toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Integration Status */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary-600" />
          Integration Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  integration.status === 'connected' ? 'bg-green-500' :
                  integration.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {integration.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {integration.status}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                integration.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {integration.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
