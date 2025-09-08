import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { RootState } from '../store/store'
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice'
import { authAPI } from '../services/api'
import { Bot, Eye, EyeOff, Loader2, Sparkles, Shield, ArrowLeft } from 'lucide-react'
import { useTheme } from '../components/providers/ThemeProvider'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)
  const { isDark, toggleTheme } = useTheme()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    // Demo authentication bypass for testing
    if (formData.email === 'admin@chatbot.ai' && formData.password === 'admin123') {
      dispatch(loginStart())
      
      // Simulate API delay
      setTimeout(() => {
        const mockUser = {
          id: '1',
          email: formData.email,
          username: 'admin',
          role: 'admin' as const,
          status: 'active',
          profile: {
            firstName: 'Admin',
            lastName: 'User',
            timezone: 'UTC',
            language: 'en'
          },
          permissions: {
            dashboard: { view: true, export: true },
            users: { view: true, create: true, edit: true, delete: true, manageRoles: true },
            bots: { view: true, create: true, edit: true, delete: true, publish: true },
            agents: { view: true, create: true, edit: true, delete: true, assign: true },
            analytics: { view: true, export: true, advanced: true },
            knowledgeBase: { view: true, upload: true, edit: true, delete: true },
            settings: { view: true, edit: true, system: true }
          }
        }
        const mockToken = 'demo-token-123'
        
        dispatch(loginSuccess({ user: mockUser, token: mockToken }))
        toast.success('Welcome to your dashboard! 🎉')
        navigate('/admin')
      }, 1500)
      
      return
    }

    dispatch(loginStart())

    try {
      const response = await authAPI.login(formData)
      const { user, token } = response.data
      
      dispatch(loginSuccess({ user, token }))
      toast.success('Login successful!')
      navigate('/admin')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.'
      dispatch(loginFailure(errorMessage))
      toast.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary-400/20 to-accent-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-accent-400/20 to-primary-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-300/10 to-accent-300/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl blur-lg opacity-50 animate-glow"></div>
              <div className="relative bg-gradient-to-r from-primary-600 to-accent-600 p-4 rounded-3xl">
                <Bot className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200/50 dark:border-primary-800/50 mb-6">
            <Shield className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              Secure Admin Access
            </span>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">
            <span className="text-gradient">Welcome Back</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Access your AI chatbot administration panel
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={toggleTheme}
            className="btn-ghost p-3 rounded-2xl group"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <span className="text-2xl group-hover:rotate-180 transition-transform duration-500 block">🌞</span>
            ) : (
              <span className="text-2xl group-hover:-rotate-12 transition-transform duration-300 block">🌙</span>
            )}
          </button>
        </div>

        {/* Login Form */}
        <div className="card-gradient p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field pr-12"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl animate-fade-in">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <Sparkles className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">🎯</span>
              </div>
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200">
                Demo Mode - Try It Out!
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-blue-200/30 dark:border-blue-700/30">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Email:</span>
                <code className="text-sm font-mono text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                  admin@chatbot.ai
                </code>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-blue-200/30 dark:border-blue-700/30">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Password:</span>
                <code className="text-sm font-mono text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                  admin123
                </code>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center mt-3 font-medium">
                ✨ Full access to all admin features in demo mode
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage