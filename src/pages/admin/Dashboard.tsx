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
  AlertCircle
} from 'lucide-react'

const Dashboard = () => {
  const { } = useSelector((state: RootState) => state.analytics)
  const { integrations } = useSelector((state: RootState) => state.integrations)
  const { documents } = useSelector((state: RootState) => state.knowledgeBase)

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
