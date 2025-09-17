import { useEffect, useCallback, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { setDateRange, setLoading } from '../../store/slices/analyticsSlice'
import { agentAPI } from '../../services/api'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  MessageSquare,
  CheckCircle,
  Star
} from 'lucide-react'

interface AgentAnalytics {
  personalMetrics: {
    totalChatsHandled: number;
    activeChats: number;
    averageResponseTime: number;
    customerSatisfactionScore: number;
    ratingsCount: number;
    completionRate: number;
    handoffsAccepted: number;
    handoffsCompleted: number;
  };
  performanceByDate: Array<{
    date: string;
    chatsHandled: number;
    avgResponseTime: number;
    satisfaction: number;
  }>;
  chatsByCategory: {
    technical: number;
    billing: number;
    sales: number;
    support: number;
    general: number;
  };
  satisfactionDistribution: Array<{
    rating: number;
    count: number;
  }>;
  responseTimeByHour: Array<{
    hour: string;
    avgTime: number;
  }>;
  monthlyGoals: {
    chatsTarget: number;
    chatsActual: number;
    satisfactionTarget: number;
    satisfactionActual: number;
    responseTimeTarget: number;
    responseTimeActual: number;
  };
}

const AgentAnalytics = () => {
  const dispatch = useDispatch()
  const { isLoading, dateRange } = useSelector((state: RootState) => state.analytics)
  const { user } = useSelector((state: RootState) => state.auth)
  const [agentData, setAgentData] = useState<AgentAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get current agent ID from authenticated user
  const currentAgentId = user?.id || null

  // Mock data for agent analytics
  const mockAgentData: AgentAnalytics = {
    personalMetrics: {
      totalChatsHandled: 127,
      activeChats: 3,
      averageResponseTime: 2.1,
      customerSatisfactionScore: 4.3,
      ratingsCount: 45,
      completionRate: 94.5,
      handoffsAccepted: 18,
      handoffsCompleted: 17
    },
    performanceByDate: [
      { date: '2024-01-01', chatsHandled: 8, avgResponseTime: 2.3, satisfaction: 4.1 },
      { date: '2024-01-02', chatsHandled: 12, avgResponseTime: 2.0, satisfaction: 4.4 },
      { date: '2024-01-03', chatsHandled: 6, avgResponseTime: 2.5, satisfaction: 4.2 },
      { date: '2024-01-04', chatsHandled: 15, avgResponseTime: 1.8, satisfaction: 4.6 },
      { date: '2024-01-05', chatsHandled: 11, avgResponseTime: 2.2, satisfaction: 4.3 },
      { date: '2024-01-06', chatsHandled: 9, avgResponseTime: 2.1, satisfaction: 4.5 },
      { date: '2024-01-07', chatsHandled: 13, avgResponseTime: 1.9, satisfaction: 4.4 }
    ],
    chatsByCategory: {
      technical: 35,
      billing: 28,
      sales: 22,
      support: 31,
      general: 11
    },
    satisfactionDistribution: [
      { rating: 5, count: 25 },
      { rating: 4, count: 15 },
      { rating: 3, count: 4 },
      { rating: 2, count: 1 },
      { rating: 1, count: 0 }
    ],
    responseTimeByHour: [
      { hour: '09:00', avgTime: 1.8 },
      { hour: '10:00', avgTime: 2.1 },
      { hour: '11:00', avgTime: 2.3 },
      { hour: '12:00', avgTime: 2.8 },
      { hour: '13:00', avgTime: 2.5 },
      { hour: '14:00', avgTime: 2.2 },
      { hour: '15:00', avgTime: 2.0 },
      { hour: '16:00', avgTime: 1.9 },
      { hour: '17:00', avgTime: 2.1 }
    ],
    monthlyGoals: {
      chatsTarget: 150,
      chatsActual: 127,
      satisfactionTarget: 4.5,
      satisfactionActual: 4.3,
      responseTimeTarget: 2.0,
      responseTimeActual: 2.1
    }
  }

  // Debounced version of loadAgentAnalytics
  const debouncedLoadAnalytics = useCallback(() => {
    const timeoutId = setTimeout(() => {
      loadAgentAnalytics()
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [dateRange])

  useEffect(() => {
    const cleanup = debouncedLoadAnalytics()
    return cleanup
  }, [debouncedLoadAnalytics])

  const loadAgentAnalytics = async () => {
    if (!currentAgentId) {
      console.warn('⚠️ No agent ID available - user may not be logged in as agent')
      setError('Agent authentication required. Please ensure you are logged in with agent privileges.')
      setAgentData(mockAgentData)
      return
    }

    dispatch(setLoading(true))
    setError(null)

    try {
      console.log('🔄 Loading agent analytics for agent:', currentAgentId, 'with date range:', dateRange)

      // Try to load real agent analytics data
      const response = await agentAPI.getAgentAnalytics(currentAgentId, dateRange)

      console.log('📊 Agent analytics response:', response.data)
      setAgentData(response.data)
      setError(null) // Clear any previous errors
    } catch (error: any) {
      console.error('❌ Failed to load agent analytics:', error)
      console.error('Error details:', error.response?.data || error.message)

      if (error.response?.status === 404) {
        setError('Agent profile not found. Please contact your administrator to set up your agent profile.')
      } else if (error.response?.status === 403) {
        setError('Access denied. You may not have agent permissions.')
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.')
      } else {
        setError(`Could not load real-time data: ${error.response?.data?.error || error.message}. Showing sample data.`)
      }

      console.log('🔄 Falling back to mock data')
      setAgentData(mockAgentData)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    dispatch(setDateRange({ ...dateRange, [field]: value }))
  }

  const setQuickDateRange = (period: 'today' | 'week' | 'month' | 'quarter') => {
    const end = new Date()
    let start = new Date()

    switch (period) {
      case 'today':
        start = new Date()
        break
      case 'week':
        start.setDate(end.getDate() - 7)
        break
      case 'month':
        start.setDate(end.getDate() - 30)
        break
      case 'quarter':
        start.setDate(end.getDate() - 90)
        break
    }

    dispatch(setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const categoryData = agentData ? [
    { name: 'Technical', value: agentData.chatsByCategory.technical, color: '#3b82f6' },
    { name: 'Billing', value: agentData.chatsByCategory.billing, color: '#10b981' },
    { name: 'Sales', value: agentData.chatsByCategory.sales, color: '#f59e0b' },
    { name: 'Support', value: agentData.chatsByCategory.support, color: '#8b5cf6' },
    { name: 'General', value: agentData.chatsByCategory.general, color: '#6b7280' }
  ] : []


  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your performance and progress as an agent
          </p>
          {dateRange.start && dateRange.end && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Showing data from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="text-yellow-700 dark:text-yellow-300 text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="input-field"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {/* Quick Date Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Quick filters:</span>
            <button
              onClick={() => setQuickDateRange('today')}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setQuickDateRange('week')}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Last 7 days
            </button>
            <button
              onClick={() => setQuickDateRange('month')}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Last 30 days
            </button>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAgentAnalytics}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              <span className="text-sm">{isLoading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Chats Handled
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {agentData?.personalMetrics.totalChatsHandled || 0}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">+8% from last week</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {agentData?.personalMetrics.averageResponseTime || 0}s
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">-0.2s improvement</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Satisfaction Score
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {agentData?.personalMetrics.customerSatisfactionScore?.toFixed(1) || 0}/5
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Based on {agentData?.personalMetrics.ratingsCount || 0} ratings
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completion Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {agentData?.personalMetrics.completionRate?.toFixed(1) || 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {agentData?.personalMetrics.handoffsCompleted || 0}/{agentData?.personalMetrics.handoffsAccepted || 0} completed
          </div>
        </div>
      </div>

      {/* Monthly Goals Progress */}
      {agentData?.monthlyGoals && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Monthly Goals Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chats Target</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {agentData.monthlyGoals.chatsActual}/{agentData.monthlyGoals.chatsTarget}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min((agentData.monthlyGoals.chatsActual / agentData.monthlyGoals.chatsTarget) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Satisfaction Target</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {agentData.monthlyGoals.satisfactionActual.toFixed(1)}/{agentData.monthlyGoals.satisfactionTarget.toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${Math.min((agentData.monthlyGoals.satisfactionActual / agentData.monthlyGoals.satisfactionTarget) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Response Time Target</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {agentData.monthlyGoals.responseTimeActual.toFixed(1)}s / &lt;{agentData.monthlyGoals.responseTimeTarget.toFixed(1)}s
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((agentData.monthlyGoals.responseTimeTarget / agentData.monthlyGoals.responseTimeActual) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Performance */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Performance
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={agentData?.performanceByDate || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={formatDate}
                formatter={(value: any, name: string) => [
                  name === 'chatsHandled' ? `${value} chats` :
                  name === 'avgResponseTime' ? `${value}s` :
                  name === 'satisfaction' ? `${value}/5` : value,
                  name === 'chatsHandled' ? 'Chats Handled' :
                  name === 'avgResponseTime' ? 'Response Time' :
                  name === 'satisfaction' ? 'Satisfaction' : name
                ]}
              />
              <Line
                type="monotone"
                dataKey="chatsHandled"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time by Hour */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Response Time by Hour
            </h3>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={agentData?.responseTimeByHour || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => [`${value}s`, 'Response Time']}
              />
              <Area
                type="monotone"
                dataKey="avgTime"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chats by Category */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chats by Category
            </h3>
            <PieChartIcon className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, 'Chats']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Satisfaction Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Customer Satisfaction
            </h3>
            <Star className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentData?.satisfactionDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="rating"
                tickFormatter={(value) => `${value}⭐`}
              />
              <YAxis />
              <Tooltip
                formatter={(value: any) => [value, 'Ratings']}
                labelFormatter={(value) => `${value} Stars`}
              />
              <Bar
                dataKey="count"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AgentAnalytics