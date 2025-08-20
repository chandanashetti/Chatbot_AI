import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { addMessage, clearChat } from '../store/slices/chatSlice'
import { chatAPI, ragAPI } from '../services/api'
import wsService from '../services/websocket'
import { Send, Paperclip, X, Bot, User, Loader2, Sparkles, MessageCircle, Zap, ArrowLeft, Database, Brain } from 'lucide-react'
import { useTheme } from '../components/providers/ThemeProvider'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const ChatInterface = () => {
  const dispatch = useDispatch()
  const { messages, isTyping, isConnected, error } = useSelector((state: RootState) => state.chat)
  const { settings } = useSelector((state: RootState) => state.settings)
  const { isDark, toggleTheme } = useTheme()
  
  const [inputMessage, setInputMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [useRAG, setUseRAG] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Connect to WebSocket
    wsService.connect()
    
    // Show greeting message only once
    if (messages.length === 0 && !isInitialized) {
      setTimeout(() => {
      const greetingMessage = {
        id: 'greeting',
        content: settings.greetingMessage,
        sender: 'bot' as const,
        timestamp: new Date(),
      }
      dispatch(addMessage(greetingMessage))
        setIsInitialized(true)
      }, 1000)
    }

    return () => {
      wsService.disconnect()
    }
  }, [dispatch, settings.greetingMessage, messages.length, isInitialized])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return

    setIsSending(true)
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user' as const,
      timestamp: new Date(),
    }

    dispatch(addMessage(userMessage))
    
    // Clear input
    const messageToSend = inputMessage
    setInputMessage('')
    setAttachments([])
    
    try {
      let response
      let ragResults = []
      
      // Use RAG if Ollama is enabled and RAG is enabled
      if (settings.model === 'ollama' && settings.ollama.ragEnabled && useRAG) {
        try {
          // Search for relevant documents first
          setIsSearching(true)
          const searchResponse = await ragAPI.searchSimilar(messageToSend, {
            topK: settings.ollama.topK,
            minScore: 0.7
          })
          ragResults = searchResponse.data || []
          setIsSearching(false)
          
          // Send to RAG chat endpoint
          response = await ragAPI.chatWithDocuments(messageToSend, {
            useRAG: true,
            topK: settings.ollama.topK,
            model: settings.ollama.model,
            temperature: settings.ollama.temperature,
            maxTokens: settings.ollama.maxTokens
          })
        } catch (ragError) {
          console.error('RAG failed, falling back to regular chat:', ragError)
          setIsSearching(false)
          // Fallback to regular chat
          response = await chatAPI.sendMessage({
            content: messageToSend,
            attachments
          })
        }
      } else {
        // Regular chat API
        response = await chatAPI.sendMessage({
          content: messageToSend,
          attachments
        })
      }
      
      // Add bot response
        const botMessage = {
        id: response.data.id || (Date.now() + 1).toString(),
        content: response.data.content || response.data.response,
          sender: 'bot' as const,
        timestamp: new Date(response.data.timestamp || Date.now()),
        metadata: ragResults.length > 0 ? {
          ragUsed: true,
          searchResults: ragResults,
          model: settings.ollama.model
        } : undefined
      }
      
      dispatch(addMessage(botMessage))
      
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsSearching(false)
      
      // Add error message or fallback
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: settings.fallbackMessage || "I'm having trouble processing your request right now. Please try again.",
        sender: 'bot' as const,
        timestamp: new Date(),
      }
      
      dispatch(addMessage(errorMessage))
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...files])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleClearChat = () => {
    dispatch(clearChat())
    setIsInitialized(false)
  }

  const quickReplies = [
    "How can I get started?",
    "What are your pricing plans?", 
    "Tell me about your features",
    "I need technical support"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary-400/10 to-accent-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-accent-400/10 to-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link to="/" className="btn-ghost p-2">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl blur-lg opacity-50 animate-glow"></div>
                  <div className="relative bg-gradient-to-r from-primary-600 to-accent-600 p-2 rounded-2xl">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              <div>
                  <h1 className="text-xl font-bold text-gradient">AI Assistant</h1>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={`status-${isConnected ? 'online' : 'offline'}`}></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      {isConnected ? 'Online' : 'Connecting...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* RAG Toggle */}
              {settings.model === 'ollama' && settings.ollama.ragEnabled && (
            <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUseRAG(!useRAG)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-2xl text-sm font-medium transition-all ${
                      useRAG 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    }`}
                    title={useRAG ? 'RAG enabled - AI will search documents' : 'RAG disabled - Regular chat mode'}
                  >
                    {useRAG ? (
                      <>
                        <Brain className="w-4 h-4" />
                        <span>RAG On</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>RAG Off</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <button
                onClick={toggleTheme}
                className="btn-ghost p-3 rounded-2xl"
                aria-label="Toggle theme"
              >
                {isDark ? '🌞' : '🌙'}
              </button>
              
              <button
                onClick={handleClearChat}
                className="btn-secondary text-sm px-4 py-2"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
        
        {/* Welcome Message */}
        {messages.length <= 1 && (
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200/50 dark:border-primary-800/50 mb-6">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                AI-Powered Assistant
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              <span className="text-gradient">How can I help you today?</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Ask me anything about our platform, features, or get support
            </p>
            
            {/* Quick Reply Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(reply)}
                  className="card p-4 text-left hover-lift transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-primary-600 group-hover:text-accent-600 transition-colors" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {reply}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-6 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div className={`flex items-start space-x-3 max-w-2xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700' 
                    : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`chat-bubble ${message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {/* RAG Metadata for bot messages */}
                  {message.sender === 'bot' && message.metadata?.ragUsed && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <div className="flex items-center space-x-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          Response based on documents
                        </span>
                        {message.metadata.model && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            • {message.metadata.model}
                          </span>
                        )}
                      </div>
                      
                      {message.metadata.searchResults && message.metadata.searchResults.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Sources ({message.metadata.searchResults.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {message.metadata.searchResults.slice(0, 3).map((result: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              >
                                {result.document?.name || `Document ${idx + 1}`}
                              </span>
                            ))}
                            {message.metadata.searchResults.length > 3 && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                +{message.metadata.searchResults.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-2 opacity-70 ${message.sender === 'user' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {format(message.timestamp, 'HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
                    {/* Search Indicator */}
          {isSearching && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start space-x-3 max-w-2xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                  <Database className="w-5 h-5 text-blue-600 animate-pulse" />
                </div>
                <div className="chat-bubble chat-bubble-bot">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">Searching documents...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start space-x-3 max-w-2xl">
                <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
                <div className="chat-bubble chat-bubble-bot">
                  <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">AI is typing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="relative">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="card p-4 mb-4 animate-slide-up">
              <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-32">
                      {file.name}
                    </span>
                  <button
                    onClick={() => removeAttachment(index)}
                      className="text-slate-500 hover:text-red-500 transition-colors"
                  >
                      <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              </div>
            </div>
          )}
          
          {/* Input Form */}
          <div className="card p-4">
            <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  className="w-full resize-none bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 max-h-32"
                rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '24px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = `${target.scrollHeight}px`
                  }}
              />
            </div>
            
            <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                
              <button
                onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost p-3 rounded-2xl"
                  aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && attachments.length === 0) || isSending}
                  className="btn-primary p-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed group"
                  aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                )}
              </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-up">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface