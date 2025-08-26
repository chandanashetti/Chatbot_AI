import { useState, useMemo, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { logout } from '../../store/slices/authSlice'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  BarChart3,
  List,
  LogOut,
  Menu,
  X,
  Bot,
  User,
  Sun,
  Moon,
  History,
  Headphones,
  Sparkles,
  Crown,
  Ticket
} from 'lucide-react'
import { useTheme } from '../providers/ThemeProvider'

// Centralized navigation config
const NAVIGATION_CONFIG = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin', 'superadmin', 'manager'] },
  { name: 'Bot Management', href: '/admin/bots', icon: Bot, roles: ['admin', 'superadmin'] },
  { name: 'Integrations', href: '/admin/integrations', icon: MessageSquare, roles: ['admin', 'superadmin'] },
  { name: 'Agent Management', href: '/admin/agents', icon: Headphones, roles: ['admin', 'superadmin'] },
  { name: 'Chat Review', href: '/admin/chats', icon: History, roles: ['admin', 'superadmin', 'manager'] },
  { name: 'Ticket Management', href: '/admin/tickets', icon: Ticket, roles: ['admin', 'superadmin', 'manager'] },
  { name: 'User Management', href: '/admin/users', icon: User, roles: ['admin', 'superadmin'] },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['admin', 'superadmin', 'manager'] },
  { name: 'Knowledge Base', href: '/admin/knowledge-base', icon: FileText, roles: ['admin', 'superadmin', 'manager'] },
  { name: 'Logs', href: '/admin/logs', icon: List, roles: ['admin', 'superadmin'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin', 'superadmin'] },
]

const AdminLayout: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const { isDark, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role = user?.role || 'admin' // Default role if missing

  // Filter navigation based on role
  const navigation = useMemo(
    () => NAVIGATION_CONFIG.filter(item => item.roles.includes(role)),
    [role]
  )

  const handleLogout = useCallback(() => {
    dispatch(logout())
    navigate('/login')
  }, [dispatch, navigate])

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary-400/10 to-accent-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-accent-400/10 to-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-slate-900/50 backdrop-blur-sm"
          role="presentation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/20 dark:border-slate-800/50 transform transition-all duration-300 ease-in-out flex flex-col h-screen shadow-glass
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
        aria-label="Sidebar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Logo and Close */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/20 dark:border-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl blur-lg opacity-50 animate-glow"></div>
              <div className="relative bg-gradient-to-r from-primary-600 to-accent-600 p-2 rounded-2xl">
                <Bot className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold text-gradient">
                Admin Panel
              </span>
              <div className="flex items-center space-x-1 mt-1">
                <Crown className="w-3 h-3 text-accent-600" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Pro Dashboard
                </span>
              </div>
            </div>
          </div>
          <button
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden btn-ghost p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 flex-1 overflow-y-auto scrollbar-thin">
          <div className="space-y-2">
            {navigation.map((item, index) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/admin'}
                  className={({ isActive }) =>
                    `group flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 animate-fade-in-up ${
                      isActive
                        ? 'bg-white/90 dark:bg-slate-800/90 text-primary-700 dark:text-primary-300 shadow-lg backdrop-blur-sm border border-primary-200/50 dark:border-primary-800/50'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-primary-600 dark:hover:text-primary-400'
                    }`
                  }
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-4 w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  {item.name}
                  {item.name === 'Dashboard' && (
                    <Sparkles className="ml-auto w-4 h-4 text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="mt-auto p-6 border-t border-white/20 dark:border-slate-800/50">
          <div className="card p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {user?.email || 'admin@example.com'}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span className="text-xs text-success-600 dark:text-success-400 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-300 group"
          >
            <LogOut className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header */}
        <header className="sticky top-0 h-16 nav-glass z-30 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden btn-ghost p-2"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb or page title could go here */}
            <div className="hidden lg:block">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="btn-ghost p-3 rounded-2xl group"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              ) : (
                <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>
            
            <div className="hidden sm:flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse-fast"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">System Online</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout