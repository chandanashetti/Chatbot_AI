import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../../store/store'
import { 
  setFilters, 
  deleteBot, 
  duplicateBot, 
  publishBot, 
  unpublishBot,
  publishBotAsync,
  unpublishBotAsync,
  fetchBotsAsync,
  BotStatus,
  BotType 
} from '../../store/slices/botSlice'
import BotCreationModal from '../../components/bots/BotCreationModal'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  Settings,
  BarChart3,
  MessageSquare,
  Users,
  Activity,
  Sparkles,
  Bot as BotIcon,
  Globe,

} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const BotManagement = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { bots, filters, isLoading, error } = useSelector((state: RootState) => state.bots)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  // Only fetch bots on initial mount
  useEffect(() => {
    dispatch(fetchBotsAsync({}))
  }, [dispatch])

  // Separate effect for filter changes with debouncing to prevent excessive API calls
  useEffect(() => {
    // Skip if bots are already loaded and this is just a filter change
    // The filtering is done client-side in the filteredBots computation
    const hasSearchFilter = filters.search && filters.search.length > 0
    const hasTypeFilter = filters.type !== 'all'
    const hasStatusFilter = filters.status !== 'all'
    
    // Only fetch from API if we have filters that might need server-side filtering
    // For now, we'll do all filtering client-side to prevent refreshes
    if (hasSearchFilter && filters.search.length > 2) {
      const debounceTimer = setTimeout(() => {
        dispatch(fetchBotsAsync({
          search: filters.search || undefined
        }))
      }, 500) // 500ms debounce for search
      
      return () => clearTimeout(debounceTimer)
    }
  }, [dispatch, filters.search]) // Only depend on search, not all filters

  // Show error toast if there's an API error
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`)
    }
  }, [error])

  const handleBotAction = async (action: string, botId: string) => {
    const bot = bots.find(b => b.id === botId)
    if (!bot) return

    switch (action) {
      case 'edit':
        navigate(`/admin/bots/${botId}/builder`)
        break
      case 'duplicate':
        dispatch(duplicateBot(botId))
        toast.success(`${bot.name} duplicated successfully!`)
        break
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${bot.name}"?`)) {
          dispatch(deleteBot(botId))
          toast.success(`${bot.name} deleted successfully!`)
        }
        break
                case 'publish':
            try {
              await dispatch(publishBotAsync(botId)).unwrap()
              toast.success(`${bot.name} published successfully!`)
            } catch (error) {
              toast.error(`Failed to publish ${bot.name}: ${error}`)
            }
            break
          case 'unpublish':
            try {
              await dispatch(unpublishBotAsync(botId)).unwrap()
              toast.success(`${bot.name} unpublished successfully!`)
            } catch (error) {
              toast.error(`Failed to unpublish ${bot.name}: ${error}`)
            }
            break
      case 'settings':
        navigate(`/admin/bots/${botId}/settings`)
        break
      case 'analytics':
        navigate(`/admin/bots/${botId}/analytics`)
        break
    }
    setShowDropdown(null)
  }

  const getBotStatusColor = (status: BotStatus) => {
    switch (status) {
      case 'active': return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      case 'draft': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
      case 'testing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'archived': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getBotTypeIcon = (type: BotType) => {
    switch (type) {
      case 'lead_generation': return <Sparkles className="w-5 h-5 text-blue-600" />
      case 'customer_support': return <MessageSquare className="w-5 h-5 text-green-600" />
      case 'data_collection': return <BarChart3 className="w-5 h-5 text-purple-600" />
      case 'sales': return <Users className="w-5 h-5 text-orange-600" />
      case 'survey': return <Filter className="w-5 h-5 text-pink-600" />
      default: return <BotIcon className="w-5 h-5 text-slate-600" />
    }
  }

  const filteredBots = bots.filter(bot => {
    const matchesType = filters.type === 'all' || bot.type === filters.type
    const matchesStatus = filters.status === 'all' || bot.status === filters.status
    const matchesSearch = !filters.search || 
      bot.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      bot.description.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesType && matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Bot Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create, manage, and deploy your AI chatbots across multiple platforms
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create new bot</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-2xl">
              <BotIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {bots.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Bots</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-2xl">
              <Activity className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {bots.filter(b => b.status === 'active').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Bots</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-2xl">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {bots.reduce((sum, bot) => sum + bot.analytics.totalConversations, 0)}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Conversations</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-2xl">
              <Users className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {bots.reduce((sum, bot) => sum + bot.analytics.activeConversations, 0)}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Conversations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search here for bot"
                value={filters.search}
                onChange={(e) => dispatch(setFilters({ search: e.target.value }))}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.type}
              onChange={(e) => dispatch(setFilters({ type: e.target.value as any }))}
              className="input-field min-w-40"
            >
              <option value="all">All</option>
              <option value="lead_generation">Lead Generation</option>
              <option value="customer_support">Customer Support</option>
              <option value="data_collection">Data Collection</option>
              <option value="sales">Sales</option>
              <option value="survey">Survey</option>
              <option value="custom">Custom</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => dispatch(setFilters({ status: e.target.value as any }))}
              className="input-field min-w-32"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="testing">Testing</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bots Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <span className="text-slate-600 dark:text-slate-400">Loading bots...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBots.map((bot) => (
          <div key={bot.id} className="card p-6 hover-lift group relative">
            {/* Bot Avatar/Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                {bot.settings.appearance.avatar ? (
                  <img 
                    src={bot.settings.appearance.avatar} 
                    alt={bot.name} 
                    className="w-full h-full rounded-2xl object-cover" 
                  />
                ) : (
                  bot.name.charAt(0).toUpperCase()
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(showDropdown === bot.id ? null : bot.id)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="w-4 h-4 text-slate-500" />
                </button>
                
                {showDropdown === bot.id && (
                  <div className="absolute right-0 top-full mt-2 w-48 card p-2 shadow-lg z-10">
                    <button
                      onClick={() => handleBotAction('edit', bot.id)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit Bot</span>
                    </button>
                    <button
                      onClick={() => handleBotAction('settings', bot.id)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => handleBotAction('analytics', bot.id)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                    </button>
                    <hr className="my-2 border-slate-200 dark:border-slate-700" />
                    <button
                      onClick={() => handleBotAction('duplicate', bot.id)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={() => handleBotAction(bot.isPublished ? 'unpublish' : 'publish', bot.id)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      {bot.isPublished ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{bot.isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>
                    <hr className="my-2 border-slate-200 dark:border-slate-700" />
                    <button
                      onClick={() => handleBotAction('delete', bot.id)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bot Info */}
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 truncate">
                {bot.name}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                {bot.description}
              </p>
              
              <div className="flex items-center space-x-2 mb-3">
                {getBotTypeIcon(bot.type)}
                <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {bot.type.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-xl text-xs font-medium ${getBotStatusColor(bot.status)}`}>
                  {bot.status}
                </span>
                {bot.isPublished && (
                  <div className="flex items-center space-x-1 text-success-600">
                    <Globe className="w-3 h-3" />
                    <span className="text-xs">Live</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bot Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {bot.analytics.totalConversations}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Conversations</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {bot.analytics.completionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Completion</div>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {bot.isPublished && bot.status === 'active' ? 'Online' : 'Offline'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bot.isPublished && bot.status === 'active'}
                  onChange={() => handleBotAction((bot.isPublished && bot.status === 'active') ? 'unpublish' : 'publish', bot.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Last Updated */}
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Updated {format(new Date(bot.updatedAt), 'MMM dd, yyyy')}
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBots.length === 0 && (
        <div className="text-center py-12">
          <BotIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {filters.search || filters.type !== 'all' || filters.status !== 'all'
              ? 'No bots found matching your filters'
              : 'No bots created yet'
            }
          </p>
          {(!filters.search && filters.type === 'all' && filters.status === 'all') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Bot
            </button>
          )}
        </div>
      )}

      {/* Bot Creation Modal */}
      <BotCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBotCreated={(botId) => {
          // Navigate to bot builder or show success
          console.log('Bot created:', botId)
        }}
      />
    </div>
  )
}

export default BotManagement
