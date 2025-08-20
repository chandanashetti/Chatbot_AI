import { useState } from 'react'
import {
  MessageSquare,
  Instagram,
  Webhook,
  CheckCircle,
  AlertCircle,
  Info,
  TestTube,
  Search,
  Filter,
  Globe,
  Phone,
  Mail,
  Users,
  ShoppingCart,
  BarChart3,
  Calendar,
  CreditCard,
  Headphones,
  ExternalLink,
  Video,
  MessageCircle,
  Zap,
  Database,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

// Custom Icons for platforms
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
)

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

const LineIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
)

const WeChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.529-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.529-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.248 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1 .134-.98c1.516-1.12 2.497-2.806 2.497-4.626 0-3.51-3.473-6.372-7.013-6.488zm-2.530 2.178c.462 0 .837.383.837.857 0 .482-.375.857-.837.857-.462 0-.836-.375-.836-.857 0-.474.374-.857.836-.857zm5.061 0c.462 0 .837.383.837.857 0 .482-.375.857-.837.857-.462 0-.837-.375-.837-.857 0-.474.375-.857.837-.857z"/>
  </svg>
)

const SlackIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
  </svg>
)

type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending'
type IntegrationCategory = 'messaging' | 'social' | 'voice' | 'email' | 'ecommerce' | 'crm' | 'analytics' | 'productivity' | 'payment' | 'support'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  category: IntegrationCategory
  status: IntegrationStatus
  isPopular: boolean
  isPremium: boolean
  features: string[]
  metrics?: {
    totalMessages: number
    successRate: number
  }
}

const integrations: Integration[] = [
  // Messaging Platforms
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connect with customers on WhatsApp Business API',
    icon: WhatsAppIcon,
    category: 'messaging',
    status: 'connected',
    isPopular: true,
    isPremium: false,
    features: ['Rich Media', 'Templates', 'Quick Replies', 'Interactive Messages'],
    metrics: { totalMessages: 15420, successRate: 94.2 }
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Deploy bots on Telegram with inline keyboards and media support',
    icon: TelegramIcon,
    category: 'messaging',
    status: 'connected',
    isPopular: true,
    isPremium: false,
    features: ['Inline Keyboards', 'File Sharing', 'Group Chats', 'Bot Commands'],
    metrics: { totalMessages: 8934, successRate: 96.1 }
  },
  {
    id: 'line',
    name: 'LINE Messaging',
    description: 'Reach customers on LINE with rich messages and quick replies',
    icon: LineIcon,
    category: 'messaging',
    status: 'disconnected',
    isPopular: true,
    isPremium: false,
    features: ['Rich Menus', 'Flex Messages', 'Quick Replies', 'LIFF Apps']
  },
  {
    id: 'wechat',
    name: 'WeChat',
    description: 'Connect with WeChat users through official accounts',
    icon: WeChatIcon,
    category: 'messaging',
    status: 'pending',
    isPopular: true,
    isPremium: true,
    features: ['Mini Programs', 'Custom Menus', 'Template Messages', 'QR Codes']
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Engage customers on Facebook Messenger with rich interactions',
    icon: FacebookIcon,
    category: 'messaging',
    status: 'connected',
    isPopular: true,
    isPremium: false,
    features: ['Persistent Menu', 'Quick Replies', 'Webview', 'Handover Protocol'],
    metrics: { totalMessages: 12567, successRate: 92.8 }
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Deploy interactive bots in Slack workspaces',
    icon: SlackIcon,
    category: 'messaging',
    status: 'connected',
    isPopular: true,
    isPremium: false,
    features: ['Slash Commands', 'Interactive Components', 'Workflow Steps', 'App Home'],
    metrics: { totalMessages: 3421, successRate: 98.5 }
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    description: 'Respond to Instagram DMs and comments automatically',
    icon: Instagram,
    category: 'social',
    status: 'error',
    isPopular: false,
    isPremium: false,
    features: ['DM Automation', 'Comment Replies', 'Story Mentions', 'Media Sharing']
  },

  // Voice & Communication
  {
    id: 'twilio-voice',
    name: 'Twilio Voice',
    description: 'Create voice bots with Twilio\'s programmable voice API',
    icon: Phone,
    category: 'voice',
    status: 'disconnected',
    isPopular: false,
    isPremium: true,
    features: ['Text-to-Speech', 'Speech Recognition', 'Call Recording', 'IVR']
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Integrate with Zoom meetings and webinars',
    icon: Video,
    category: 'voice',
    status: 'disconnected',
    isPopular: false,
    isPremium: true,
    features: ['Meeting Bots', 'Webinar Integration', 'Recording Access', 'Chat Commands']
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Deploy bots in Microsoft Teams channels and chats',
    icon: MessageCircle,
    category: 'messaging',
    status: 'disconnected',
    isPopular: false,
    isPremium: true,
    features: ['Adaptive Cards', 'Task Modules', 'Messaging Extensions', 'Tabs']
  },

  // Email
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Automate email responses with Gmail integration',
    icon: Mail,
    category: 'email',
    status: 'disconnected',
    isPopular: false,
    isPremium: true,
    features: ['Auto-Reply', 'Email Parsing', 'Attachment Handling', 'Label Management']
  },

  // E-commerce
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Connect with Shopify store for order management and support',
    icon: ShoppingCart,
    category: 'ecommerce',
    status: 'disconnected',
    isPopular: true,
    isPremium: false,
    features: ['Order Tracking', 'Product Catalog', 'Inventory Updates', 'Customer Data']
  },

  // CRM
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Integrate with Salesforce CRM for lead management',
    icon: Database,
    category: 'crm',
    status: 'disconnected',
    isPopular: true,
    isPremium: true,
    features: ['Lead Creation', 'Contact Sync', 'Opportunity Tracking', 'Case Management']
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Connect with HubSpot for marketing and sales automation',
    icon: Users,
    category: 'crm',
    status: 'connected',
    isPopular: true,
    isPremium: false,
    features: ['Contact Management', 'Deal Tracking', 'Email Marketing', 'Analytics'],
    metrics: { totalMessages: 2341, successRate: 89.4 }
  },

  // Analytics
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track bot interactions and user behavior',
    icon: BarChart3,
    category: 'analytics',
    status: 'connected',
    isPopular: true,
    isPremium: false,
    features: ['Event Tracking', 'Conversion Goals', 'User Journeys', 'Custom Dimensions']
  },

  // Productivity
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Schedule meetings and manage appointments through your bot',
    icon: Calendar,
    category: 'productivity',
    status: 'disconnected',
    isPopular: false,
    isPremium: false,
    features: ['Event Creation', 'Availability Check', 'Meeting Reminders', 'Calendar Sync']
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Create and update Notion pages from bot conversations',
    icon: FileText,
    category: 'productivity',
    status: 'disconnected',
    isPopular: false,
    isPremium: false,
    features: ['Page Creation', 'Database Updates', 'Content Sync', 'Template Usage']
  },

  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Process payments and manage subscriptions through your bot',
    icon: CreditCard,
    category: 'payment',
    status: 'disconnected',
    isPopular: true,
    isPremium: true,
    features: ['Payment Processing', 'Subscription Management', 'Invoice Creation', 'Refunds']
  },

  // Support
  {
    id: 'zendesk',
    name: 'Zendesk',
    description: 'Create and manage support tickets through Zendesk integration',
    icon: Headphones,
    category: 'support',
    status: 'disconnected',
    isPopular: true,
    isPremium: false,
    features: ['Ticket Creation', 'Status Updates', 'Agent Handoff', 'Knowledge Base']
  },

  // Custom
  {
    id: 'webhook',
    name: 'Custom Webhook',
    description: 'Connect to any external service with custom webhooks',
    icon: Webhook,
    category: 'productivity',
    status: 'connected',
    isPopular: false,
    isPremium: false,
    features: ['Custom Headers', 'Request Transformation', 'Response Mapping', 'Retry Logic']
  }
]

