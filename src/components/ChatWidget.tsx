import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, ThumbsUp, ThumbsDown, Volume2, VolumeX } from 'lucide-react'
import { chatAPI, reactionsAPI } from '../services/api'
import toast from 'react-hot-toast'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatWidgetProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark' | 'auto'
  initialMessage?: string
  placeholder?: string
  title?: string
}

const ChatWidget: React.FC<ChatWidgetProps> = ({
  className = '',
  position = 'bottom-right',
  theme = 'auto',
  initialMessage = "Hi! How can I help you today?",
  placeholder = "Type your message...",
  title = "AI Assistant"
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: initialMessage,
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `widget-${Date.now()}`)
  const [messageReactions, setMessageReactions] = useState<Record<string, 'like' | 'dislike' | null>>({})
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis)
    }

    return () => {
      // Stop any ongoing speech when component unmounts
      if (speechSynthesis) {
        speechSynthesis.cancel()
      }
    }
  }, [])

  // Handle message reactions
  const handleReaction = async (messageId: string, reaction: 'like' | 'dislike') => {
    try {
      // Toggle reaction if same reaction is clicked, otherwise set new reaction
      const currentReaction = messageReactions[messageId]
      const newReaction = currentReaction === reaction ? null : reaction
      
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: newReaction
      }))

      // Send reaction to backend
      await reactionsAPI.submitReaction(messageId, newReaction, sessionId)
      
      if (newReaction) {
        toast.success(`${newReaction === 'like' ? '👍' : '👎'} Feedback submitted`)
      }
    } catch (error) {
      console.error('Failed to submit reaction:', error)
      toast.error('Failed to submit feedback')
    }
  }

  // Handle text-to-speech
  const handleSpeakMessage = (messageId: string, content: string) => {
    if (!speechSynthesis) {
      toast.error('Text-to-speech not supported in this browser')
      return
    }

    // Stop current speech if any
    if (speakingMessageId) {
      speechSynthesis.cancel()
      setSpeakingMessageId(null)
      if (speakingMessageId === messageId) {
        return // If clicking the same message, just stop
      }
    }

    try {
      const utterance = new SpeechSynthesisUtterance(content)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      // Set a pleasant voice if available
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.lang.includes('en')
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onstart = () => {
        setSpeakingMessageId(messageId)
      }

      utterance.onend = () => {
        setSpeakingMessageId(null)
      }

      utterance.onerror = () => {
        setSpeakingMessageId(null)
        toast.error('Failed to read message aloud')
      }

      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Speech synthesis error:', error)
      toast.error('Failed to read message aloud')
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await chatAPI.sendMessage({
        content: userMessage.content,
        sessionId,
        model: 'openai' // Default to OpenAI for public widget
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.content || response.data.message || 'Sorry, I could not process your request.',
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat widget error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting. Please try again later.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50'
    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4 max-w-[calc(100vw-2rem)]`
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4 max-w-[calc(100vw-2rem)]`
      case 'top-right':
        return `${baseClasses} top-4 right-4 max-w-[calc(100vw-2rem)]`
      case 'top-left':
        return `${baseClasses} top-4 left-4 max-w-[calc(100vw-2rem)]`
      default:
        return `${baseClasses} bottom-4 right-4 max-w-[calc(100vw-2rem)]`
    }
  }

  const getThemeClasses = () => {
    if (theme === 'dark') {
      return 'bg-gray-900 text-white border-gray-700'
    } else if (theme === 'light') {
      return 'bg-white text-gray-900 border-gray-200'
    } else {
      return 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700'
    }
  }

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center group hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`w-[90vw] sm:w-96 md:w-[450px] lg:w-[500px] max-w-[500px] ${getThemeClasses()} rounded-lg shadow-2xl border transition-all duration-300 flex flex-col ${
          isMinimized ? 'h-14' : 'h-[70vh] sm:h-[600px] md:h-[650px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6" />
              <h3 className="font-semibold text-base">{title}</h3>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-blue-700 rounded transition-colors"
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-blue-700 rounded transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 dark:bg-gray-800">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Message Actions for Assistant Messages */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
                          <div className="flex items-center space-x-2">
                            {/* Like/Dislike Buttons */}
                            <button
                              onClick={() => handleReaction(message.id, 'like')}
                              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                                messageReactions[message.id] === 'like'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                  : 'text-gray-400 dark:text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                              }`}
                              title="Like this response"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => handleReaction(message.id, 'dislike')}
                              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                                messageReactions[message.id] === 'dislike'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                  : 'text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                              }`}
                              title="Dislike this response"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                            
                            {/* Read Aloud Button */}
                            <button
                              onClick={() => handleSpeakMessage(message.id, message.content)}
                              className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                                speakingMessageId === message.id
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              }`}
                              title={speakingMessageId === message.id ? 'Stop reading' : 'Read aloud'}
                            >
                              {speakingMessageId === message.id ? (
                                <VolumeX className="w-3.5 h-3.5" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          
                          <p className="text-xs opacity-70 text-gray-500 dark:text-gray-400">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
                      
                      {/* Timestamp for User Messages */}
                      {message.role === 'user' && (
                        <p className="text-xs mt-2 opacity-70 text-blue-100">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg rounded-bl-none p-4 max-w-[85%] shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-lg">
                <div className="flex space-x-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm resize-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[48px] shadow-sm"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatWidget
