import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { updateBotSettings } from '../../store/slices/botSlice'
import {
  ArrowLeft,
  Save,
  Palette,
  Type,
  User,
  Monitor,
  MessageSquare,
  Image,
  Upload,
  Eye,
  Smartphone,
  Tablet,
  RotateCcw,
  Download,
  Copy
} from 'lucide-react'
import toast from 'react-hot-toast'

// Local interface for widget appearance settings
interface WidgetAppearance {
  avatar: string
  name: string
  welcomeMessage: string
  description: string
  theme: {
    primaryColor: string
    secondaryColor: string
    backgroundColor: string
    textColor: string
  }
  typography: {
    fontFamily: string
    fontSize: number
    lineHeight: number
  }
  position: {
    side: 'left' | 'right'
    offset: { x: number; y: number }
  }
  messageStyle: {
    bubbleStyle: 'rounded' | 'square' | 'minimal'
    showAvatar: boolean
    showTimestamp: boolean
  }
  background: {
    type: 'none' | 'color' | 'gradient' | 'image'
    value: string
  }
}

interface WidgetSettings {
  appearance: WidgetAppearance
}

const BotSettings = () => {
  const { botId } = useParams<{ botId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { bots } = useSelector((state: RootState) => state.bots)
  
  const bot = bots.find(b => b.id === botId)
  
  const [activeTab, setActiveTab] = useState('appearance')
  const [settings, setSettings] = useState<WidgetSettings>(() => {
    const defaultSettings: WidgetSettings = {
      appearance: {
        avatar: bot?.settings?.appearance?.avatar || '',
        name: bot?.settings?.appearance?.name || bot?.name || 'AI Assistant',
        welcomeMessage: bot?.settings?.appearance?.welcomeMessage || 'Hello! How can I help you today?',
        description: bot?.settings?.appearance?.description || '',
        theme: {
          primaryColor: bot?.settings?.appearance?.theme?.primaryColor || '#3B82F6',
          secondaryColor: bot?.settings?.appearance?.theme?.secondaryColor || '#EFF6FF',
          backgroundColor: bot?.settings?.appearance?.theme?.backgroundColor || '#FFFFFF',
          textColor: bot?.settings?.appearance?.theme?.textColor || '#374151'
        },
        typography: {
          fontFamily: bot?.settings?.appearance?.typography?.fontFamily || 'system-ui',
          fontSize: bot?.settings?.appearance?.typography?.fontSize || 14,
          lineHeight: bot?.settings?.appearance?.typography?.lineHeight || 1.5
        },
        position: {
          side: (bot?.settings?.appearance?.position?.side || 'right') as 'left' | 'right',
          offset: { 
            x: bot?.settings?.appearance?.position?.offset?.x || 20, 
            y: bot?.settings?.appearance?.position?.offset?.y || 20 
          }
        },
        messageStyle: {
          bubbleStyle: (bot?.settings?.appearance?.messageStyle?.bubbleStyle || 'rounded') as 'rounded' | 'square' | 'minimal',
          showAvatar: bot?.settings?.appearance?.messageStyle?.showAvatar ?? true,
          showTimestamp: bot?.settings?.appearance?.messageStyle?.showTimestamp ?? false
        },
        background: {
          type: (bot?.settings?.appearance?.background?.type || 'none') as 'none' | 'color' | 'gradient' | 'image',
          value: bot?.settings?.appearance?.background?.value || ''
        }
      }
    }
    return defaultSettings
  })
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  
  useEffect(() => {
    if (!bot) {
      navigate('/admin/bots')
      return
    }
    // Re-initialize with current bot settings when bot changes
    const newSettings: WidgetSettings = {
      appearance: {
        avatar: bot.settings?.appearance?.avatar || '',
        name: bot.settings?.appearance?.name || bot.name || 'AI Assistant',
        welcomeMessage: bot.settings?.appearance?.welcomeMessage || 'Hello! How can I help you today?',
        description: bot.settings?.appearance?.description || '',
        theme: {
          primaryColor: bot.settings?.appearance?.theme?.primaryColor || '#3B82F6',
          secondaryColor: bot.settings?.appearance?.theme?.secondaryColor || '#EFF6FF',
          backgroundColor: bot.settings?.appearance?.theme?.backgroundColor || '#FFFFFF',
          textColor: bot.settings?.appearance?.theme?.textColor || '#374151'
        },
        typography: {
          fontFamily: bot.settings?.appearance?.typography?.fontFamily || 'system-ui',
          fontSize: bot.settings?.appearance?.typography?.fontSize || 14,
          lineHeight: bot.settings?.appearance?.typography?.lineHeight || 1.5
        },
        position: {
          side: (bot.settings?.appearance?.position?.side || 'right') as 'left' | 'right',
          offset: { 
            x: bot.settings?.appearance?.position?.offset?.x || 20, 
            y: bot.settings?.appearance?.position?.offset?.y || 20 
          }
        },
        messageStyle: {
          bubbleStyle: (bot.settings?.appearance?.messageStyle?.bubbleStyle || 'rounded') as 'rounded' | 'square' | 'minimal',
          showAvatar: bot.settings?.appearance?.messageStyle?.showAvatar ?? true,
          showTimestamp: bot.settings?.appearance?.messageStyle?.showTimestamp ?? false
        },
        background: {
          type: (bot.settings?.appearance?.background?.type || 'none') as 'none' | 'color' | 'gradient' | 'image',
          value: bot.settings?.appearance?.background?.value || ''
        }
      }
    }
    setSettings(newSettings)
  }, [bot, navigate])

  const handleSave = () => {
    if (!bot) return
    
    dispatch(updateBotSettings({ botId: bot.id, settings }))
    toast.success('Widget settings saved successfully!')
  }

  const handleReset = () => {
    if (!bot) return
    
    // Reset to current bot settings
    const resetSettings: WidgetSettings = {
      appearance: {
        avatar: bot.settings?.appearance?.avatar || '',
        name: bot.settings?.appearance?.name || bot.name || 'AI Assistant',
        welcomeMessage: bot.settings?.appearance?.welcomeMessage || 'Hello! How can I help you today?',
        description: bot.settings?.appearance?.description || '',
        theme: {
          primaryColor: bot.settings?.appearance?.theme?.primaryColor || '#3B82F6',
          secondaryColor: bot.settings?.appearance?.theme?.secondaryColor || '#EFF6FF',
          backgroundColor: bot.settings?.appearance?.theme?.backgroundColor || '#FFFFFF',
          textColor: bot.settings?.appearance?.theme?.textColor || '#374151'
        },
        typography: {
          fontFamily: bot.settings?.appearance?.typography?.fontFamily || 'system-ui',
          fontSize: bot.settings?.appearance?.typography?.fontSize || 14,
          lineHeight: bot.settings?.appearance?.typography?.lineHeight || 1.5
        },
        position: {
          side: (bot.settings?.appearance?.position?.side || 'right') as 'left' | 'right',
          offset: { 
            x: bot.settings?.appearance?.position?.offset?.x || 20, 
            y: bot.settings?.appearance?.position?.offset?.y || 20 
          }
        },
        messageStyle: {
          bubbleStyle: (bot.settings?.appearance?.messageStyle?.bubbleStyle || 'rounded') as 'rounded' | 'square' | 'minimal',
          showAvatar: bot.settings?.appearance?.messageStyle?.showAvatar ?? true,
          showTimestamp: bot.settings?.appearance?.messageStyle?.showTimestamp ?? false
        },
        background: {
          type: (bot.settings?.appearance?.background?.type || 'none') as 'none' | 'color' | 'gradient' | 'image',
          value: bot.settings?.appearance?.background?.value || ''
        }
      }
    }
    setSettings(resetSettings)
    toast.success('Settings reset to last saved state')
  }

  const handleExportSettings = () => {
    const exportData = {
      widgetSettings: settings,
      exportedAt: new Date().toISOString(),
      botName: bot?.name
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${bot?.name || 'bot'}-widget-settings.json`
    a.click()
    
    toast.success('Widget settings exported!')
  }

  const handleCopyEmbedCode = () => {
    const embedCode = `<script>
  (function() {
    var chatWidget = document.createElement('script');
    chatWidget.src = '${window.location.origin}/widget.js';
    chatWidget.async = true;
    chatWidget.setAttribute('data-bot-id', '${botId}');
    chatWidget.setAttribute('data-config', '${JSON.stringify(settings).replace(/"/g, '&quot;')}');
    document.head.appendChild(chatWidget);
  })();
</script>`

    navigator.clipboard.writeText(embedCode)
    toast.success('Embed code copied to clipboard!')
  }

  const tabs = [
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'typography', name: 'Typography', icon: Type },
    { id: 'avatar', name: 'Avatar', icon: User },
    { id: 'position', name: 'Position', icon: Monitor },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'background', name: 'Background', icon: Image }
  ]

  const presetThemes = [
    { 
      name: 'Professional Blue',
      colors: { primary: '#3B82F6', secondary: '#EFF6FF', accent: '#1E40AF' }
    },
    { 
      name: 'Modern Purple',
      colors: { primary: '#8B5CF6', secondary: '#F3E8FF', accent: '#5B21B6' }
    },
    { 
      name: 'Fresh Green',
      colors: { primary: '#10B981', secondary: '#D1FAE5', accent: '#047857' }
    },
    { 
      name: 'Warm Orange',
      colors: { primary: '#F59E0B', secondary: '#FEF3C7', accent: '#D97706' }
    },
    { 
      name: 'Classic Dark',
      colors: { primary: '#374151', secondary: '#F9FAFB', accent: '#111827' }
    },
    { 
      name: 'Elegant Rose',
      colors: { primary: '#F43F5E', secondary: '#FFF1F2', accent: '#BE123C' }
    }
  ]



  if (!bot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-slate-600 dark:text-slate-400">Bot not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/bots')}
              className="btn-ghost p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {bot.name} - Widget Settings
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Customize the look and feel of your chat widget
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportSettings}
              className="btn-ghost"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            
            <button
              onClick={handleCopyEmbedCode}
              className="btn-secondary"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Embed Code
            </button>
            
            <button
              onClick={handleReset}
              className="btn-ghost"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
            
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              )
            })}
          </div>

          {/* Preview Controls */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Preview Mode
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-lg ${previewMode === 'desktop' ? 'bg-primary-100 text-primary-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`p-2 rounded-lg ${previewMode === 'tablet' ? 'bg-primary-100 text-primary-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-lg ${previewMode === 'mobile' ? 'bg-primary-100 text-primary-600' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Settings Panel */}
          <div className="w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
            
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Widget Header</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Bot Name
                      </label>
                      <input
                        type="text"
                        value={settings.appearance?.name || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, name: e.target.value }
                        })}
                        className="input-field"
                        placeholder="Enter bot name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Welcome Message
                      </label>
                      <textarea
                        value={settings.appearance?.welcomeMessage || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, welcomeMessage: e.target.value }
                        })}
                        rows={3}
                        className="input-field"
                        placeholder="Welcome! How can I help you today?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Bot Description
                      </label>
                      <textarea
                        value={settings.appearance?.description || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, description: e.target.value }
                        })}
                        rows={2}
                        className="input-field"
                        placeholder="Brief description of what this bot does"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Theme Colors</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Primary Color
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={settings.appearance?.theme?.primaryColor || '#3B82F6'}
                          onChange={(e) => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              theme: { ...settings.appearance?.theme, primaryColor: e.target.value }
                            }
                          })}
                          className="w-12 h-10 rounded-lg border border-slate-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={settings.appearance?.theme?.primaryColor || '#3B82F6'}
                          onChange={(e) => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              theme: { ...settings.appearance?.theme, primaryColor: e.target.value }
                            }
                          })}
                          className="input-field flex-1"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="color"
                          value={settings.appearance?.theme?.secondaryColor || '#EFF6FF'}
                          onChange={(e) => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              theme: { ...settings.appearance?.theme, secondaryColor: e.target.value }
                            }
                          })}
                          className="w-12 h-10 rounded-lg border border-slate-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={settings.appearance?.theme?.secondaryColor || '#EFF6FF'}
                          onChange={(e) => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              theme: { ...settings.appearance?.theme, secondaryColor: e.target.value }
                            }
                          })}
                          className="input-field flex-1"
                          placeholder="#EFF6FF"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Preset Themes
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {presetThemes.map((theme, index) => (
                        <button
                          key={index}
                          onClick={() => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              theme: {
                                primaryColor: theme.colors.primary,
                                secondaryColor: theme.colors.secondary,
                                backgroundColor: settings.appearance.theme.backgroundColor,
                                textColor: settings.appearance.theme.textColor
                              }
                            }
                          })}
                          className="p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary-300 transition-colors"
                        >
                          <div className="flex space-x-1 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: theme.colors.primary }}
                            ></div>
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: theme.colors.secondary }}
                            ></div>
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: theme.colors.accent }}
                            ></div>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {theme.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Typography Tab */}
            {activeTab === 'typography' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Font Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Font Family
                      </label>
                      <select
                        value={settings.appearance?.typography?.fontFamily || 'system-ui'}
                                              onChange={(e) => setSettings({
                        ...settings,
                        appearance: {
                          ...settings.appearance,
                          typography: { 
                            fontFamily: e.target.value,
                            fontSize: settings.appearance.typography.fontSize,
                            lineHeight: settings.appearance.typography.lineHeight
                          }
                        }
                      })}
                        className="input-field"
                      >
                        <option value="system-ui">System Default</option>
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Lato">Lato</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Nunito">Nunito</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Font Size: {settings.appearance?.typography?.fontSize || 14}px
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="18"
                        value={settings.appearance?.typography?.fontSize || 14}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            typography: { 
                              fontFamily: settings.appearance.typography.fontFamily,
                              fontSize: parseInt(e.target.value),
                              lineHeight: settings.appearance.typography.lineHeight
                            }
                          }
                        })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>12px</span>
                        <span>15px</span>
                        <span>18px</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Line Height: {settings.appearance?.typography?.lineHeight || 1.5}
                      </label>
                      <input
                        type="range"
                        min="1.2"
                        max="2"
                        step="0.1"
                        value={settings.appearance?.typography?.lineHeight || 1.5}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            typography: { 
                              fontFamily: settings.appearance.typography.fontFamily,
                              fontSize: settings.appearance.typography.fontSize,
                              lineHeight: parseFloat(e.target.value)
                            }
                          }
                        })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>1.2</span>
                        <span>1.6</span>
                        <span>2.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add other tabs content here... */}
            {activeTab === 'avatar' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Avatar Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Current Avatar
                      </label>
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-4">
                        {settings.appearance?.avatar ? (
                          <img 
                            src={settings.appearance.avatar} 
                            alt="Bot Avatar" 
                            className="w-full h-full rounded-2xl object-cover" 
                          />
                        ) : (
                          (settings.appearance?.name || bot.name).charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        value={settings.appearance?.avatar || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, avatar: e.target.value }
                        })}
                        className="input-field"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    <div>
                      <button className="btn-secondary w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Avatar Image
                      </button>
                      <p className="text-xs text-slate-500 mt-2">
                        Recommended: 64x64px, PNG or JPG format
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Position Tab */}
            {activeTab === 'position' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Widget Position</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Position Side
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              position: { 
                                side: 'left',
                                offset: settings.appearance.position.offset
                              }
                            }
                          })}
                          className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                            settings.appearance?.position?.side === 'left'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-slate-300 dark:border-slate-600 hover:border-primary-300'
                          }`}
                        >
                          Bottom Left
                        </button>
                        <button
                          onClick={() => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              position: { 
                                side: 'right',
                                offset: settings.appearance.position.offset
                              }
                            }
                          })}
                          className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                            settings.appearance?.position?.side === 'right' || !settings.appearance?.position?.side
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-slate-300 dark:border-slate-600 hover:border-primary-300'
                          }`}
                        >
                          Bottom Right
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Message Style</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.appearance?.messageStyle?.showAvatar !== false}
                          onChange={(e) => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              messageStyle: { 
                                bubbleStyle: settings.appearance.messageStyle.bubbleStyle,
                                showAvatar: e.target.checked,
                                showTimestamp: settings.appearance.messageStyle.showTimestamp
                              }
                            }
                          })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Show bot avatar in messages
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Background Tab */}
            {activeTab === 'background' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Chat Background</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Background Type
                      </label>
                      <select
                        value={settings.appearance?.background?.type || 'none'}
                        onChange={(e) => setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            background: { 
                              type: e.target.value as 'none' | 'color' | 'gradient' | 'image',
                              value: settings.appearance.background.value
                            }
                          }
                        })}
                        className="input-field"
                      >
                        <option value="none">No Background</option>
                        <option value="color">Solid Color</option>
                        <option value="gradient">Gradient</option>
                        <option value="image">Custom Image</option>
                      </select>
                    </div>

                    {settings.appearance?.background?.type === 'color' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={settings.appearance?.background?.value || '#F8FAFC'}
                          onChange={(e) => setSettings({
                            ...settings,
                            appearance: {
                              ...settings.appearance,
                              background: { 
                                type: settings.appearance.background.type,
                                value: e.target.value
                              }
                            }
                          })}
                          className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-600"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Preview Panel */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-6 overflow-auto">
            <div className="h-full flex items-center justify-center">
              <div 
                className={`transition-all duration-300 ${
                  previewMode === 'mobile' ? 'w-80 h-[600px]' :
                  previewMode === 'tablet' ? 'w-96 h-[700px]' :
                  'w-[500px] h-[800px]'
                }`}
              >
                {/* Widget Preview */}
                <div className="relative h-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Widget Header */}
                  <div 
                    className="p-4 text-white"
                    style={{ backgroundColor: settings.appearance?.theme?.primaryColor || '#3B82F6' }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                        {settings.appearance?.avatar ? (
                          <img 
                            src={settings.appearance.avatar} 
                            alt="Bot" 
                            className="w-full h-full rounded-full object-cover" 
                          />
                        ) : (
                          (settings.appearance?.name || bot.name).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">
                          {settings.appearance?.name || bot.name}
                        </h4>
                        <p className="text-xs opacity-80">
                          {settings.appearance?.description || 'AI Assistant'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 p-4 space-y-3" style={{
                    fontFamily: settings.appearance?.typography?.fontFamily || 'system-ui',
                    fontSize: `${settings.appearance?.typography?.fontSize || 14}px`,
                    lineHeight: settings.appearance?.typography?.lineHeight || 1.5
                  }}>
                    {/* Welcome Message */}
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs">
                        🤖
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md p-3 max-w-[80%]">
                        <p className="text-slate-800 dark:text-slate-200">
                          {settings.appearance?.welcomeMessage || 'Hello! How can I help you today?'}
                        </p>
                      </div>
                    </div>

                    {/* Sample User Message */}
                    <div className="flex items-start space-x-2 justify-end">
                      <div 
                        className="rounded-2xl rounded-br-md p-3 max-w-[80%] text-white"
                        style={{ backgroundColor: settings.appearance?.theme?.primaryColor || '#3B82F6' }}
                      >
                        <p>I need help with my order</p>
                      </div>
                    </div>

                    {/* Sample Bot Response */}
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs">
                        🤖
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-md p-3 max-w-[80%]">
                        <p className="text-slate-800 dark:text-slate-200">
                          I'd be happy to help you with your order! Could you please provide your order number?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-2xl focus:outline-none focus:border-primary-500"
                        style={{
                          fontFamily: settings.appearance?.typography?.fontFamily || 'system-ui',
                          fontSize: `${settings.appearance?.typography?.fontSize || 14}px`
                        }}
                      />
                      <button 
                        className="p-3 rounded-2xl text-white"
                        style={{ backgroundColor: settings.appearance?.theme?.primaryColor || '#3B82F6' }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BotSettings
