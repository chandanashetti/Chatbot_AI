import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  User,
  Bot,
  Globe,
  MessageSquare,
  Star,
  Flag
} from 'lucide-react';
import { handoffAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'bot';
  timestamp: Date;
  confidence?: number;
  isInternal?: boolean;
}

interface HandoffRequest {
  _id: string;
  conversationId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  platform: string;
  reason: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'accepted' | 'declined' | 'completed';
  aiConfidence: number;
  assignedAgent?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  notes: Array<{
    author: string;
    content: string;
    timestamp: Date;
    isInternal: boolean;
  }>;
}

const AgentChat = () => {
  const { handoffId } = useParams<{ handoffId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // State management
  const [handoff, setHandoff] = useState<HandoffRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Mock agent info (in real app, this would come from auth)
  const currentAgent = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Sarah Johnson',
    email: 'sarah@company.com'
  };

  useEffect(() => {
    if (handoffId) {
      loadHandoffData();
    }
  }, [handoffId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHandoffData = async () => {
    if (!handoffId) return;
    
    setIsLoading(true);
    try {
      console.log(`📋 Loading handoff ${handoffId}...`);
      const response = await handoffAPI.getHandoff(handoffId);
      const handoffData = response.data.data;
      
      setHandoff(handoffData);
      
      // Load conversation messages (mock for now)
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hello, I need help with my billing account.',
          sender: 'user',
          timestamp: new Date(Date.now() - 900000) // 15 minutes ago
        },
        {
          id: '2',
          content: 'I can help you with billing inquiries. Can you provide your account number?',
          sender: 'bot',
          timestamp: new Date(Date.now() - 880000),
          confidence: 0.9
        },
        {
          id: '3',
          content: 'My account number is 12345, but I\'m having trouble understanding the charges.',
          sender: 'user',
          timestamp: new Date(Date.now() - 860000)
        },
        {
          id: '4',
          content: 'I understand this is a complex billing question. Let me connect you with a specialist who can provide detailed assistance.',
          sender: 'bot',
          timestamp: new Date(Date.now() - 840000),
          confidence: 0.3
        },
        {
          id: '5',
          content: 'Hi! I\'m Sarah from customer service. I can help you understand your billing charges. Let me review your account.',
          sender: 'agent',
          timestamp: new Date(Date.now() - 300000) // 5 minutes ago
        }
      ];
      
      setMessages(mockMessages);
      console.log('✅ Loaded handoff data and messages');
    } catch (error: any) {
      console.error('❌ Error loading handoff:', error);
      toast.error('Failed to load conversation');
      
      // Mock data for demo
      const mockHandoff: HandoffRequest = {
        _id: handoffId,
        conversationId: 'conv1',
        userId: 'user123',
        userName: 'John Smith',
        userEmail: 'john@example.com',
        platform: 'web',
        reason: 'Complex billing inquiry requiring detailed explanation',
        category: 'billing',
        priority: 'medium',
        status: 'accepted',
        aiConfidence: 0.3,
        assignedAgent: currentAgent,
        createdAt: new Date(Date.now() - 900000),
        updatedAt: new Date(),
        notes: [
          {
            author: 'system',
            content: 'Customer escalated due to complex billing question',
            timestamp: new Date(Date.now() - 300000),
            isInternal: true
          }
        ]
      };
      
      setHandoff(mockHandoff);
      setMessages([
        {
          id: '1',
          content: 'Hello, I need help with my billing account.',
          sender: 'user',
          timestamp: new Date(Date.now() - 900000)
        },
        {
          id: '2',
          content: 'Hi! I\'m Sarah from customer service. I can help you with your billing question.',
          sender: 'agent',
          timestamp: new Date(Date.now() - 300000)
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !handoff) return;
    
    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      // Add message to UI immediately
      const message: Message = {
        id: Date.now().toString(),
        content: messageText,
        sender: 'agent',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
      
      // In real implementation, this would send to the chat API
      console.log('📤 Sending message:', messageText);
      toast.success('Message sent');
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const addInternalNote = async () => {
    if (!newNote.trim() || !handoff) return;
    
    try {
      await handoffAPI.addNote(handoff._id, newNote.trim(), 'agent', true);
      setNewNote('');
      toast.success('Note added');
      await loadHandoffData();
    } catch (error: any) {
      console.error('❌ Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const completeHandoff = async (resolution: any = {}) => {
    if (!handoff) return;
    
    try {
      await handoffAPI.completeHandoff(handoff._id, currentAgent._id, resolution);
      toast.success('Handoff completed successfully');
      navigate('/agent/dashboard');
    } catch (error: any) {
      console.error('❌ Error completing handoff:', error);
      toast.error('Failed to complete handoff');
    }
  };

  const escalateHandoff = async (reason: string) => {
    if (!handoff) return;
    
    try {
      await handoffAPI.escalateHandoff(handoff._id, reason);
      toast.success('Handoff escalated');
      await loadHandoffData();
    } catch (error: any) {
      console.error('❌ Error escalating handoff:', error);
      toast.error('Failed to escalate handoff');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web': return <Globe className="w-4 h-4" />;
      case 'whatsapp': return <Phone className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!handoff) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Handoff request not found</p>
          <button
            onClick={() => navigate('/agent/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/agent/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {handoff.userName}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {getPlatformIcon(handoff.platform)}
                    <span>{handoff.platform}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(handoff.priority)}`}>
                      {handoff.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowInternalNotes(!showInternalNotes)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <Flag className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Handoff Context */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Handoff Reason
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {handoff.reason}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600 dark:text-blue-400">
                  <span>AI Confidence: {Math.round(handoff.aiConfidence * 100)}%</span>
                  <span>Category: {handoff.category}</span>
                  <span>Started: {new Date(handoff.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.sender === 'agent'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                {message.sender !== 'user' && (
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'agent' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-75">
                      {message.sender === 'agent' ? currentAgent.name : 'AI Assistant'}
                      {message.confidence && ` • ${Math.round(message.confidence * 100)}% confidence`}
                    </span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                <div className="text-xs opacity-75 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows={1}
                className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => escalateHandoff('Requires supervisor assistance')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm"
              >
                Escalate
              </button>
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm">
                Transfer
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => completeHandoff({ wasResolved: true, satisfaction: 5 })}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => completeHandoff({ wasResolved: false, requiresFollowup: true })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info Sidebar */}
      {showCustomerInfo && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Customer Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <p className="text-sm text-gray-900 dark:text-white">{handoff.userName}</p>
              </div>
              
              {handoff.userEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{handoff.userEmail}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Platform</label>
                <div className="flex items-center space-x-2">
                  {getPlatformIcon(handoff.platform)}
                  <span className="text-sm text-gray-900 dark:text-white">{handoff.platform}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${getPriorityColor(handoff.priority)}`}>
                  {handoff.priority.toUpperCase()}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <p className="text-sm text-gray-900 dark:text-white">{handoff.category}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Notes Sidebar */}
      {showInternalNotes && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Internal Notes
            </h3>
            
            {/* Add Note */}
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add internal note..."
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={addInternalNote}
                disabled={!newNote.trim()}
                className="mt-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm"
              >
                Add Note
              </button>
            </div>
            
            {/* Notes List */}
            <div className="space-y-3">
              {handoff.notes.map((note, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {note.author}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentChat;
