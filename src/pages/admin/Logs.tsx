import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { setLogs, setFilters, setPagination } from '../../store/slices/logsSlice'
import { logsAPI } from '../../services/api'
import { 
  Search, 
  Filter, 
  Download, 

  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const Logs = () => {
  const dispatch = useDispatch()
  const { filteredLogs, filters, pagination, isLoading } = useSelector((state: RootState) => state.logs)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [filters, pagination.currentPage])

  const loadLogs = async () => {
    try {
      const response = await logsAPI.getLogs({
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        channel: filters.channel,
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        keywords: filters.keywords,
        status: filters.status
      })
      
      dispatch(setLogs(response.data.logs))
      dispatch(setPagination({
        totalPages: Math.ceil(response.data.total / pagination.itemsPerPage)
      }))
    } catch (error) {
      toast.error('Failed to load logs')
    }
  }

  const handleFilterChange = (field: string, value: any) => {
    dispatch(setFilters({ [field]: value }))
    dispatch(setPagination({ currentPage: 1 }))
  }

  const handleSearch = () => {
    dispatch(setFilters({ keywords: searchTerm }))
    dispatch(setPagination({ currentPage: 1 }))
  }

  const handleClearFilters = () => {
    dispatch(setFilters({
      channel: '',
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      keywords: '',
      status: ''
    }))
    setSearchTerm('')
    dispatch(setPagination({ currentPage: 1 }))
  }

  const handleExport = async () => {
    try {
      const response = await logsAPI.exportLogs(filters)
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Logs exported successfully')
    } catch (error) {
      toast.error('Failed to export logs')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'timeout':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return '💬'
      case 'instagram':
        return '📷'
      case 'web':
        return '🌐'
      default:
        return '📱'
    }
  }

  const getFeedbackIcon = (feedback?: string) => {
    if (!feedback) return null
    return feedback === 'positive' ? '👍' : '👎'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and analyze chat message history
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filters
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search messages..."
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-primary"
          >
            Search
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Channel
              </label>
              <select
                value={filters.channel}
                onChange={(e) => handleFilterChange('channel', e.target.value)}
                className="input-field"
              >
                <option value="">All Channels</option>
                <option value="web">Web Chat</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input-field"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="timeout">Timeout</option>
              </select>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(filters.channel || filters.keywords || filters.status) && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Response Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {log.message}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{getChannelIcon(log.channel)}</span>
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {log.channel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.responseTime}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(log.status)}
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getFeedbackIcon(log.feedback)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => dispatch(setPagination({ currentPage: pagination.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => dispatch(setPagination({ currentPage: pagination.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn-secondary px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredLogs.length === 0 && !isLoading && (
        <div className="card p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No logs found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  )
}

export default Logs
