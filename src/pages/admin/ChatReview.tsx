import { useState } from 'react';
import {
  Search,
  Calendar,
  MessageSquare,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Clock
} from 'lucide-react';

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  messages: ChatMessage[];
  handoffOccurred: boolean;
  satisfaction: 'positive' | 'negative' | 'neutral';
  tags: string[];
}

interface ChatMessage {
  id: string;
  timestamp: Date;
  content: string;
  sender: 'bot' | 'user' | 'agent';
  confidence?: number;
}

const ChatReview = () => {
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('week');
  const [filterHandoff, setFilterHandoff] = useState(false);

  // Mock data for demo
  const chatSessions: ChatSession[] = [
    {
      id: '1',
      userId: 'user123',
      userName: 'John Smith',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() - 3300000), // 55 minutes ago
      handoffOccurred: false,
      satisfaction: 'positive',
      tags: ['billing', 'resolved'],
      messages: [
        {
          id: '1',
          timestamp: new Date(Date.now() - 3600000),
          content: 'Hello, I need help with my billing.',
          sender: 'user'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3590000),
          content: 'I\'d be happy to help you with your billing inquiry. Can you please provide your account number?',
          sender: 'bot',
          confidence: 0.9
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 3580000),
          content: 'My account number is 12345',
          sender: 'user'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 3570000),
          content: 'Thank you. I can see your account. Your last payment was processed successfully. Is there a specific issue you\'re experiencing?',
          sender: 'bot',
          confidence: 0.85
        }
      ]
    },
    {
      id: '2',
      userId: 'user456',
      userName: 'Lisa Wilson',
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: new Date(Date.now() - 6900000), // 1h 55m ago
      handoffOccurred: true,
      satisfaction: 'neutral',
      tags: ['technical', 'handoff', 'complex'],
      messages: [
        {
          id: '5',
          timestamp: new Date(Date.now() - 7200000),
          content: 'I\'m having trouble with the API integration',
          sender: 'user'
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 7190000),
          content: 'I understand you\'re having issues with API integration. Let me connect you with a technical specialist who can better assist you.',
          sender: 'bot',
          confidence: 0.3
        },
        {
          id: '7',
          timestamp: new Date(Date.now() - 7000000),
          content: 'Hi Lisa, this is Sarah from technical support. I can help you with the API integration.',
          sender: 'agent'
        }
      ]
    }
  ];

  return (
    <div className="h-full flex">
      {/* Left sidebar - Chat list */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="space-y-4">
          {/* Search and filters */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex space-x-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="block rounded-md border-gray-300"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              
              <button
                className={`flex items-center px-3 py-2 rounded-md ${
                  filterHandoff 
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
                onClick={() => setFilterHandoff(!filterHandoff)}
              >
                <Flag className="h-4 w-4 mr-2" />
                Handoff Only
              </button>
            </div>
          </div>

          {/* Chat list */}
          <div className="space-y-2">
            {chatSessions.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  selectedChat?.id === chat.id ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{chat.userName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(chat.startTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{chat.messages.length} messages</span>
                  {chat.handoffOccurred && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Handoff
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Chat detail */}
      <div className="flex-1 p-4">
        {selectedChat ? (
          <div className="h-full flex flex-col">
            {/* Chat header */}
            <div className="pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Chat with {selectedChat?.userName}
                  </h2>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {new Date(selectedChat?.startTime).toLocaleString()}
                    </span>
                    <Clock className="h-4 w-4 ml-4 mr-1" />
                    <span>
                      {selectedChat && Math.round(
                        (new Date(selectedChat.endTime).getTime() - 
                         new Date(selectedChat.startTime).getTime()) / 1000 / 60
                      )} minutes
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedChat.satisfaction === 'positive' ? (
                    <span className="flex items-center text-green-600">
                      <ThumbsUp className="h-5 w-5 mr-1" />
                      Satisfied
                    </span>
                  ) : selectedChat.satisfaction === 'negative' ? (
                    <span className="flex items-center text-red-600">
                      <ThumbsDown className="h-5 w-5 mr-1" />
                      Unsatisfied
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {selectedChat.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-primary-600 text-white'
                        : message.sender === 'agent'
                        ? 'bg-yellow-100 text-yellow-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {message.sender !== 'user' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {message.sender === 'agent' ? 'Human Agent' : 'Bot'}
                        {message.confidence && ` • ${Math.round(message.confidence * 100)}% confidence`}
                      </div>
                    )}
                    <p>{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a chat to view details
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatReview;