const Integrations = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<IntegrationStatus | 'all'>('all')
  const [showOnlyPopular, setShowOnlyPopular] = useState(false)

  const categories = [
    { value: 'all' as const, label: 'All Categories', icon: Globe },
    { value: 'messaging' as const, label: 'Messaging', icon: MessageSquare },
    { value: 'social' as const, label: 'Social Media', icon: Instagram },
    { value: 'voice' as const, label: 'Voice & Video', icon: Phone },
    { value: 'email' as const, label: 'Email', icon: Mail },
    { value: 'ecommerce' as const, label: 'E-commerce', icon: ShoppingCart },
    { value: 'crm' as const, label: 'CRM', icon: Users },
    { value: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { value: 'productivity' as const, label: 'Productivity', icon: Calendar },
    { value: 'payment' as const, label: 'Payment', icon: CreditCard },
    { value: 'support' as const, label: 'Support', icon: Headphones }
  ]

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || integration.status === selectedStatus
    const matchesPopular = !showOnlyPopular || integration.isPopular

    return matchesSearch && matchesCategory && matchesStatus && matchesPopular
  })

  const getStatusColor = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected': return 'text-success-600 dark:text-success-400'
      case 'error': return 'text-error-600 dark:text-error-400'
      case 'pending': return 'text-warning-600 dark:text-warning-400'
      default: return 'text-slate-600 dark:text-slate-400'
    }
  }

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-success-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-error-500" />
      case 'pending': return <Info className="w-4 h-4 text-warning-500" />
      default: return <Info className="w-4 h-4 text-slate-500" />
    }
  }

  const handleConnect = (integration: Integration) => {
    toast.success(`${integration.name} connection initiated!`)
  }

  const handleTest = (integration: Integration) => {
    toast.loading('Testing connection...', { id: 'test' })
    setTimeout(() => {
      toast.success(`${integration.name} test successful!`, { id: 'test' })
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Integrations</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Connect your bot to popular messaging platforms and services including LINE, WeChat, and more
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {integrations.filter(i => i.status === 'connected').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Connected</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-2xl">
              <Globe className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {integrations.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Available</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-2xl">
              <Zap className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {integrations.filter(i => i.isPopular).length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Popular</p>
            </div>
          </div>
        </div>

        <div className="card p-6 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-accent-100 dark:bg-accent-900/20 rounded-2xl">
              <MessageSquare className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {integrations.filter(i => i.metrics).reduce((sum, i) => sum + (i.metrics?.totalMessages || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Messages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="input-field min-w-40"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="input-field min-w-32"
            >
              <option value="all">All Status</option>
              <option value="connected">Connected</option>
              <option value="disconnected">Disconnected</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>

            <label className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyPopular}
                onChange={(e) => setShowOnlyPopular(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Popular only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon
          const isConnected = integration.status === 'connected'
          
          return (
            <div key={integration.id} className="card p-6 hover-lift group relative">
              {/* Premium Badge */}
              {integration.isPremium && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-medium rounded-lg">
                    Premium
                  </span>
                </div>
              )}

              {/* Popular Badge */}
              {integration.isPopular && !integration.isPremium && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 text-xs font-medium rounded-lg">
                    Popular
                  </span>
                </div>
              )}

              {/* Integration Header */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <Icon className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {integration.description}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2 mb-4">
                {getStatusIcon(integration.status)}
                <span className={`text-sm font-medium ${getStatusColor(integration.status)}`}>
                  {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                </span>
              </div>

              {/* Metrics (if connected) */}
              {isConnected && integration.metrics && (
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {integration.metrics.totalMessages.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {integration.metrics.successRate}%
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Success</div>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {integration.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg"
                    >
                      {feature}
                    </span>
                  ))}
                  {integration.features.length > 3 && (
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-lg">
                      +{integration.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                  <button className="btn-ghost p-2" title="Documentation">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  {isConnected && (
                    <button
                      onClick={() => handleTest(integration)}
                      className="btn-ghost p-2"
                      title="Test connection"
                    >
                      <TestTube className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <>
                      <button className="btn-secondary text-sm px-3 py-1">
                        Configure
                      </button>
                      <button className="btn-ghost text-sm px-3 py-1 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20">
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            No integrations found matching your filters
          </p>
        </div>
      )}
    </div>
  )
}

export default Integrations
