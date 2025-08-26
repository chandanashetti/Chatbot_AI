import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { updateSettings, setSaving, BotSettings, OllamaSettings, OpenAISettings, WebScrapingSettings } from '../../store/slices/settingsSlice'
import { settingsAPI, openaiAPI, webScrapingAPI } from '../../services/api'
import { 
  Save, 
  Bot, 
  Palette, 
  MessageSquare,
  Zap,
  Loader2,
  Server,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  Globe,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminSettings = () => {
  const dispatch = useDispatch()
  const { settings, isSaving } = useSelector((state: RootState) => state.settings)
  const [localSettings, setLocalSettings] = useState<BotSettings>(settings)
  const [availableModels] = useState([
    { id: 'openai', name: 'OpenAI', description: 'GPT models from OpenAI' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
    { id: 'claude-3', name: 'Claude-3', description: 'Anthropic\'s latest model' },
    { id: 'bedrock', name: 'AWS Bedrock', description: 'Amazon\'s AI models' },
    { id: 'ollama', name: 'Ollama (Local)', description: 'Run models locally with Ollama' }
  ])
  
  const [ollamaModels] = useState([
    { id: 'llama3.2', name: 'Llama 3.2', description: 'Meta\'s latest model' },
    { id: 'llama3.2:1b', name: 'Llama 3.2 1B', description: 'Lightweight version' },
    { id: 'gemma2', name: 'Gemma 2', description: 'Google\'s Gemma model' },
    { id: 'mistral', name: 'Mistral', description: 'Mistral AI model' },
    { id: 'codellama', name: 'Code Llama', description: 'Specialized for code' },
    { id: 'phi3', name: 'Phi-3', description: 'Microsoft\'s small model' }
  ])
  
  const [openaiModels] = useState([
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest GPT-4 with improved performance' }
  ])

  const [embeddingModels] = useState([
    { id: 'mxbai-embed-large', name: 'MxBai Embed Large', description: 'High-quality embeddings' },
    { id: 'nomic-embed-text', name: 'Nomic Embed Text', description: 'Efficient text embeddings' },
    { id: 'all-minilm', name: 'All MiniLM', description: 'Compact embeddings' }
  ])

  const [openaiEmbeddingModels] = useState([
    { id: 'text-embedding-ada-002', name: 'Ada v2', description: 'Most capable embedding model' },
    { id: 'text-embedding-3-small', name: 'Embedding v3 Small', description: 'Smaller, faster embedding model' },
    { id: 'text-embedding-3-large', name: 'Embedding v3 Large', description: 'Most capable embedding model' }
  ])
  
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'error' | null>(null)
  const [openaiStatus, setOpenaiStatus] = useState<'checking' | 'connected' | 'error' | null>(null)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // Load initial data from backend on component mount
  useEffect(() => {
    let hasLoaded = false
    
    const loadSettingsFromBackend = async () => {
      if (hasLoaded) return // Prevent multiple loads
      hasLoaded = true
      
      try {
        console.log('📡 Loading settings from backend...')
        
        // Load general settings
        const generalResponse = await settingsAPI.getSettings()
        const backendSettings = generalResponse.data || {}
        
        console.log('📊 General settings loaded:', backendSettings)
        
        // Load web scraping settings separately  
        const webScrapingResponse = await webScrapingAPI.getSettings()
        const webScrapingData = webScrapingResponse.data?.webScraping || {}
        
        console.log('🌐 Web scraping settings loaded:', webScrapingData)
        
        // Merge all settings with proper defaults
        const mergedSettings = {
          ...settings, // Use Redux defaults as base
          ...backendSettings, // Override with backend data
          webScraping: {
            ...settings.webScraping, // Use Redux defaults for web scraping
            ...webScrapingData // Override with backend web scraping data
          }
        }
        
        console.log('🔄 Merged settings:', mergedSettings)
        
        // Update both local state and Redux (only if different from current)
        const settingsString = JSON.stringify(settings)
        const mergedString = JSON.stringify(mergedSettings)
        
        if (settingsString !== mergedString) {
          setLocalSettings(mergedSettings)
          dispatch(updateSettings(mergedSettings))
          console.log('✅ Settings synchronized successfully')
        } else {
          console.log('ℹ️ Settings already up to date')
        }
        
      } catch (error) {
        console.error('❌ Failed to load settings from backend:', error)
        toast.error('Failed to load settings from server')
      }
    }

    loadSettingsFromBackend()
  }, []) // Only run on component mount, no dependencies to prevent loops

  const handleSettingChange = (field: keyof BotSettings, value: any) => {
    setLocalSettings((prev: BotSettings) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleThemeChange = (field: keyof BotSettings['theme'], value: string) => {
    setLocalSettings((prev: BotSettings) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [field]: value
      }
    }))
  }

  const handleOllamaChange = (field: keyof OllamaSettings, value: any) => {
    setLocalSettings((prev: BotSettings) => ({
      ...prev,
      ollama: {
        ...prev.ollama,
        [field]: value
      }
    }))
  }

  const handleOpenAIChange = (field: keyof OpenAISettings, value: any) => {
    setLocalSettings((prev: BotSettings) => ({
      ...prev,
      openai: {
        ...prev.openai,
        [field]: value
      }
    }))
  }

  const handleWebScrapingChange = (field: keyof WebScrapingSettings, value: any) => {
    setLocalSettings((prev: BotSettings) => ({
      ...prev,
      webScraping: {
        ...prev.webScraping,
        [field]: value
      }
    }))
  }

  const [urlForm, setUrlForm] = useState({
    url: '',
    name: '',
    description: ''
  })

  const [scrapingStatus, setScrapingStatus] = useState<{ [key: string]: 'idle' | 'scraping' | 'success' | 'error' }>({})

  const handleAddUrl = async () => {
    if (!urlForm.url || !urlForm.name) {
      toast.error('URL and name are required')
      return
    }

    try {
      console.log('🔗 Adding URL to backend...', urlForm)
      
      const response = await webScrapingAPI.addUrl(urlForm.url, urlForm.name, urlForm.description)
      const newUrl = response.data.urlEntry
      
      console.log('✅ URL added to backend:', newUrl)
      
      // Update local settings
      const updatedSettings = {
        ...localSettings,
        webScraping: {
          ...localSettings.webScraping,
          urls: [...localSettings.webScraping.urls, newUrl]
        }
      }
      
      setLocalSettings(updatedSettings)
      dispatch(updateSettings(updatedSettings))
      
      setUrlForm({ url: '', name: '', description: '' })
      toast.success('URL added successfully')
    } catch (error) {
      console.error('❌ Failed to add URL:', error)
      toast.error('Failed to add URL')
    }
  }

  const handleRemoveUrl = async (urlId: string) => {
    try {
      console.log('🗑️ Removing URL from backend...', urlId)
      
      await webScrapingAPI.removeUrl(urlId)
      
      console.log('✅ URL removed from backend')
      
      // Update local settings
      const updatedSettings = {
        ...localSettings,
        webScraping: {
          ...localSettings.webScraping,
          urls: localSettings.webScraping.urls.filter(url => url.id !== urlId)
        }
      }
      
      setLocalSettings(updatedSettings)
      dispatch(updateSettings(updatedSettings))
      
      toast.success('URL removed successfully')
    } catch (error) {
      console.error('❌ Failed to remove URL:', error)
      toast.error('Failed to remove URL')
    }
  }

  const handleScrapeUrl = async (urlId: string) => {
    setScrapingStatus(prev => ({ ...prev, [urlId]: 'scraping' }))
    
    try {
      console.log('🌐 Scraping URL...', urlId)
      
      const response = await webScrapingAPI.scrapeUrl(urlId)
      const result = response.data.result
      
      console.log('📊 Scraping result:', result)
      
      if (result.status === 'success') {
        setScrapingStatus(prev => ({ ...prev, [urlId]: 'success' }))
        
        // Update the URL status in local settings
        const updatedSettings = {
          ...localSettings,
          webScraping: {
            ...localSettings.webScraping,
            urls: localSettings.webScraping.urls.map(url => 
              url.id === urlId 
                ? { ...url, scrapingStatus: 'success' as const, lastScraped: new Date(), contentLength: result.contentLength }
                : url
            )
          }
        }
        
        setLocalSettings(updatedSettings)
        dispatch(updateSettings(updatedSettings))
        
        toast.success('URL scraped successfully')
      } else {
        setScrapingStatus(prev => ({ ...prev, [urlId]: 'error' }))
        toast.error(`Failed to scrape URL: ${result.error}`)
      }
    } catch (error) {
      setScrapingStatus(prev => ({ ...prev, [urlId]: 'error' }))
      console.error('❌ Failed to scrape URL:', error)
      toast.error('Failed to scrape URL')
    }
  }

  const testOllamaConnection = async () => {
    setOllamaStatus('checking')
    try {
      const response = await fetch(`${localSettings.ollama.apiUrl}/api/tags`)
      if (response.ok) {
        setOllamaStatus('connected')
        toast.success('Successfully connected to Ollama!')
      } else {
        setOllamaStatus('error')
        toast.error('Failed to connect to Ollama')
      }
    } catch (error) {
      setOllamaStatus('error')
      toast.error('Could not reach Ollama server')
    }
  }

  const testOpenAIConnection = async () => {
    setOpenaiStatus('checking')
    try {
      await openaiAPI.testConnection()
      setOpenaiStatus('connected')
      toast.success('Successfully connected to OpenAI!')
    } catch (error) {
      setOpenaiStatus('error')
      toast.error('Failed to connect to OpenAI. Check your API key.')
    }
  }

  const handleSave = async () => {
    dispatch(setSaving(true))
    try {
      console.log('💾 Saving settings to backend...', localSettings)
      
      // Save all settings (including web scraping) in one call
      const response = await settingsAPI.updateSettings(localSettings)
      
      console.log('✅ Settings saved successfully:', response.data)
      
      // Update Redux store with the response (which may have updated fields)
      if (response.data?.settings) {
        dispatch(updateSettings(response.data.settings))
        setLocalSettings(response.data.settings)
      } else {
        dispatch(updateSettings(localSettings))
      }
      
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('❌ Save error:', error)
      toast.error('Failed to save settings')
    } finally {
      dispatch(setSaving(false))
    }
  }

  const handleReset = () => {
    setLocalSettings(settings)
    toast.success('Settings reset to current values')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bot Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your chatbot behavior and appearance
        </p>
      </div>

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Model Configuration */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Model Configuration
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Model
              </label>
              <select
                value={localSettings.model}
                onChange={(e) => handleSettingChange('model', e.target.value)}
                className="input-field"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temperature: {localSettings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localSettings.temperature}
                onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservative (0.0)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={localSettings.maxTokens}
                onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                className="input-field"
                min="100"
                max="4000"
              />
            </div>
          </div>
        </div>

        {/* Ollama Configuration */}
        {localSettings.model === 'ollama' && (
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ollama Configuration
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={testOllamaConnection}
                  disabled={ollamaStatus === 'checking'}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  {ollamaStatus === 'checking' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </button>
                
                {ollamaStatus && (
                  <div className="flex items-center space-x-2">
                    {ollamaStatus === 'connected' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                      </>
                    ) : ollamaStatus === 'error' ? (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">Error</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API URL
                  </label>
                  <input
                    type="url"
                    value={localSettings.ollama.apiUrl}
                    onChange={(e) => handleOllamaChange('apiUrl', e.target.value)}
                    className="input-field"
                    placeholder="http://localhost:11434"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chat Model
                  </label>
                  <select
                    value={localSettings.ollama.model}
                    onChange={(e) => handleOllamaChange('model', e.target.value)}
                    className="input-field"
                  >
                    {ollamaModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Embedding Model
                  </label>
                  <select
                    value={localSettings.ollama.embeddingModel}
                    onChange={(e) => handleOllamaChange('embeddingModel', e.target.value)}
                    className="input-field"
                  >
                    {embeddingModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={localSettings.ollama.timeout}
                    onChange={(e) => handleOllamaChange('timeout', parseInt(e.target.value))}
                    className="input-field"
                    min="5000"
                    max="120000"
                    step="5000"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Database className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      RAG (Document Search)
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Enable AI to answer questions from uploaded documents
                    </p>
                  </div>
                  <div className="ml-auto">
                    <input
                      type="checkbox"
                      checked={localSettings.ollama.ragEnabled}
                      onChange={(e) => handleOllamaChange('ragEnabled', e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>

                {localSettings.ollama.ragEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chunk Size
                      </label>
                      <input
                        type="number"
                        value={localSettings.ollama.chunkSize}
                        onChange={(e) => handleOllamaChange('chunkSize', parseInt(e.target.value))}
                        className="input-field"
                        min="200"
                        max="2000"
                        step="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Size of text chunks for document processing
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chunk Overlap
                      </label>
                      <input
                        type="number"
                        value={localSettings.ollama.chunkOverlap}
                        onChange={(e) => handleOllamaChange('chunkOverlap', parseInt(e.target.value))}
                        className="input-field"
                        min="0"
                        max="500"
                        step="50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Overlap between consecutive chunks
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Top K Results
                      </label>
                      <input
                        type="number"
                        value={localSettings.ollama.topK}
                        onChange={(e) => handleOllamaChange('topK', parseInt(e.target.value))}
                        className="input-field"
                        min="1"
                        max="20"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Number of similar documents to retrieve
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!localSettings.ollama.ragEnabled && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>RAG is disabled.</strong> The AI will not be able to answer questions about uploaded documents.
                    Enable RAG to use document-based question answering.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OpenAI Configuration */}
        {(localSettings.model === 'openai' || localSettings.model === 'gpt-3.5-turbo' || localSettings.model === 'gpt-4') && (
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  OpenAI Configuration
                </h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={testOpenAIConnection}
                  disabled={openaiStatus === 'checking'}
                  className="btn-secondary text-sm px-3 py-2"
                >
                  {openaiStatus === 'checking' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </button>
                
                {openaiStatus && (
                  <div className="flex items-center space-x-2">
                    {openaiStatus === 'connected' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                      </>
                    ) : openaiStatus === 'error' ? (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">Error</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={localSettings.openai.apiKey}
                    onChange={(e) => handleOpenAIChange('apiKey', e.target.value)}
                    className="input-field"
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your OpenAI API key (stored securely)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chat Model
                  </label>
                  <select
                    value={localSettings.openai.model}
                    onChange={(e) => handleOpenAIChange('model', e.target.value)}
                    className="input-field"
                  >
                    {openaiModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Embedding Model
                  </label>
                  <select
                    value={localSettings.openai.embeddingModel}
                    onChange={(e) => handleOpenAIChange('embeddingModel', e.target.value)}
                    className="input-field"
                  >
                    {openaiEmbeddingModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={localSettings.openai.ragEnabled}
                      onChange={(e) => handleOpenAIChange('ragEnabled', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable RAG (Document Search)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Allow the AI to search and reference uploaded documents
                  </p>
                </div>

                {localSettings.openai.ragEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Temperature
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={localSettings.openai.temperature}
                        onChange={(e) => handleOpenAIChange('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Focused (0)</span>
                        <span className="font-medium">{localSettings.openai.temperature}</span>
                        <span>Creative (2)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        value={localSettings.openai.maxTokens}
                        onChange={(e) => handleOpenAIChange('maxTokens', parseInt(e.target.value))}
                        className="input-field"
                        min="100"
                        max="4000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum length of the AI response
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Top-K Results
                      </label>
                      <input
                        type="number"
                        value={localSettings.openai.topK}
                        onChange={(e) => handleOpenAIChange('topK', parseInt(e.target.value))}
                        className="input-field"
                        min="1"
                        max="20"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Number of similar documents to retrieve
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!localSettings.openai.ragEnabled && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>RAG is disabled.</strong> The AI will not be able to answer questions about uploaded documents.
                    Enable RAG to use document-based question answering.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Configuration */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Message Configuration
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Greeting Message
              </label>
              <textarea
                value={localSettings.greetingMessage}
                onChange={(e) => handleSettingChange('greetingMessage', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Enter the greeting message shown to users..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fallback Message
              </label>
              <textarea
                value={localSettings.fallbackMessage}
                onChange={(e) => handleSettingChange('fallbackMessage', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Enter the message shown when the bot cannot respond..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prompt Template
              </label>
              <textarea
                value={localSettings.promptTemplate}
                onChange={(e) => handleSettingChange('promptTemplate', e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Enter the system prompt template..."
              />
            </div>

            {((localSettings.model === 'ollama' && localSettings.ollama.ragEnabled) || 
              ((localSettings.model === 'openai' || localSettings.model === 'gpt-3.5-turbo' || localSettings.model === 'gpt-4') && localSettings.openai.ragEnabled)) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RAG Prompt Template
                </label>
                <textarea
                  value={localSettings.ragPromptTemplate}
                  onChange={(e) => handleSettingChange('ragPromptTemplate', e.target.value)}
                  className="input-field"
                  rows={6}
                  placeholder="Enter the RAG prompt template with {documents} and {question} placeholders..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use <code>{`{documents}`}</code> and <code>{`{question}`}</code> as placeholders for retrieved documents and user question.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Theme Configuration */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Theme Configuration
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={localSettings.theme.primaryColor}
                  onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={localSettings.theme.primaryColor}
                  onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                  className="input-field flex-1"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={localSettings.theme.secondaryColor}
                  onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={localSettings.theme.secondaryColor}
                  onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                  className="input-field flex-1"
                  placeholder="#64748b"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={localSettings.theme.backgroundColor}
                  onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={localSettings.theme.backgroundColor}
                  onChange={(e) => handleThemeChange('backgroundColor', e.target.value)}
                  className="input-field flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Preview
            </h3>
          </div>

          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: localSettings.theme.backgroundColor,
              borderColor: localSettings.theme.secondaryColor 
            }}
          >
            <div className="space-y-3">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: localSettings.theme.primaryColor }}
              >
                <p className="text-white text-sm">
                  {localSettings.greetingMessage}
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <p className="text-gray-900 dark:text-gray-100 text-sm">
                  User: How can I help you today?
                </p>
              </div>
              
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: localSettings.theme.primaryColor }}
              >
                <p className="text-white text-sm">
                  I'm here to help! What would you like to know?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Web Scraping Configuration */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Web Scraping Configuration
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="webScrapingEnabled"
              checked={localSettings.webScraping.enabled}
              onChange={(e) => handleWebScrapingChange('enabled', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="webScrapingEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Web Scraping
            </label>
          </div>
        </div>

        {localSettings.webScraping.enabled && (
          <div className="space-y-6">
            {/* Add New URL */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Add New URL</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={urlForm.url}
                    onChange={(e) => setUrlForm(prev => ({ ...prev, url: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Display name"
                    value={urlForm.name}
                    onChange={(e) => setUrlForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={urlForm.description}
                    onChange={(e) => setUrlForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <button
                    onClick={handleAddUrl}
                    className="btn-primary w-full text-sm flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add URL</span>
                  </button>
                </div>
              </div>
            </div>

            {/* URL List */}
            {localSettings.webScraping.urls.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Configured URLs</h4>
                <div className="space-y-2">
                  {localSettings.webScraping.urls.map((urlItem) => (
                    <div key={urlItem.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {urlItem.name}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            urlItem.scrapingStatus === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            urlItem.scrapingStatus === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            urlItem.scrapingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {urlItem.scrapingStatus}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {urlItem.url}
                          </p>
                          {urlItem.lastScraped && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last scraped: {new Date(urlItem.lastScraped).toLocaleDateString()}
                            </p>
                          )}
                          {urlItem.contentLength > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(urlItem.contentLength / 1000).toFixed(1)}K chars
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <a
                          href={urlItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleScrapeUrl(urlItem.id)}
                          disabled={scrapingStatus[urlItem.id] === 'scraping'}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                        >
                          {scrapingStatus[urlItem.id] === 'scraping' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveUrl(urlItem.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Web Scraping Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cache Timeout (hours)
                </label>
                <input
                  type="number"
                  value={localSettings.webScraping.cacheTimeout / 3600000}
                  onChange={(e) => handleWebScrapingChange('cacheTimeout', parseInt(e.target.value) * 3600000)}
                  min="1"
                  max="168"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={localSettings.webScraping.requestTimeout / 1000}
                  onChange={(e) => handleWebScrapingChange('requestTimeout', parseInt(e.target.value) * 1000)}
                  min="5"
                  max="60"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max URLs
                </label>
                <input
                  type="number"
                  value={localSettings.webScraping.maxUrls}
                  onChange={(e) => handleWebScrapingChange('maxUrls', parseInt(e.target.value))}
                  min="1"
                  max="50"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Content Length (KB)
                </label>
                <input
                  type="number"
                  value={localSettings.webScraping.maxContentLength / 1000}
                  onChange={(e) => handleWebScrapingChange('maxContentLength', parseInt(e.target.value) * 1000)}
                  min="50"
                  max="1000"
                  className="input-field"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Smart extraction will prioritize key content for large pages
                </p>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Globe className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Web Scraping Information
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      When enabled, the AI can access and search content from the configured URLs. 
                      Content is cached for the specified timeout period to avoid repeated requests. 
                      The AI will search both uploaded documents and web content when answering questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="btn-secondary"
        >
          Reset to Defaults
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Settings Help
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Temperature</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Controls randomness in responses. Lower values (0.0-0.3) make responses more focused and deterministic. 
              Higher values (0.7-1.0) make responses more creative and varied.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Max Tokens</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Maximum number of tokens in the response. Higher values allow longer responses but may increase costs. 
              Recommended range: 100-2000 tokens.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
