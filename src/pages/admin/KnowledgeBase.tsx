import { useState, useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { addDocument, updateDocument, removeDocument, setUploadProgress, setDocuments } from '../../store/slices/knowledgeBaseSlice'
import { 
  addVectorDocument, 
  removeVectorDocument,
  startEmbedding,
  completeEmbedding,
  failEmbedding,
  setSearchResults,
  setSearchQuery,
  clearSearchResults
} from '../../store/slices/vectorStoreSlice'
import { knowledgeBaseAPI, ragAPI, webScrapingAPI } from '../../services/api'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Search,
  Database,
  Zap,
  Brain,
  Settings,
  Globe,
  Link,
  Trash,
  Play,
  Plus
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const KnowledgeBase = () => {
  const dispatch = useDispatch()
  const { documents } = useSelector((state: RootState) => state.knowledgeBase)
  const { 
    documents: vectorDocuments, 
    searchResults, 
    searchQuery, 
    isSearching,
    stats 
  } = useSelector((state: RootState) => state.vectorStore)
  const { settings } = useSelector((state: RootState) => state.settings)
  
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'documents' | 'search' | 'embeddings' | 'webscraping'>('documents')
  const [searchInput, setSearchInput] = useState('')

  // Web scraping state
  const [urlForm, setUrlForm] = useState({ url: '', name: '', description: '' })
  const [scrapingStatus, setScrapingStatus] = useState<Record<string, 'idle' | 'scraping' | 'success' | 'error'>>({})
  const [webScrapingData, setWebScrapingData] = useState<any>({
    enabled: false,
    urls: [],
    cacheTimeout: 86400000,
    requestTimeout: 30000,
    maxUrls: 10,
    maxContentLength: 100000
  })

  // Load existing documents and web scraping data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load documents
        const documentsResponse = await knowledgeBaseAPI.getDocuments()
        const docs = documentsResponse.data.documents || []

        // Transform backend documents to frontend format
        const transformedDocs = docs.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          uploadedAt: new Date(doc.uploadedAt),
          status: doc.status || 'indexed',
          indexedAt: doc.indexedAt ? new Date(doc.indexedAt) : undefined
        }))

        // Set all documents at once (more efficient)
        dispatch(setDocuments(transformedDocs))

        // Load web scraping data
        try {
          const webScrapingResponse = await webScrapingAPI.getSettings()
          const webScrapingSettings = webScrapingResponse.data?.data?.webScraping || {}

          console.log('🌐 Loaded web scraping data:', webScrapingSettings)

          setWebScrapingData({
            enabled: webScrapingSettings.enabled || false,
            urls: webScrapingSettings.urls || [],
            cacheTimeout: webScrapingSettings.cacheTimeout || 86400000,
            requestTimeout: webScrapingSettings.requestTimeout || 30000,
            maxUrls: webScrapingSettings.maxUrls || 10,
            maxContentLength: webScrapingSettings.maxContentLength || 100000
          })
        } catch (webError) {
          console.error('Failed to load web scraping data:', webError)
          // Don't show error toast for web scraping data, just use defaults
        }

      } catch (error) {
        console.error('Failed to load documents:', error)
        toast.error('Failed to load existing documents')
      }
    }

    loadData()
  }, [dispatch])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    
    for (const file of acceptedFiles) {
      try {
        // Create temporary document entry
        const tempDoc = {
          id: `temp-${Date.now()}`,
          name: file.name,
          type: file.name.split('.').pop()?.toLowerCase() as any,
          size: file.size,
          uploadedAt: new Date(),
          status: 'uploading' as const,
          progress: 0
        }
        
        dispatch(addDocument(tempDoc))
        
        // Upload with progress tracking
        await knowledgeBaseAPI.uploadDocument(file, (progress) => {
          dispatch(setUploadProgress({ id: tempDoc.id, progress }))
        })
        
        // Update document status to processing
        dispatch(updateDocument({
          id: tempDoc.id,
          status: 'processing',
          progress: 100
        }))
        
        // Process document for RAG if Ollama is enabled
        if (settings.model === 'ollama' && settings.ollama.ragEnabled) {
          try {
            // Process document into chunks
            const processedDoc = await ragAPI.processDocument(file, {
              chunkSize: settings.ollama.chunkSize,
              chunkOverlap: settings.ollama.chunkOverlap
            })
            
            // Add to vector store
            const vectorDoc = {
              id: tempDoc.id,
              name: file.name,
              type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
              chunks: processedDoc.data.chunks || [],
              totalChunks: processedDoc.data.totalChunks || 0,
              embeddingStatus: 'pending' as const,
              embeddingProgress: 0
            }
            
            dispatch(addVectorDocument(vectorDoc))
            
            // Start embedding process
            dispatch(startEmbedding(tempDoc.id))
            await ragAPI.embedDocument(tempDoc.id, {
              model: settings.ollama.embeddingModel,
              batchSize: 10
            })
            
            dispatch(completeEmbedding(tempDoc.id))
            dispatch(updateDocument({
              id: tempDoc.id,
              status: 'indexed'
            }))
            
            toast.success(`${file.name} processed and indexed successfully`)
          } catch (ragError) {
            console.error('RAG processing failed:', ragError)
            dispatch(failEmbedding({ documentId: tempDoc.id, error: 'Embedding failed' }))
            dispatch(updateDocument({
              id: tempDoc.id,
              status: 'error',
              error: 'RAG processing failed'
            }))
            toast.error(`RAG processing failed for ${file.name}`)
          }
        } else {
          dispatch(updateDocument({
            id: tempDoc.id,
            status: 'indexed'
          }))
          toast.success(`${file.name} uploaded successfully`)
        }
        
      } catch (error) {
        dispatch(updateDocument({
          id: `temp-${Date.now()}`,
          status: 'error',
          error: 'Upload failed'
        }))
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    
    setUploading(false)
  }, [dispatch, settings])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await knowledgeBaseAPI.deleteDocument(documentId)
      dispatch(removeDocument(documentId))
      
      // Also remove from vector store if it exists
      const vectorDoc = vectorDocuments.find(doc => doc.id === documentId)
      if (vectorDoc) {
        await ragAPI.deleteDocumentEmbeddings(documentId)
        dispatch(removeVectorDocument(documentId))
      }
      
      toast.success('Document deleted successfully')
    } catch (error) {
      toast.error('Failed to delete document')
    }
  }

  const handleReindexDocument = async (documentId: string) => {
    try {
      dispatch(updateDocument({ id: documentId, status: 'processing' }))
      await knowledgeBaseAPI.reindexDocument(documentId)
      
      // Also re-embed if RAG is enabled
      if (settings.model === 'ollama' && settings.ollama.ragEnabled) {
        dispatch(startEmbedding(documentId))
        await ragAPI.reembedDocument(documentId, settings.ollama.embeddingModel)
        dispatch(completeEmbedding(documentId))
      }
      
      dispatch(updateDocument({ id: documentId, status: 'indexed' }))
      toast.success('Document reindexed successfully')
    } catch (error) {
      dispatch(updateDocument({ id: documentId, status: 'error', error: 'Reindex failed' }))
      toast.error('Failed to reindex document')
    }
  }

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      dispatch(clearSearchResults())
      return
    }
    
    try {
      const response = await ragAPI.searchSimilar(searchInput, {
        topK: settings.ollama.topK,
        minScore: 0.7
      })
      
      dispatch(setSearchResults(response.data))
      dispatch(setSearchQuery(searchInput))
    } catch (error) {
      toast.error('Search failed')
    }
  }

  const handleReembedDocument = async (documentId: string) => {
    if (!settings.ollama.ragEnabled) {
      toast.error('RAG is not enabled')
      return
    }
    
    try {
      dispatch(startEmbedding(documentId))
      await ragAPI.reembedDocument(documentId, settings.ollama.embeddingModel)
      dispatch(completeEmbedding(documentId))
      toast.success('Document re-embedded successfully')
    } catch (error) {
      dispatch(failEmbedding({ documentId, error: 'Re-embedding failed' }))
      toast.error('Failed to re-embed document')
    }
  }

  // Load vector store stats on component mount
  useEffect(() => {
    if (settings.model === 'ollama' && settings.ollama.ragEnabled) {
      ragAPI.getVectorStoreStats().then(() => {
        // Update stats in the store if needed
      }).catch(console.error)
    }
  }, [settings])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'uploading':
        return <Upload className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'indexed':
        return 'text-green-600 dark:text-green-400'
      case 'processing':
        return 'text-blue-600 dark:text-blue-400'
      case 'uploading':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  // Web scraping functions
  const handleAddUrl = async () => {
    if (!urlForm.url.trim() || !urlForm.name.trim()) {
      toast.error('Please fill in URL and name')
      return
    }

    try {
      console.log('🔗 Adding URL to backend...', urlForm)

      const response = await webScrapingAPI.addUrl(urlForm.url, urlForm.name, urlForm.description)
      const newUrl = response.data.urlEntry

      console.log('✅ URL added to backend:', newUrl)

      // Update local state
      setWebScrapingData(prev => ({
        ...prev,
        urls: [...prev.urls, newUrl]
      }))

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

      // Update local state
      setWebScrapingData(prev => ({
        ...prev,
        urls: prev.urls.filter(url => url.id !== urlId)
      }))

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
      const result = response.data?.data || response.data

      if (result?.success !== false) {
        setScrapingStatus(prev => ({ ...prev, [urlId]: 'success' }))
        toast.success('URL scraped successfully')
      } else {
        setScrapingStatus(prev => ({ ...prev, [urlId]: 'error' }))
        toast.error(result?.message || 'Scraping failed')
      }
    } catch (error) {
      console.error('❌ Scraping failed:', error)
      setScrapingStatus(prev => ({ ...prev, [urlId]: 'error' }))
      toast.error('Failed to scrape URL')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Knowledge Base
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload and manage documents for your chatbot's knowledge base
          </p>
        </div>
        
        {/* RAG Status */}
        {settings.model === 'ollama' && (
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            settings.ollama.ragEnabled 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <Brain className={`w-5 h-5 ${
              settings.ollama.ragEnabled ? 'text-green-600' : 'text-yellow-600'
            }`} />
            <div>
              <span className={`text-sm font-medium ${
                settings.ollama.ragEnabled ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'
              }`}>
                RAG {settings.ollama.ragEnabled ? 'Enabled' : 'Disabled'}
              </span>
              {settings.ollama.ragEnabled && (
                <p className="text-xs text-green-700 dark:text-green-300">
                  {stats.embeddedChunks}/{stats.totalChunks} chunks indexed
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'search', label: 'Search', icon: Search, disabled: !settings.ollama?.ragEnabled },
            { id: 'embeddings', label: 'Embeddings', icon: Database, disabled: !settings.ollama?.ragEnabled },
            { id: 'webscraping', label: 'Web Scraping', icon: Globe }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
              disabled={tab.disabled}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : tab.disabled
                  ? 'border-transparent text-gray-400 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <>
          {/* Upload Area */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload Documents
            </h3>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : uploading
              ? 'border-gray-200 bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            or click to select files
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Supported formats: PDF, DOCX, DOC, TXT, CSV (Max 10MB per file)
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Documents ({documents.length})
        </h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No documents uploaded yet. Upload your first document to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {doc.name}
                      </h4>
                      {getStatusIcon(doc.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span className={getStatusColor(doc.status)}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      <span>•</span>
                      <span>{format(doc.uploadedAt, 'MMM dd, yyyy')}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    {doc.status === 'uploading' && doc.progress !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${doc.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{doc.progress}% uploaded</p>
                      </div>
                    )}
                    
                    {/* Error Message */}
                    {doc.status === 'error' && doc.error && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {doc.error}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {doc.status === 'indexed' && (
                    <button
                      onClick={() => handleReindexDocument(doc.id)}
                      className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                      title="Reindex Document"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

          {/* Help Section */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Knowledge Base Help
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Supported Formats</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• PDF documents</li>
                  <li>• Word documents (.docx, .doc)</li>
                  <li>• Text files (.txt)</li>
                  <li>• CSV files</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Processing Status</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <span className="text-yellow-600">Uploading</span> - File being uploaded</li>
                  <li>• <span className="text-blue-600">Processing</span> - Document being indexed</li>
                  <li>• <span className="text-green-600">Indexed</span> - Ready for use</li>
                  <li>• <span className="text-red-600">Error</span> - Processing failed</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Document Search
            </h3>
            
            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search through your documents..."
                  className="input-field"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchInput.trim()}
                className="btn-primary px-6 flex items-center space-x-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-primary-600" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {result.document.name}
                        </span>
                        <span className="text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2 py-1 rounded-full">
                          Score: {(result.score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
                      {result.chunk.content.substring(0, 300)}
                      {result.chunk.content.length > 300 && '...'}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Chunk {result.chunk.metadata.chunkIndex + 1}
                        {result.chunk.metadata.page && ` • Page ${result.chunk.metadata.page}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No results found for "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Enter a search query to find relevant content in your documents
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Embeddings Tab */}
      {activeTab === 'embeddings' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalDocuments}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Documents
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalChunks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Chunks
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.embeddedChunks}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Embedded
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Settings className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {((stats.storageSize || 0) / 1024 / 1024).toFixed(1)}MB
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Storage
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Document Embeddings
            </h3>
            
            {vectorDocuments.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No documents with embeddings found
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {vectorDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {doc.name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{doc.totalChunks} chunks</span>
                          <span>•</span>
                          <span className={getStatusColor(doc.embeddingStatus)}>
                            {doc.embeddingStatus.charAt(0).toUpperCase() + doc.embeddingStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {doc.embeddingStatus === 'completed' && (
                        <button
                          onClick={() => handleReembedDocument(doc.id)}
                          className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                          title="Re-embed Document"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Web Scraping Tab */}
      {activeTab === 'webscraping' && (
        <>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                <Globe className="w-5 h-5 inline mr-2" />
                Web Scraping Configuration
              </h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="webScrapingEnabled"
                  checked={webScrapingData.enabled}
                  onChange={(e) => {
                    setWebScrapingData(prev => ({
                      ...prev,
                      enabled: e.target.checked
                    }))
                    console.log('Web scraping enabled:', e.target.checked)
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="webScrapingEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Web Scraping
                </label>
              </div>
            </div>

            {/* Add New URL */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 mb-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Add New URL</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <input
                    type="url"
                    placeholder="Website URL"
                    value={urlForm.url}
                    onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={urlForm.name}
                    onChange={(e) => setUrlForm({ ...urlForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={urlForm.description}
                    onChange={(e) => setUrlForm({ ...urlForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <button
                    onClick={handleAddUrl}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add URL</span>
                  </button>
                </div>
              </div>
            </div>

            {/* URL List */}
            {webScrapingData.urls && webScrapingData.urls.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Configured URLs</h4>
                <div className="space-y-2">
                  {webScrapingData.urls.map((urlItem: any) => (
                    <div key={urlItem.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Link className="w-4 h-4 text-primary-600" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {urlItem.name}
                          </p>
                          {urlItem.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              - {urlItem.description}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {urlItem.url}
                        </p>
                        {urlItem.lastScraped && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Last scraped: {new Date(urlItem.lastScraped).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleScrapeUrl(urlItem.id)}
                          disabled={scrapingStatus[urlItem.id] === 'scraping'}
                          className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50 transition-colors"
                          title="Scrape URL"
                        >
                          {scrapingStatus[urlItem.id] === 'scraping' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveUrl(urlItem.id)}
                          className="p-2 text-red-600 hover:text-red-700 transition-colors"
                          title="Remove URL"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration Settings */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cache Timeout (hours)
                </label>
                <input
                  type="number"
                  value={webScrapingData.cacheTimeout / 3600000}
                  readOnly
                  min="1"
                  max="168"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={webScrapingData.requestTimeout / 1000}
                  readOnly
                  min="5"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max URLs
                </label>
                <input
                  type="number"
                  value={webScrapingData.maxUrls}
                  readOnly
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Content Length (KB)
                </label>
                <input
                  type="number"
                  value={webScrapingData.maxContentLength / 1000}
                  readOnly
                  min="50"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 dark:text-gray-300"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Web scraping allows your chatbot to use fresh content from websites as part of its knowledge base.
                Scraped content is automatically included in AI responses when relevant to user queries.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default KnowledgeBase
