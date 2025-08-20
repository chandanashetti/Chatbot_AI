import { io, Socket } from 'socket.io-client'
import { store } from '../store/store'
import { addMessage, setTyping, setConnected, setError } from '../store/slices/chatSlice'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(sessionId?: string) {
    if (this.socket?.connected) return

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000'
    
    this.socket = io(wsUrl, {
      auth: {
        sessionId,
      },
      transports: ['websocket', 'polling'],
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      store.dispatch(setConnected(true))
      store.dispatch(setError(null))
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      store.dispatch(setConnected(false))
    })

    this.socket.on('message', (data: any) => {
      const message = {
        id: data.id || Date.now().toString(),
        content: data.content,
        sender: 'bot' as const,
        timestamp: new Date(data.timestamp || Date.now()),
        channel: data.channel,
      }
      store.dispatch(addMessage(message))
    })

    this.socket.on('typing', (data: { isTyping: boolean }) => {
      store.dispatch(setTyping(data.isTyping))
    })

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
      store.dispatch(setError(error.message || 'Connection error'))
    })

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error)
      store.dispatch(setError('Failed to connect to chat server'))
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          this.connect()
        }, 1000 * this.reconnectAttempts)
      }
    })
  }

  sendMessage(message: { content: string; sessionId?: string }) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected')
    }

    this.socket.emit('message', message)
  }

  joinSession(sessionId: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected')
    }

    this.socket.emit('join_session', { sessionId })
  }

  leaveSession(sessionId: string) {
    if (!this.socket?.connected) return

    this.socket.emit('leave_session', { sessionId })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      store.dispatch(setConnected(false))
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const wsService = new WebSocketService()
export default wsService
