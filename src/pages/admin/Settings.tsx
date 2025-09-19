import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { updateSettings, setSaving, BotSettings, OllamaSettings, OpenAISettings } from '../../store/slices/settingsSlice'
import { settingsAPI, openaiAPI } from '../../services/api'
import {
  Save,
  Bot,
  Loader2,
  Server,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  Mail,
  Plus,
  Trash2,
  Eye,
  EyeOff
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

        // Update both local state and Redux (only if different from current)
        const settingsString = JSON.stringify(settings)
        const mergedString = JSON.stringify(backendSettings)

        if (settingsString !== mergedString) {
          setLocalSettings(backendSettings)
          dispatch(updateSettings(backendSettings))
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

  const clearOpenAIKey = async () => {
    try {
      // Clear the API key from local state
      const clearedSettings = {
        ...localSettings,
        openai: {
          ...localSettings.openai,
          apiKey: ''
        }
      }
      
      setLocalSettings(clearedSettings)
      
      // Save the cleared settings to backend
      const response = await settingsAPI.updateSettings(clearedSettings)
      console.log('✅ OpenAI API key cleared successfully:', response)
      
      dispatch(updateSettings(clearedSettings))
      toast.success('OpenAI API key cleared successfully')
      setOpenaiStatus(null) // Reset connection status
    } catch (error) {
      console.error('❌ Error clearing OpenAI API key:', error)
      toast.error('Failed to clear OpenAI API key')
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
                  <div className="flex space-x-2">
                  <input
                    type="password"
                    value={localSettings.openai.apiKey}
                    onChange={(e) => handleOpenAIChange('apiKey', e.target.value)}
                      className="input-field flex-1"
                    placeholder="sk-..."
                  />
                    {localSettings.openai.apiKey && (
                      <button
                        onClick={clearOpenAIKey}
                        className="btn-secondary text-sm px-3 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Clear API Key"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your OpenAI API key (stored securely in database)
                  </p>
                  {!localSettings.openai.apiKey && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠️ No API key configured. OpenAI features will not work.
                    </p>
                  )}
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

      </div>

      {/* Email Service Providers Configuration */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Service Providers
            </h3>
          </div>
          <button className="btn-secondary text-sm px-3 py-2">
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Configure email service providers for bulk email campaigns. You can add multiple providers and choose which one to use for each campaign.
        </p>

        {/* Email Providers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SendGrid Configuration */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">SendGrid</h4>
                  <p className="text-sm text-gray-500">Popular email delivery service</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  Not Configured
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter SendGrid API key"
                    className="input-field pr-10"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Email
                </label>
                <input
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Name
                </label>
                <input
                  type="text"
                  placeholder="Your Company Name"
                  className="input-field"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button className="btn-ghost text-sm px-3 py-2">
                  Test Connection
                </button>
                <button className="btn-primary text-sm px-3 py-2">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Mailgun Configuration */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Mailgun</h4>
                  <p className="text-sm text-gray-500">Developer-friendly email service</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded-full">
                  ✓ Configured
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value="key-************************"
                    className="input-field pr-10"
                    readOnly
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Domain
                </label>
                <input
                  type="text"
                  value="mg.yourdomain.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Email
                </label>
                <input
                  type="email"
                  value="campaigns@yourdomain.com"
                  className="input-field"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button className="text-red-600 hover:text-red-700 text-sm px-3 py-2 flex items-center">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </button>
                <button className="btn-secondary text-sm px-3 py-2">
                  Update Configuration
                </button>
              </div>
            </div>
          </div>

          {/* AWS SES Configuration */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">AWS SES</h4>
                  <p className="text-sm text-gray-500">Amazon Simple Email Service</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  Not Configured
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Access Key ID
                </label>
                <input
                  type="text"
                  placeholder="Your AWS Access Key ID"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secret Access Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Your AWS Secret Access Key"
                    className="input-field pr-10"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Region
                </label>
                <select className="input-field">
                  <option value="">Select Region</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button className="btn-ghost text-sm px-3 py-2">
                  Test Connection
                </button>
                <button className="btn-primary text-sm px-3 py-2">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>

          {/* SMTP Configuration */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">SMTP</h4>
                  <p className="text-sm text-gray-500">Custom SMTP server</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                  Not Configured
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    placeholder="smtp.example.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    placeholder="587"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="your-email@example.com"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Your password"
                      className="input-field pr-10"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Use TLS</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Use SSL</span>
                </label>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button className="btn-ghost text-sm px-3 py-2">
                  Test Connection
                </button>
                <button className="btn-primary text-sm px-3 py-2">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email Configuration Help */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Email Provider Setup Tips</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>SendGrid:</strong> Get API key from SendGrid dashboard → Settings → API Keys</li>
                <li>• <strong>Mailgun:</strong> Find API key and domain in Mailgun dashboard → Domains</li>
                <li>• <strong>AWS SES:</strong> Create IAM user with SES permissions and get access keys</li>
                <li>• <strong>SMTP:</strong> Use your existing email server credentials</li>
              </ul>
            </div>
          </div>
        </div>
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
