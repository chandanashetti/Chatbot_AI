import { useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { setData, setDateRange, setLoading } from '../../store/slices/analyticsSlice'
import { analyticsAPI } from '../../services/api'
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
  Download
} from 'lucide-react'


const Analytics = () => {
  const dispatch = useDispatch()
  const { data, isLoading, error, dateRange } = useSelector((state: RootState) => state.analytics)

  // Mock data for demo
  const mockData = {
    totalQueries: 1247,
    averageResponseTime: 2.3,
    deflectionRate: 78.5,
    uptime: 99.9,
    positiveFeedback: 156,
    negativeFeedback: 23,
    queriesByChannel: {
      web: 456,
      whatsapp: 523,
      instagram: 268
    },
    queriesByDate: [
      { date: '2024-01-01', count: 45 },
      { date: '2024-01-02', count: 52 },
      { date: '2024-01-03', count: 38 },
      { date: '2024-01-04', count: 67 },
      { date: '2024-01-05', count: 73 },
      { date: '2024-01-06', count: 89 },
      { date: '2024-01-07', count: 91 }
    ],
    responseTimeByDate: [
      { date: '2024-01-01', avgTime: 2.1 },
      { date: '2024-01-02', avgTime: 2.3 },
      { date: '2024-01-03', avgTime: 2.0 },
      { date: '2024-01-04', avgTime: 2.5 },
      { date: '2024-01-05', avgTime: 2.2 },
      { date: '2024-01-06', avgTime: 2.4 },
      { date: '2024-01-07', avgTime: 2.3 }
    ]
  }

  // Debounced version of loadAnalytics
  const debouncedLoadAnalytics = useCallback(() => {
    const timeoutId = setTimeout(() => {
      loadAnalytics()
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [dateRange])

  useEffect(() => {
    const cleanup = debouncedLoadAnalytics()
    return cleanup
  }, [debouncedLoadAnalytics])

  const loadAnalytics = async () => {
    dispatch(setLoading(true))
    try {
      console.log('🔄 Loading analytics with date range:', dateRange)
      const [dashboardResponse, chartsResponse] = await Promise.all([
        analyticsAPI.getDashboard(dateRange),
        analyticsAPI.getCharts(dateRange)
      ])
      
      console.log('📊 Dashboard response:', dashboardResponse.data)
      console.log('📈 Charts response:', chartsResponse.data)
      
      const combinedData = {
        ...dashboardResponse.data,
        ...chartsResponse.data
      }
      
      console.log('✅ Combined analytics data:', combinedData)
      dispatch(setData(combinedData))
    } catch (error) {
      console.error('❌ Failed to load analytics:', error)
      console.log('🔄 Falling back to mock data')
      dispatch(setData(mockData))
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

  // Use real data from Redux store, fallback to mock data if not available
  const analyticsData = data || mockData

  const channelData = [
    { name: 'Web Chat', value: analyticsData.queriesByChannel?.web || 0, color: '#3b82f6' },
    { name: 'WhatsApp', value: analyticsData.queriesByChannel?.whatsapp || 0, color: '#10b981' },
    { name: 'Instagram', value: analyticsData.queriesByChannel?.instagram || 0, color: '#f59e0b' }
  ]

  const feedbackData = [
    { name: 'Positive', value: analyticsData.positiveFeedback || 0, color: '#10b981' },
    { name: 'Negative', value: analyticsData.negativeFeedback || 0, color: '#ef4444' }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600 dark:text-red-400">
            <h3 className="text-lg font-medium">Error loading analytics</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your chatbot performance and insights
          </p>
          {dateRange.start && dateRange.end && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Showing data from {new Date(dateRange.start).toLocaleDateString()} to {new Date(dateRange.end).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

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
            <button
              onClick={() => setQuickDateRange('quarter')}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Last 90 days
            </button>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAnalytics}
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

      {/* Data Status Indicator */}
      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700 dark:text-blue-300 text-sm">Loading analytics data...</span>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Queries
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(analyticsData.totalQueries || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">+12.5% from last week</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Response Time
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analyticsData.averageResponseTime || 0}s
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingDown className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-blue-600 dark:text-blue-400">-0.3s from last week</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Deflection Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analyticsData.deflectionRate || 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
            <span className="text-purple-600 dark:text-purple-400">+2.1% from last week</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                System Uptime
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analyticsData.uptime || 0}%
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Last 30 days
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queries Over Time */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Queries Over Time
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.queriesByDate || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={formatDate}
                formatter={(value: any) => [value, 'Queries']}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Over Time */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Response Time Over Time
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.responseTimeByDate || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={formatDate}
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

        {/* Queries by Channel */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Queries by Channel
            </h3>
            <PieChartIcon className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, 'Queries']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Feedback Distribution
            </h3>
            <PieChartIcon className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feedbackData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => [value, 'Feedback']} />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {analyticsData.positiveFeedback || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Positive Feedback
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {analyticsData.negativeFeedback || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Negative Feedback
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {(() => {
                const positive = analyticsData.positiveFeedback || 0;
                const negative = analyticsData.negativeFeedback || 0;
                const total = positive + negative;
                return total > 0 ? ((positive / total) * 100).toFixed(1) : '0.0';
              })()}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Satisfaction Rate
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
