import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Calendar,
  MessageSquare,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Phone,
  Instagram,
  MessageCircle,
  Hash,
  Zap,
  Ticket,
  AlertTriangle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { TicketService } from '../../services/ticketService';
import type { Ticket as TicketType } from './TicketManagement';
import '../../styles/scrollbar.css';

type Platform = 'line' | 'facebook' | 'instagram' | 'discord' | 'whatsapp' | 'telegram' | 'web' | 'other';

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  platform: Platform;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month'>('week');
  const [filterHandoff, setFilterHandoff] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [tickets, setTickets] = useState<Map<string, TicketType>>(new Map());
  const [ticketService] = useState(new TicketService());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatListRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Platform configuration
  const platforms = [
    { id: 'all' as const, name: 'All Platforms', icon: MessageSquare, color: 'gray' },
    { id: 'line' as const, name: 'LINE', icon: MessageCircle, color: 'green' },
    { id: 'facebook' as const, name: 'Facebook', icon: MessageCircle, color: 'blue' },
    { id: 'instagram' as const, name: 'Instagram', icon: Instagram, color: 'pink' },
    { id: 'discord' as const, name: 'Discord', icon: Hash, color: 'indigo' },
    { id: 'whatsapp' as const, name: 'WhatsApp', icon: Phone, color: 'green' },
    { id: 'telegram' as const, name: 'Telegram', icon: Zap, color: 'blue' },
    { id: 'web' as const, name: 'Web Chat', icon: MessageSquare, color: 'gray' },
    { id: 'other' as const, name: 'Other', icon: MessageCircle, color: 'gray' }
  ];

  const getPlatformIcon = (platform: Platform) => {
    const platformConfig = platforms.find(p => p.id === platform);
    return platformConfig?.icon || MessageCircle;
  };

  // Mock data for demo
  const chatSessions: ChatSession[] = [
    {
      id: '1',
      userId: 'user123',
      userName: 'John Smith',
      platform: 'web',
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
      platform: 'line',
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
    },
    {
      id: '3',
      userId: 'user789',
      userName: 'Maria Garcia',
      platform: 'whatsapp',
      startTime: new Date(Date.now() - 1800000), // 30 minutes ago
      endTime: new Date(Date.now() - 1500000), // 25 minutes ago
      handoffOccurred: false,
      satisfaction: 'positive',
      tags: ['product-inquiry', 'resolved'],
      messages: [
        {
          id: '8',
          timestamp: new Date(Date.now() - 1800000),
          content: 'Hi! Can you tell me more about your premium plan?',
          sender: 'user'
        },
        {
          id: '9',
          timestamp: new Date(Date.now() - 1790000),
          content: 'I\'d be happy to help you with information about our premium plan. It includes advanced features like priority support, extended storage, and premium integrations.',
          sender: 'bot',
          confidence: 0.92
        }
      ]
    },
    {
      id: '4',
      userId: 'user101',
      userName: 'Alex Chen',
      platform: 'discord',
      startTime: new Date(Date.now() - 5400000), // 1.5 hours ago
      endTime: new Date(Date.now() - 5100000), // 1h 25m ago
      handoffOccurred: false,
      satisfaction: 'positive',
      tags: ['gaming', 'support'],
      messages: [
        {
          id: '10',
          timestamp: new Date(Date.now() - 5400000),
          content: 'Hey, having issues with the Discord bot integration',
          sender: 'user'
        },
        {
          id: '11',
          timestamp: new Date(Date.now() - 5390000),
          content: 'I can help you troubleshoot the Discord bot integration. Let me check your server settings.',
          sender: 'bot',
          confidence: 0.88
        }
      ]
    },
    {
      id: '5',
      userId: 'user202',
      userName: 'Sophie Martin',
      platform: 'instagram',
      startTime: new Date(Date.now() - 900000), // 15 minutes ago
      endTime: new Date(Date.now() - 600000), // 10 minutes ago
      handoffOccurred: false,
      satisfaction: 'neutral',
      tags: ['social-media', 'inquiry'],
      messages: [
        {
          id: '12',
          timestamp: new Date(Date.now() - 900000),
          content: 'Can I integrate this with my Instagram business account?',
          sender: 'user'
        },
        {
          id: '13',
          timestamp: new Date(Date.now() - 890000),
          content: 'Yes! Our Instagram integration allows you to manage messages and automate responses for your business account.',
          sender: 'bot',
          confidence: 0.95
        }
      ]
    },
    {
      id: '6',
      userId: 'user303',
      userName: 'David Kim',
      platform: 'facebook',
      startTime: new Date(Date.now() - 2700000), // 45 minutes ago
      endTime: new Date(Date.now() - 2400000), // 40 minutes ago
      handoffOccurred: true,
      satisfaction: 'negative',
      tags: ['refund', 'escalated', 'unsatisfied'],
      messages: [
        {
          id: '14',
          timestamp: new Date(Date.now() - 2700000),
          content: 'I want a refund for my subscription. This service is terrible!',
          sender: 'user'
        },
        {
          id: '15',
          timestamp: new Date(Date.now() - 2690000),
          content: 'I understand you\'re frustrated. Let me help you with the refund process.',
          sender: 'bot',
          confidence: 0.75
        },
        {
          id: '16',
          timestamp: new Date(Date.now() - 2680000),
          content: 'This bot is useless! I want to speak to a human NOW!',
          sender: 'user'
        },
        {
          id: '17',
          timestamp: new Date(Date.now() - 2670000),
          content: 'I\'m connecting you with our customer service team right away.',
          sender: 'bot',
          confidence: 0.45
        },
        {
          id: '18',
          timestamp: new Date(Date.now() - 2500000),
          content: 'Hi David, I\'m Mike from customer service. I see you\'re requesting a refund. Let me review your account.',
          sender: 'agent'
        },
        {
          id: '19',
          timestamp: new Date(Date.now() - 2480000),
          content: 'Finally! Yes, I want a full refund. I\'ve been charged for features I never used.',
          sender: 'user'
        },
        {
          id: '20',
          timestamp: new Date(Date.now() - 2450000),
          content: 'I\'ve processed a partial refund for the unused features. You should see it in 3-5 business days.',
          sender: 'agent'
        }
      ]
    },
    {
      id: '7',
      userId: 'user404',
      userName: 'Emma Thompson',
      platform: 'telegram',
      startTime: new Date(Date.now() - 600000), // 10 minutes ago
      endTime: new Date(Date.now() - 300000), // 5 minutes ago
      handoffOccurred: false,
      satisfaction: 'positive',
      tags: ['quick-question', 'resolved', 'pricing'],
      messages: [
        {
          id: '21',
          timestamp: new Date(Date.now() - 600000),
          content: 'What\'s the difference between your Basic and Pro plans?',
          sender: 'user'
        },
        {
          id: '22',
          timestamp: new Date(Date.now() - 590000),
          content: 'Great question! The Basic plan includes up to 1,000 messages per month, while Pro includes unlimited messages plus advanced analytics and priority support.',
          sender: 'bot',
          confidence: 0.96
        },
        {
          id: '23',
          timestamp: new Date(Date.now() - 580000),
          content: 'How much does Pro cost?',
          sender: 'user'
        },
        {
          id: '24',
          timestamp: new Date(Date.now() - 570000),
          content: 'The Pro plan is $29/month, and we\'re currently offering a 14-day free trial!',
          sender: 'bot',
          confidence: 0.98
        },
        {
          id: '25',
          timestamp: new Date(Date.now() - 560000),
          content: 'Perfect! How do I start the trial?',
          sender: 'user'
        },
        {
          id: '26',
          timestamp: new Date(Date.now() - 550000),
          content: 'I can help you start your free trial right now. Would you like me to send you the upgrade link?',
          sender: 'bot',
          confidence: 0.94
        },
        {
          id: '27',
          timestamp: new Date(Date.now() - 540000),
          content: 'Yes please!',
          sender: 'user'
        }
      ]
    },
    {
      id: '8',
      userId: 'user505',
      userName: 'Carlos Rodriguez',
      platform: 'discord',
      startTime: new Date(Date.now() - 10800000), // 3 hours ago
      endTime: new Date(Date.now() - 10200000), // 2h 50m ago
      handoffOccurred: false,
      satisfaction: 'neutral',
      tags: ['technical', 'bot-setup', 'complex'],
      messages: [
        {
          id: '28',
          timestamp: new Date(Date.now() - 10800000),
          content: 'How do I set up the bot permissions in my Discord server?',
          sender: 'user'
        },
        {
          id: '29',
          timestamp: new Date(Date.now() - 10790000),
          content: 'I\'ll walk you through the Discord bot setup process. First, you need to go to your server settings and navigate to the Roles section.',
          sender: 'bot',
          confidence: 0.87
        },
        {
          id: '30',
          timestamp: new Date(Date.now() - 10780000),
          content: 'Okay, I\'m in server settings. What\'s next?',
          sender: 'user'
        },
        {
          id: '31',
          timestamp: new Date(Date.now() - 10770000),
          content: 'Create a new role for the bot with these permissions: Send Messages, Read Message History, Use Slash Commands, and Manage Messages.',
          sender: 'bot',
          confidence: 0.91
        },
        {
          id: '32',
          timestamp: new Date(Date.now() - 10760000),
          content: 'Done! The role is created. Now what?',
          sender: 'user'
        },
        {
          id: '33',
          timestamp: new Date(Date.now() - 10750000),
          content: 'Great! Now go to the Members section and assign this role to our bot. The bot should appear in your member list.',
          sender: 'bot',
          confidence: 0.89
        },
        {
          id: '34',
          timestamp: new Date(Date.now() - 10740000),
          content: 'I don\'t see the bot in my member list. Is there something wrong?',
          sender: 'user'
        },
        {
          id: '35',
          timestamp: new Date(Date.now() - 10730000),
          content: 'The bot might not have joined your server yet. Please check if you\'ve completed the invitation process through our dashboard.',
          sender: 'bot',
          confidence: 0.82
        }
      ]
    },
    {
      id: '9',
      userId: 'user606',
      userName: 'Priya Patel',
      platform: 'whatsapp',
      startTime: new Date(Date.now() - 1200000), // 20 minutes ago
      endTime: new Date(Date.now() - 900000), // 15 minutes ago
      handoffOccurred: false,
      satisfaction: 'positive',
      tags: ['integration', 'api', 'developer'],
      messages: [
        {
          id: '36',
          timestamp: new Date(Date.now() - 1200000),
          content: 'Hi! I\'m a developer looking to integrate your API with our e-commerce platform.',
          sender: 'user'
        },
        {
          id: '37',
          timestamp: new Date(Date.now() - 1190000),
          content: 'Excellent! I can help you get started with our API integration. Are you looking to integrate our chatbot or our analytics API?',
          sender: 'bot',
          confidence: 0.93
        },
        {
          id: '38',
          timestamp: new Date(Date.now() - 1180000),
          content: 'The chatbot API. We want to add automated customer support to our checkout process.',
          sender: 'user'
        },
        {
          id: '39',
          timestamp: new Date(Date.now() - 1170000),
          content: 'Perfect use case! You\'ll need our REST API. I can send you the documentation and API keys. What programming language are you using?',
          sender: 'bot',
          confidence: 0.95
        },
        {
          id: '40',
          timestamp: new Date(Date.now() - 1160000),
          content: 'We\'re using Node.js with Express.',
          sender: 'user'
        },
        {
          id: '41',
          timestamp: new Date(Date.now() - 1150000),
          content: 'Great choice! I\'ll send you our Node.js SDK along with example code for e-commerce integrations. Check your email in a few minutes.',
          sender: 'bot',
          confidence: 0.97
        },
        {
          id: '42',
          timestamp: new Date(Date.now() - 1140000),
          content: 'Awesome, thank you! Is there a sandbox environment for testing?',
          sender: 'user'
        },
        {
          id: '43',
          timestamp: new Date(Date.now() - 1130000),
          content: 'Yes! The sandbox API endpoint is included in the documentation. You get 10,000 free test requests per month.',
          sender: 'bot',
          confidence: 0.96
        }
      ]
    },
    {
      id: '10',
      userId: 'user707',
      userName: 'James Wilson',
      platform: 'line',
      startTime: new Date(Date.now() - 14400000), // 4 hours ago
      endTime: new Date(Date.now() - 13800000), // 3h 50m ago
      handoffOccurred: true,
      satisfaction: 'positive',
      tags: ['account-recovery', 'security', 'resolved'],
      messages: [
        {
          id: '44',
          timestamp: new Date(Date.now() - 14400000),
          content: 'I can\'t access my account. I think someone changed my password.',
          sender: 'user'
        },
        {
          id: '45',
          timestamp: new Date(Date.now() - 14390000),
          content: 'I\'m sorry to hear about this security concern. Let me help you recover your account. Can you provide the email address associated with your account?',
          sender: 'bot',
          confidence: 0.88
        },
        {
          id: '46',
          timestamp: new Date(Date.now() - 14380000),
          content: 'james.wilson@email.com',
          sender: 'user'
        },
        {
          id: '47',
          timestamp: new Date(Date.now() - 14370000),
          content: 'For security reasons, I need to connect you with our security team to verify your identity and help with account recovery.',
          sender: 'bot',
          confidence: 0.65
        },
        {
          id: '48',
          timestamp: new Date(Date.now() - 14200000),
          content: 'Hi James, this is Lisa from our security team. I can help you recover your account. Can you verify the last 4 digits of the phone number on file?',
          sender: 'agent'
        },
        {
          id: '49',
          timestamp: new Date(Date.now() - 14190000),
          content: '7892',
          sender: 'user'
        },
        {
          id: '50',
          timestamp: new Date(Date.now() - 14180000),
          content: 'Perfect! I can see there was suspicious login activity yesterday. I\'ve reset your password and sent a secure link to your email.',
          sender: 'agent'
        },
        {
          id: '51',
          timestamp: new Date(Date.now() - 14170000),
          content: 'Thank you! I got the email. Should I be worried about my data?',
          sender: 'user'
        },
        {
          id: '52',
          timestamp: new Date(Date.now() - 14160000),
          content: 'Your data is safe. The unauthorized access was blocked before any sensitive information was compromised. I\'ve also enabled 2FA on your account.',
          sender: 'agent'
        },
        {
          id: '53',
          timestamp: new Date(Date.now() - 14150000),
          content: 'Excellent! Thank you for the quick help.',
          sender: 'user'
        }
      ]
    },
    {
      id: '11',
      userId: 'user808',
      userName: 'Anna Kowalski',
      platform: 'instagram',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(Date.now() - 3300000), // 55 minutes ago
      handoffOccurred: false,
      satisfaction: 'neutral',
      tags: ['feature-request', 'social-media'],
      messages: [
        {
          id: '54',
          timestamp: new Date(Date.now() - 3600000),
          content: 'Can your bot automatically respond to Instagram story mentions?',
          sender: 'user'
        },
        {
          id: '55',
          timestamp: new Date(Date.now() - 3590000),
          content: 'Currently, our Instagram integration supports DM automation and comment responses, but story mentions are not yet supported due to Instagram\'s API limitations.',
          sender: 'bot',
          confidence: 0.91
        },
        {
          id: '56',
          timestamp: new Date(Date.now() - 3580000),
          content: 'That\'s disappointing. When might this feature be available?',
          sender: 'user'
        },
        {
          id: '57',
          timestamp: new Date(Date.now() - 3570000),
          content: 'We\'re actively working with Instagram on expanding API access. I\'ll add your request to our feature roadmap. Would you like me to notify you when it becomes available?',
          sender: 'bot',
          confidence: 0.86
        },
        {
          id: '58',
          timestamp: new Date(Date.now() - 3560000),
          content: 'Yes, please keep me updated.',
          sender: 'user'
        },
        {
          id: '59',
          timestamp: new Date(Date.now() - 3550000),
          content: 'Perfect! I\'ve added your email to our notification list for Instagram story mention features.',
          sender: 'bot',
          confidence: 0.94
        }
      ]
    },
    {
      id: '12',
      userId: 'user909',
      userName: 'Michael Chang',
      platform: 'web',
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: new Date(Date.now() - 6900000), // 1h 55m ago
      handoffOccurred: false,
      satisfaction: 'positive',
      tags: ['demo-request', 'enterprise', 'sales'],
      messages: [
        {
          id: '60',
          timestamp: new Date(Date.now() - 7200000),
          content: 'Hi, I\'m interested in your enterprise solution for our company of 500+ employees.',
          sender: 'user'
        },
        {
          id: '61',
          timestamp: new Date(Date.now() - 7190000),
          content: 'Excellent! I\'d be happy to help you explore our enterprise offerings. What specific use cases are you looking to address?',
          sender: 'bot',
          confidence: 0.92
        },
        {
          id: '62',
          timestamp: new Date(Date.now() - 7180000),
          content: 'We need internal IT support automation and customer service for our SaaS product.',
          sender: 'user'
        },
        {
          id: '63',
          timestamp: new Date(Date.now() - 7170000),
          content: 'Perfect fit! Our enterprise plan includes multi-tenant support, advanced analytics, custom integrations, and dedicated support. Would you like to schedule a demo?',
          sender: 'bot',
          confidence: 0.95
        },
        {
          id: '64',
          timestamp: new Date(Date.now() - 7160000),
          content: 'Yes, that sounds great. What are your available times this week?',
          sender: 'user'
        },
        {
          id: '65',
          timestamp: new Date(Date.now() - 7150000),
          content: 'I can schedule a 30-minute demo for you. Are you available tomorrow at 2 PM EST or Thursday at 10 AM EST?',
          sender: 'bot',
          confidence: 0.89
        },
        {
          id: '66',
          timestamp: new Date(Date.now() - 7140000),
          content: 'Thursday at 10 AM works perfectly.',
          sender: 'user'
        },
        {
          id: '67',
          timestamp: new Date(Date.now() - 7130000),
          content: 'Great! I\'ve scheduled your demo for Thursday, 10 AM EST. You\'ll receive a calendar invite and demo link shortly. Looking forward to showing you our enterprise features!',
          sender: 'bot',
          confidence: 0.97
        }
      ]
    },
    {
      id: '13',
      userId: 'user1010',
      userName: 'Sarah Ahmed',
      platform: 'facebook',
      startTime: new Date(Date.now() - 300000), // 5 minutes ago
      endTime: new Date(Date.now() - 60000), // 1 minute ago
      handoffOccurred: false,
      satisfaction: 'positive',
      tags: ['getting-started', 'tutorial'],
      messages: [
        {
          id: '68',
          timestamp: new Date(Date.now() - 300000),
          content: 'I just signed up! How do I create my first chatbot?',
          sender: 'user'
        },
        {
          id: '69',
          timestamp: new Date(Date.now() - 290000),
          content: 'Welcome to our platform! I\'m excited to help you create your first chatbot. Let\'s start with the basics - what type of business or use case is this for?',
          sender: 'bot',
          confidence: 0.96
        },
        {
          id: '70',
          timestamp: new Date(Date.now() - 280000),
          content: 'I run a small restaurant and want to automate reservation inquiries.',
          sender: 'user'
        },
        {
          id: '71',
          timestamp: new Date(Date.now() - 270000),
          content: 'Perfect! Restaurant reservations are a great use case. I can guide you through our restaurant template. It includes pre-built flows for reservations, menu questions, and hours of operation.',
          sender: 'bot',
          confidence: 0.94
        },
        {
          id: '72',
          timestamp: new Date(Date.now() - 260000),
          content: 'That sounds exactly what I need! How do I access this template?',
          sender: 'user'
        },
        {
          id: '73',
          timestamp: new Date(Date.now() - 250000),
          content: 'I\'ll send you a direct link to the restaurant template in your dashboard. You can customize it with your restaurant\'s specific information, menu, and reservation system.',
          sender: 'bot',
          confidence: 0.95
        },
        {
          id: '74',
          timestamp: new Date(Date.now() - 240000),
          content: 'Amazing! How long does it usually take to set up?',
          sender: 'user'
        },
        {
          id: '75',
          timestamp: new Date(Date.now() - 230000),
          content: 'With our template, most restaurants have their bot running in 15-30 minutes! I can also schedule a quick setup call if you\'d prefer guided assistance.',
          sender: 'bot',
          confidence: 0.93
        }
      ]
    }
  ];

  // Auto-create tickets for all chat sessions
  useEffect(() => {
    const createTicketsForChats = async () => {
      const newTickets = new Map(tickets);
      
      for (const chat of chatSessions) {
        if (!tickets.has(chat.id)) {
          try {
            const ticket = await ticketService.createTicketFromChat(chat);
            newTickets.set(chat.id, ticket);
          } catch (error) {
            console.error(`Failed to create ticket for chat ${chat.id}:`, error);
          }
        }
      }
      
      if (newTickets.size !== tickets.size) {
        setTickets(newTickets);
      }
    };

    createTicketsForChats();
  }, [chatSessions, ticketService, tickets]);

  // Check for escalation needs
  useEffect(() => {
    const checkEscalations = async () => {
      const updatedTickets = new Map(tickets);
      let hasUpdates = false;

      for (const [chatId, ticket] of tickets) {
        const chat = chatSessions.find(c => c.id === chatId);
        if (chat && ticketService.shouldEscalate(ticket, chat)) {
          try {
            const escalatedTicket = await ticketService.escalateTicket(
              ticket,
              'Automatic escalation based on system criteria',
              'system'
            );
            updatedTickets.set(chatId, escalatedTicket);
            hasUpdates = true;
          } catch (error) {
            console.error(`Failed to escalate ticket ${ticket.id}:`, error);
          }
        }
      }

      if (hasUpdates) {
        setTickets(updatedTickets);
      }
    };

    const interval = setInterval(checkEscalations, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [tickets, chatSessions, ticketService]);

  // Filter chats based on selected platform
  const filteredChats = chatSessions.filter(chat => {
    if (selectedPlatform !== 'all' && chat.platform !== selectedPlatform) return false;
    if (filterHandoff && !chat.handoffOccurred) return false;
    if (searchTerm && !chat.userName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Get ticket for a chat session
  const getTicketForChat = (chatId: string): TicketType | undefined => {
    return tickets.get(chatId);
  };

  // Get ticket status color
  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tier1': return 'text-green-600 bg-green-100';
      case 'tier2': return 'text-yellow-600 bg-yellow-100';
      case 'tier3': return 'text-red-600 bg-red-100';
      case 'escalated': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Auto-select chat based on URL parameter
  useEffect(() => {
    const chatId = searchParams.get('chatId');
    if (chatId && chatSessions.length > 0) {
      const targetChat = chatSessions.find(chat => chat.id === chatId);
      if (targetChat && (!selectedChat || selectedChat.id !== chatId)) {
        setSelectedChat(targetChat);
        
        // Auto-scroll to the selected chat in the list
        setTimeout(() => {
          const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
          if (chatElement && chatListRef.current) {
            chatElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Clear the URL parameter after selecting the chat
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('chatId');
          return newParams;
        });
      }
    }
  }, [chatSessions, searchParams, selectedChat, setSearchParams]);

  // Auto-scroll to bottom when chat changes or messages update
  useEffect(() => {
    if (selectedChat && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChat]);

  // Scroll to top of chat list when platform filter changes
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedPlatform, searchTerm]);

  // Handle scroll detection for messages
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom);
      }
    };

    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, [selectedChat]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Platform Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex overflow-x-auto px-4 scrollbar-hide">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isActive = selectedPlatform === platform.id;
            const chatCount = platform.id === 'all' 
              ? chatSessions.length 
              : chatSessions.filter(chat => chat.platform === platform.id).length;
            
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{platform.name}</span>
                {chatCount > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    isActive
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {chatCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex">
      {/* Left sidebar - Chat list */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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

          {/* Chat list - Scrollable */}
          <div 
            ref={chatListRef}
            className="flex-1 overflow-y-auto p-4 scrollbar-thin smooth-scroll"
          >
          <div className="space-y-2">
                          {filteredChats.map((chat) => {
              const PlatformIcon = getPlatformIcon(chat.platform);
              const ticket = getTicketForChat(chat.id);
              
              return (
              <button
                key={chat.id}
                  data-chat-id={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-left p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedChat?.id === chat.id ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center space-x-2">
                      <PlatformIcon className="h-4 w-4 text-primary-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{chat.userName}</span>
                      {ticket && (
                        <Ticket className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  <span className="text-xs text-gray-500">
                    {new Date(chat.startTime).toLocaleTimeString()}
                  </span>
                </div>

                  {/* Ticket Information */}
                  {ticket && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getTierColor(ticket.tier)}`}>
                        {ticket.tier.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getTicketStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                  <span>{chat.messages.length} messages</span>
                  {chat.handoffOccurred && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Handoff
                    </span>
                  )}
                </div>
                    {ticket && ticket.escalations.length > 0 && (
                      <div className="flex items-center text-orange-600">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        <span className="text-xs">Escalated</span>
                      </div>
                    )}
                  </div>

                  {/* AI Confidence & SLA Status */}
                  {ticket && (
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <div className="flex items-center space-x-2">
                        {ticket.aiAttempted && (
                          <span className="text-blue-600">
                            AI: {Math.round(ticket.aiConfidence * 100)}%
                          </span>
                        )}
                        {ticket.assignedAgent && (
                          <span className="text-gray-600">
                            → {ticket.assignedAgent.name}
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center ${
                        new Date() > ticket.slaDeadline ? 'text-red-600' : 'text-green-600'
                      }`}>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {new Date() > ticket.slaDeadline ? 'Overdue' : 'On Time'}
                        </span>
                      </div>
                    </div>
                  )}
              </button>
              );
            })}
            </div>
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
                  <div className="flex items-center space-x-2 mb-1">
                    {selectedChat && (() => {
                      const PlatformIcon = getPlatformIcon(selectedChat.platform);
                      const platformConfig = platforms.find(p => p.id === selectedChat.platform);
                      const ticket = getTicketForChat(selectedChat.id);
                      return (
                        <>
                          <PlatformIcon className="h-5 w-5 text-primary-500" />
                          <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                            {platformConfig?.name}
                          </span>
                          {ticket && (
                            <>
                              <Ticket className="h-4 w-4 text-blue-500" />
                              <span className="text-xs font-mono text-blue-600">{ticket.id}</span>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
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

            {/* Ticket Information Panel */}
            {(() => {
              const ticket = getTicketForChat(selectedChat.id);
              if (!ticket) return null;
              
              return (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center">
                      <Ticket className="h-4 w-4 mr-2" />
                      Ticket Information
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTierColor(ticket.tier)}`}>
                        {ticket.tier.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getTicketStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">Ticket ID:</span>
                      <p className="text-blue-800 dark:text-blue-200 font-mono">{ticket.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">Assigned Agent:</span>
                      <p className="text-blue-800 dark:text-blue-200">
                        {ticket.assignedAgent?.name || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">SLA Deadline:</span>
                      <p className={`${new Date() > ticket.slaDeadline ? 'text-red-600' : 'text-blue-800 dark:text-blue-200'}`}>
                        {ticket.slaDeadline.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">AI Confidence:</span>
                      <p className="text-blue-800 dark:text-blue-200">
                        {ticket.aiAttempted ? `${Math.round(ticket.aiConfidence * 100)}%` : 'Not attempted'}
                      </p>
                    </div>
                  </div>

                  {/* Escalation History */}
                  {ticket.escalations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex items-center mb-2">
                        <ArrowUp className="h-4 w-4 text-orange-500 mr-1" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">Escalation History</span>
                      </div>
                      <div className="space-y-1">
                        {ticket.escalations.map((escalation) => (
                          <div key={escalation.id} className="text-xs text-blue-800 dark:text-blue-200">
                            <span className="font-medium">
                              {escalation.fromTier.toUpperCase()} → {escalation.toTier.toUpperCase()}
                            </span>
                            <span className="ml-2 text-blue-600">
                              ({new Date(escalation.timestamp).toLocaleString()})
                            </span>
                            <p className="text-blue-700 dark:text-blue-300 ml-2">
                              {escalation.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Suggestions */}
                  {ticket.aiSuggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">AI Suggestions</span>
                      </div>
                      <div className="space-y-2">
                        {ticket.aiSuggestions.slice(0, 2).map((suggestion) => (
                          <div key={suggestion.id} className="bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {suggestion.title}
                              </span>
                              <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {suggestion.content.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Chat messages - Scrollable */}
            <div className="flex-1 relative">
              <div 
                ref={messagesContainerRef}
                className="h-full overflow-y-auto px-4 py-2 space-y-4 scrollbar-messages smooth-scroll"
              >
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
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
              </div>
              
              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 right-4 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-10"
                  aria-label="Scroll to bottom"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a chat to view details
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ChatReview;