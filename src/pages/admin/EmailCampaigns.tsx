import React, { useState, useEffect, useRef } from 'react'
import {
  Mail,
  Plus,
  Send,
  Users,
  FileText,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Search,
  Download,
  Upload,
  Settings as SettingsIcon,
  CheckCircle,
  Clock,
  XCircle,
  X,
  AlertCircle,
  Info,
  FileSpreadsheet,
  UserPlus
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import CampaignSteps from '../../components/campaigns/CampaignSteps'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed'
  type: 'newsletter' | 'promotional' | 'transactional' | 'welcome'
  recipientCount: number
  openRate?: number
  clickRate?: number
  createdAt: string
  scheduledAt?: string
  sentAt?: string
  emailProvider: string
}

interface Contact {
  email: string
  firstName?: string
  lastName?: string
  company?: string
  tags?: string[]
  customFields?: Record<string, string>
}

interface ImportResult {
  total: number
  successful: number
  failed: number
  duplicates: number
  errors: Array<{
    row: number
    email: string
    error: string
  }>
}

interface EmailTemplate {
  id: string
  name: string
  description: string
  category: 'newsletter' | 'promotional' | 'transactional' | 'welcome'
  thumbnail: string
  htmlContent: string
  variables: string[]
}

interface CampaignForm {
  name: string
  subject: string
  type: 'newsletter' | 'promotional' | 'transactional' | 'welcome'
  templateId: string
  htmlContent: string
  recipientType: 'all' | 'segment' | 'custom'
  recipientCount: number
  selectedTags: string[]
  customRecipients: string[]
  schedulingType: 'now' | 'scheduled'
  scheduledDate?: string
  scheduledTime?: string
  emailProvider: 'sendgrid' | 'mailgun' | 'ses'
  trackOpens: boolean
  trackClicks: boolean
  unsubscribeLink: boolean
}

const EmailCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalRecipients: 0,
    averageOpenRate: 0,
    averageClickRate: 0
  })

  // Import Contacts Modal State
  const [showImportModal, setShowImportModal] = useState(false)
  const [importStep, setImportStep] = useState(1) // 1: Upload, 2: Preview, 3: Results
  const [, setSelectedFile] = useState<File | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create Campaign Modal State
  const [createStep, setCreateStep] = useState(1) // 1: Basic Info, 2: Template, 3: Recipients, 4: Schedule, 5: Review
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({
    name: '',
    subject: '',
    type: 'newsletter',
    templateId: '',
    htmlContent: '',
    recipientType: 'all',
    recipientCount: 0,
    selectedTags: [],
    customRecipients: [],
    schedulingType: 'now',
    scheduledDate: '',
    scheduledTime: '',
    emailProvider: 'sendgrid',
    trackOpens: true,
    trackClicks: true,
    unsubscribeLink: true
  })
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [availableTags] = useState<string[]>(['customer', 'prospect', 'vip', 'newsletter', 'promotional'])

  // Contact List State
  const [showContactList, setShowContactList] = useState(false)
  const [contactList, setContactList] = useState<Contact[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [contactTagFilter, setContactTagFilter] = useState<string>('all')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [contactsPerPage] = useState(10)

  // Sample data - will be replaced with API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const sampleCampaigns: EmailCampaign[] = [
        {
          id: '1',
          name: 'Weekly Newsletter #45',
          subject: 'Latest Updates from Our Bookstore',
          status: 'sent',
          type: 'newsletter',
          recipientCount: 1250,
          openRate: 28.5,
          clickRate: 4.2,
          createdAt: '2024-01-15T10:00:00Z',
          sentAt: '2024-01-15T14:00:00Z',
          emailProvider: 'sendgrid'
        },
        {
          id: '2',
          name: 'New Book Arrivals',
          subject: 'Discover Amazing New Books This Week',
          status: 'scheduled',
          type: 'promotional',
          recipientCount: 890,
          createdAt: '2024-01-16T09:00:00Z',
          scheduledAt: '2024-01-18T10:00:00Z',
          emailProvider: 'mailgun'
        },
        {
          id: '3',
          name: 'Welcome Series - Part 1',
          subject: 'Welcome to Amarin Book Center!',
          status: 'sending',
          type: 'welcome',
          recipientCount: 45,
          createdAt: '2024-01-16T15:00:00Z',
          emailProvider: 'ses'
        },
        {
          id: '4',
          name: 'Flash Sale Alert',
          subject: '50% Off Selected Books - Limited Time!',
          status: 'draft',
          type: 'promotional',
          recipientCount: 0,
          createdAt: '2024-01-16T16:00:00Z',
          emailProvider: 'sendgrid'
        }
      ]

      setCampaigns(sampleCampaigns)

      // Calculate stats
      const totalSent = sampleCampaigns.filter(c => c.status === 'sent')
      setStats({
        totalCampaigns: sampleCampaigns.length,
        totalRecipients: sampleCampaigns.reduce((sum, c) => sum + c.recipientCount, 0),
        averageOpenRate: totalSent.reduce((sum, c) => sum + (c.openRate || 0), 0) / totalSent.length || 0,
        averageClickRate: totalSent.reduce((sum, c) => sum + (c.clickRate || 0), 0) / totalSent.length || 0
      })

      setIsLoading(false)
    }, 1000)

    // Load email templates
    loadTemplates()
    
    // Load sample contacts
    loadContacts()
  }, [])

  const loadContacts = () => {
    setContactsLoading(true)
    // Simulate API call
    setTimeout(() => {
      const sampleContacts: Contact[] = [
        {
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          company: 'Acme Corp',
          tags: ['customer', 'vip'],
          customFields: { 'Phone': '+1-555-0123', 'Industry': 'Technology' }
        },
        {
          email: 'jane.smith@techcorp.com',
          firstName: 'Jane',
          lastName: 'Smith',
          company: 'Tech Corp',
          tags: ['prospect', 'newsletter'],
          customFields: { 'Phone': '+1-555-0124', 'Industry': 'Software' }
        },
        {
          email: 'bob.johnson@startup.io',
          firstName: 'Bob',
          lastName: 'Johnson',
          company: 'Startup Inc',
          tags: ['customer', 'promotional'],
          customFields: { 'Phone': '+1-555-0125', 'Industry': 'Fintech' }
        },
        {
          email: 'alice.wilson@enterprise.com',
          firstName: 'Alice',
          lastName: 'Wilson',
          company: 'Enterprise Solutions',
          tags: ['vip', 'customer'],
          customFields: { 'Phone': '+1-555-0126', 'Industry': 'Enterprise' }
        },
        {
          email: 'charlie.brown@marketing.co',
          firstName: 'Charlie',
          lastName: 'Brown',
          company: 'Marketing Co',
          tags: ['prospect'],
          customFields: { 'Phone': '+1-555-0127', 'Industry': 'Marketing' }
        },
        {
          email: 'diana.prince@consulting.net',
          firstName: 'Diana',
          lastName: 'Prince',
          company: 'Consulting Group',
          tags: ['customer', 'newsletter'],
          customFields: { 'Phone': '+1-555-0128', 'Industry': 'Consulting' }
        },
        {
          email: 'edward.clark@retail.com',
          firstName: 'Edward',
          lastName: 'Clark',
          company: 'Retail Plus',
          tags: ['promotional'],
          customFields: { 'Phone': '+1-555-0129', 'Industry': 'Retail' }
        },
        {
          email: 'fiona.green@healthcare.org',
          firstName: 'Fiona',
          lastName: 'Green',
          company: 'Healthcare Systems',
          tags: ['customer', 'vip', 'newsletter'],
          customFields: { 'Phone': '+1-555-0130', 'Industry': 'Healthcare' }
        },
        {
          email: 'george.white@finance.biz',
          firstName: 'George',
          lastName: 'White',
          company: 'Finance Group',
          tags: ['prospect', 'vip'],
          customFields: { 'Phone': '+1-555-0131', 'Industry': 'Finance' }
        },
        {
          email: 'helen.taylor@education.edu',
          firstName: 'Helen',
          lastName: 'Taylor',
          company: 'Education Institute',
          tags: ['customer'],
          customFields: { 'Phone': '+1-555-0132', 'Industry': 'Education' }
        }
      ]
      setContactList(sampleContacts)
      setContactsLoading(false)
    }, 1000)
  }

  const loadTemplates = () => {
    const sampleTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Newsletter Template',
        description: 'Clean and professional newsletter layout',
        category: 'newsletter',
        thumbnail: '/api/placeholder/300/200',
        htmlContent: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <header style="background: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1>{{company_name}}</h1>
            </header>
            <main style="padding: 20px;">
              <h2>{{campaign_title}}</h2>
              <p>{{main_content}}</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="{{cta_link}}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">{{cta_text}}</a>
              </div>
            </main>
            <footer style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
              <p>© {{year}} {{company_name}}. All rights reserved.</p>
              <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
            </footer>
          </div>
        `,
        variables: ['company_name', 'campaign_title', 'main_content', 'cta_link', 'cta_text', 'year', 'unsubscribe_link']
      },
      {
        id: '2',
        name: 'Promotional Sale',
        description: 'Eye-catching promotional template with discount focus',
        category: 'promotional',
        thumbnail: '/api/placeholder/300/200',
        htmlContent: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: linear-gradient(135deg, #ff6b6b, #ffd93d);">
            <div style="padding: 30px; text-align: center; color: white;">
              <h1 style="font-size: 36px; margin-bottom: 10px;">{{discount_percentage}}% OFF!</h1>
              <h2 style="font-size: 24px; margin-bottom: 20px;">{{sale_title}}</h2>
              <p style="font-size: 18px; margin-bottom: 30px;">{{sale_description}}</p>
              <div style="background: white; color: #333; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="font-size: 16px; margin-bottom: 15px;">{{product_details}}</p>
                <a href="{{shop_link}}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 18px;">SHOP NOW</a>
              </div>
              <p style="font-size: 14px; margin-top: 20px;">Use code: <strong>{{promo_code}}</strong></p>
            </div>
          </div>
        `,
        variables: ['discount_percentage', 'sale_title', 'sale_description', 'product_details', 'shop_link', 'promo_code']
      },
      {
        id: '3',
        name: 'Welcome Email',
        description: 'Warm welcome template for new subscribers',
        category: 'welcome',
        thumbnail: '/api/placeholder/300/200',
        htmlContent: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <div style="text-align: center; padding: 40px 20px;">
              <h1 style="color: #2563eb; font-size: 32px; margin-bottom: 20px;">Welcome to {{company_name}}!</h1>
              <p style="font-size: 18px; color: #374151; margin-bottom: 30px;">Hi {{first_name}}, we're thrilled to have you join our community!</p>
              <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin: 30px 0;">
                <h3 style="color: #1f2937; margin-bottom: 15px;">Here's what you can expect:</h3>
                <ul style="text-align: left; color: #4b5563; line-height: 1.6;">
                  <li>{{benefit_1}}</li>
                  <li>{{benefit_2}}</li>
                  <li>{{benefit_3}}</li>
                </ul>
              </div>
              <a href="{{get_started_link}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Get Started</a>
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Need help? <a href="{{support_link}}">Contact our support team</a></p>
            </div>
          </div>
        `,
        variables: ['company_name', 'first_name', 'benefit_1', 'benefit_2', 'benefit_3', 'get_started_link', 'support_link']
      },
      {
        id: '4',
        name: 'Simple Text',
        description: 'Clean text-based template for professional communications',
        category: 'transactional',
        thumbnail: '/api/placeholder/300/200',
        htmlContent: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 40px 20px; color: #374151;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">{{email_title}}</h2>
            <p style="line-height: 1.6; margin-bottom: 20px;">{{email_content}}</p>
            <div style="border-left: 4px solid #2563eb; padding-left: 20px; margin: 30px 0; background: #f8fafc; padding: 20px;">
              <p style="margin: 0; font-style: italic;">{{quote_or_highlight}}</p>
            </div>
            <p style="line-height: 1.6; margin-bottom: 30px;">{{closing_content}}</p>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br>{{sender_name}}<br>{{company_name}}</p>
            </div>
          </div>
        `,
        variables: ['email_title', 'email_content', 'quote_or_highlight', 'closing_content', 'sender_name', 'company_name']
      }
    ]
    setTemplates(sampleTemplates)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-500" />
      case 'sending': return <Play className="w-4 h-4 text-orange-500" />
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'sending': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Import Contacts Functions
  const handleFileSelect = (file: File) => {
    if (!file) return

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload a CSV or Excel file')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    parseFile(file)
  }

  const parseFile = async (file: File) => {
    try {
      setIsImporting(true)
      const text = await file.text()
      
      if (file.name.endsWith('.csv')) {
        parseCsvFile(text)
      } else {
        toast.error('Excel files are not yet supported. Please use CSV format.')
        return
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      toast.error('Error parsing file. Please check the format.')
    } finally {
      setIsImporting(false)
    }
  }

  const parseCsvFile = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      toast.error('File must contain at least a header row and one data row')
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const parsedContacts: Contact[] = []
    const errors: Array<{row: number, email: string, error: string}> = []

    // Validate required email column
    const emailIndex = headers.findIndex(h => 
      h.toLowerCase().includes('email') || 
      h.toLowerCase().includes('e-mail') ||
      h.toLowerCase().includes('mail')
    )

    if (emailIndex === -1) {
      toast.error('Email column not found. Please include an "Email" column.')
      return
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''))
      const email = row[emailIndex]?.toLowerCase()

      if (!email) {
        errors.push({ row: i + 1, email: '', error: 'Empty email address' })
        continue
      }

      if (!isValidEmail(email)) {
        errors.push({ row: i + 1, email, error: 'Invalid email format' })
        continue
      }

      const contact: Contact = {
        email,
        firstName: getColumnValue(headers, row, ['first name', 'firstname', 'fname']),
        lastName: getColumnValue(headers, row, ['last name', 'lastname', 'lname']),
        company: getColumnValue(headers, row, ['company', 'organization', 'org']),
        tags: getColumnValue(headers, row, ['tags'])?.split(';').map(t => t.trim()).filter(Boolean),
        customFields: {}
      }

      // Add any additional columns as custom fields
      headers.forEach((header, index) => {
        if (!['email', 'first name', 'firstname', 'fname', 'last name', 'lastname', 'lname', 'company', 'organization', 'org', 'tags'].includes(header.toLowerCase()) && row[index]) {
          contact.customFields![header] = row[index]
        }
      })

      parsedContacts.push(contact)
    }

    setContacts(parsedContacts)
    setImportStep(2)

    if (errors.length > 0) {
      console.warn('Import errors:', errors)
      toast(`${errors.length} rows had errors and were skipped`, {
        icon: '⚠️',
        style: {
          background: '#fbbf24',
          color: '#92400e',
        },
      })
    }

    toast.success(`${parsedContacts.length} contacts parsed successfully`)
  }

  const getColumnValue = (headers: string[], row: string[], possibleNames: string[]): string | undefined => {
    for (const name of possibleNames) {
      const index = headers.findIndex(h => h.toLowerCase() === name)
      if (index !== -1 && row[index]) {
        return row[index]
      }
    }
    return undefined
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleImportContacts = async () => {
    try {
      setIsImporting(true)
      
      // Simulate API call to import contacts
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate some duplicates and errors
      const duplicates = Math.floor(contacts.length * 0.1) // 10% duplicates
      const failed = Math.floor(contacts.length * 0.05) // 5% failed
      const successful = contacts.length - duplicates - failed

      const result: ImportResult = {
        total: contacts.length,
        successful,
        failed,
        duplicates,
        errors: contacts.slice(0, failed).map((contact, index) => ({
          row: index + 1,
          email: contact.email,
          error: 'Email already exists in system'
        }))
      }

      setImportResult(result)
      setImportStep(3)
      
      toast.success(`Successfully imported ${successful} contacts`)
    } catch (error) {
      console.error('Error importing contacts:', error)
      toast.error('Error importing contacts. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const resetImportModal = () => {
    setShowImportModal(false)
    setImportStep(1)
    setSelectedFile(null)
    setContacts([])
    setImportResult(null)
    setIsImporting(false)
    setDragActive(false)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // Create Campaign Functions
  const updateCampaignForm = (updates: Partial<CampaignForm>) => {
    setCampaignForm(prev => ({ ...prev, ...updates }))
  }

  const handleTemplateSelect = (template: EmailTemplate) => {
    updateCampaignForm({
      templateId: template.id,
      htmlContent: template.htmlContent,
      type: template.category
    })
    setCreateStep(3) // Move to recipients step
  }

  const calculateRecipientCount = () => {
    if (campaignForm.recipientType === 'all') {
      return 1250 // Mock total contacts
    } else if (campaignForm.recipientType === 'segment') {
      return campaignForm.selectedTags.length * 200 // Mock calculation
    } else {
      return campaignForm.customRecipients.length
    }
  }

  const handleCreateCampaign = async () => {
    try {
      setIsCreating(true)
      
      // Validate form
      if (!campaignForm.name.trim()) {
        toast.error('Campaign name is required')
        return
      }
      if (!campaignForm.subject.trim()) {
        toast.error('Email subject is required')
        return
      }
      if (!campaignForm.templateId) {
        toast.error('Please select a template')
        return
      }

      // Calculate final recipient count
      const recipientCount = calculateRecipientCount()
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create new campaign object
      const newCampaign: EmailCampaign = {
        id: Date.now().toString(),
        name: campaignForm.name,
        subject: campaignForm.subject,
        status: campaignForm.schedulingType === 'now' ? 'sending' : 'scheduled',
        type: campaignForm.type,
        recipientCount,
        createdAt: new Date().toISOString(),
        scheduledAt: campaignForm.schedulingType === 'scheduled' 
          ? new Date(`${campaignForm.scheduledDate}T${campaignForm.scheduledTime}`).toISOString()
          : undefined,
        emailProvider: campaignForm.emailProvider
      }

      // Add to campaigns list
      setCampaigns(prev => [newCampaign, ...prev])
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalCampaigns: prev.totalCampaigns + 1,
        totalRecipients: prev.totalRecipients + recipientCount
      }))

      toast.success(`Campaign "${campaignForm.name}" created successfully!`)
      resetCreateModal()
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const resetCreateModal = () => {
    setShowCreateModal(false)
    setCreateStep(1)
    setCampaignForm({
      name: '',
      subject: '',
      type: 'newsletter',
      templateId: '',
      htmlContent: '',
      recipientType: 'all',
      recipientCount: 0,
      selectedTags: [],
      customRecipients: [],
      schedulingType: 'now',
      scheduledDate: '',
      scheduledTime: '',
      emailProvider: 'sendgrid',
      trackOpens: true,
      trackClicks: true,
      unsubscribeLink: true
    })
    setIsCreating(false)
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Basic Information'
      case 2: return 'Choose Template'
      case 3: return 'Select Recipients'
      case 4: return 'Schedule & Settings'
      case 5: return 'Review & Send'
      default: return 'Create Campaign'
    }
  }

  // Contact List Functions
  const filteredContacts = contactList.filter(contact => {
    const matchesSearch = 
      contact.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.firstName?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.company?.toLowerCase().includes(contactSearch.toLowerCase())
    
    const matchesTag = contactTagFilter === 'all' || contact.tags?.includes(contactTagFilter)
    
    return matchesSearch && matchesTag
  })

  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * contactsPerPage,
    currentPage * contactsPerPage
  )

  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage)

  const handleSelectContact = (email: string) => {
    setSelectedContacts(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    )
  }

  const handleSelectAllContacts = () => {
    if (selectedContacts.length === paginatedContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(paginatedContacts.map(contact => contact.email))
    }
  }

  const handleBulkDelete = () => {
    if (selectedContacts.length === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) {
      setContactList(prev => prev.filter(contact => !selectedContacts.includes(contact.email)))
      setSelectedContacts([])
      toast.success(`${selectedContacts.length} contacts deleted successfully`)
    }
  }

  const handleDeleteContact = (email: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContactList(prev => prev.filter(contact => contact.email !== email))
      toast.success('Contact deleted successfully')
    }
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'prospect': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'vip': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'newsletter': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'promotional': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading campaigns...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Mail className="w-8 h-8 mr-3 text-primary-600" />
            Email Campaigns
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage bulk email campaigns for your customers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center px-6 py-3"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Campaign
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCampaigns}</p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-xl">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Recipients</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRecipients.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Open Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageOpenRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Click Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageClickRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="paused">Paused</option>
              <option value="failed">Failed</option>
            </select>

            <button className="btn-ghost px-4 py-2 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {campaign.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {campaign.subject}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 capitalize">
                        {campaign.type}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(campaign.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {campaign.recipientCount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {campaign.openRate !== undefined && campaign.clickRate !== undefined ? (
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white">
                          Open: {campaign.openRate}%
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          Click: {campaign.clickRate}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {campaign.emailProvider}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(campaign.sentAt || campaign.scheduledAt || campaign.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(campaign.sentAt || campaign.scheduledAt || campaign.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedCampaign(campaign)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Edit Campaign"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {campaign.status === 'draft' && (
                        <button
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Send Campaign"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No campaigns found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first email campaign'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Campaign
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Upload className="w-6 h-6 text-blue-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Import Contacts</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Upload recipient lists</div>
            </div>
          </button>

          <button 
            onClick={() => setShowContactList(true)}
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Users className="w-6 h-6 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">View Contacts</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Manage contact lists</div>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <BarChart3 className="w-6 h-6 text-orange-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Analytics Report</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">View detailed metrics</div>
            </div>
          </button>

          <button className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <SettingsIcon className="w-6 h-6 text-purple-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">Email Settings</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Configure providers</div>
            </div>
          </button>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {getStepTitle(createStep)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Step {createStep} of 5
                </p>
              </div>
              <button
                onClick={resetCreateModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Progress */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      createStep >= step 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {step}
                    </div>
                    {step < 5 && (
                      <div className={`h-1 w-8 mx-2 ${
                        createStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <CampaignSteps
                step={createStep}
                campaignForm={campaignForm}
                templates={templates}
                availableTags={availableTags}
                updateCampaignForm={updateCampaignForm}
                handleTemplateSelect={handleTemplateSelect}
                calculateRecipientCount={calculateRecipientCount}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {createStep > 1 && (
                  <button
                    onClick={() => setCreateStep(createStep - 1)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    ← Previous
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={resetCreateModal}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                {createStep < 5 ? (
                  <button
                    onClick={() => setCreateStep(createStep + 1)}
                    disabled={
                      (createStep === 1 && (!campaignForm.name || !campaignForm.subject)) ||
                      (createStep === 2 && !campaignForm.templateId) ||
                      (createStep === 4 && campaignForm.schedulingType === 'scheduled' && (!campaignForm.scheduledDate || !campaignForm.scheduledTime))
                    }
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleCreateCampaign}
                    disabled={isCreating}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg flex items-center"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {campaignForm.schedulingType === 'now' ? 'Sending...' : 'Scheduling...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {campaignForm.schedulingType === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Modal Placeholder */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Campaign Details
              </h3>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{selectedCampaign.name}</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedCampaign.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <div className="flex items-center mt-1">
                    {getStatusIcon(selectedCampaign.status)}
                    <span className="ml-2 capitalize">{selectedCampaign.status}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Recipients:</span>
                  <p className="font-medium">{selectedCampaign.recipientCount.toLocaleString()}</p>
                </div>
              </div>

              {selectedCampaign.openRate !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Open Rate:</span>
                    <p className="font-medium">{selectedCampaign.openRate}%</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Click Rate:</span>
                    <p className="font-medium">{selectedCampaign.clickRate}%</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Contacts Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Import Contacts
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Step {importStep} of 3
                </p>
              </div>
              <button
                onClick={resetImportModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Progress */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center ${importStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${importStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Upload File</span>
                </div>
                <div className={`h-1 w-16 ${importStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center ${importStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${importStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Preview & Validate</span>
                </div>
                <div className={`h-1 w-16 ${importStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center ${importStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${importStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">Import Results</span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Step 1: Upload File */}
              {importStep === 1 && (
                <div className="space-y-6">
                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {isImporting ? (
                      <div className="space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400">Processing file...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            Drop your file here, or{' '}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="text-blue-600 hover:text-blue-500"
                            >
                              browse
                            </button>
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Supports CSV files up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />

                  {/* File Format Information */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Supported File Format
                        </h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                          <p><strong>Required Column:</strong> Email (or variations like "E-mail", "Mail")</p>
                          <p><strong>Optional Columns:</strong> First Name, Last Name, Company, Tags (semicolon-separated)</p>
                          <p><strong>Custom Fields:</strong> Any additional columns will be imported as custom fields</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sample CSV Template */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Sample CSV Format
                      </h4>
                      <button 
                        onClick={() => {
                          const csvContent = 'Email,First Name,Last Name,Company,Tags\njohn@example.com,John,Doe,Acme Corp,customer;vip\njane@example.com,Jane,Smith,Tech Inc,prospect'
                          const blob = new Blob([csvContent], { type: 'text/csv' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'contacts_template.csv'
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download Template
                      </button>
                    </div>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
{`Email,First Name,Last Name,Company,Tags
john@example.com,John,Doe,Acme Corp,customer;vip
jane@example.com,Jane,Smith,Tech Inc,prospect`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Step 2: Preview & Validate */}
              {importStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Preview Contacts ({contacts.length} found)
                    </h4>
                    <button
                      onClick={() => setImportStep(1)}
                      className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ← Back to Upload
                    </button>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Company</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tags</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {contacts.slice(0, 10).map((contact, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{contact.email}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {[contact.firstName, contact.lastName].filter(Boolean).join(' ') || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{contact.company || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {contact.tags && contact.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {contact.tags.slice(0, 2).map((tag, tagIndex) => (
                                      <span key={tagIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                    {contact.tags.length > 2 && (
                                      <span className="text-xs text-gray-500">+{contact.tags.length - 2}</span>
                                    )}
                                  </div>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {contacts.length > 10 && (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                        Showing first 10 of {contacts.length} contacts
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Import Results */}
              {importStep === 3 && importResult && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Import Completed!
                    </h4>
                  </div>

                  {/* Results Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                      <div className="text-sm text-blue-800 dark:text-blue-200">Total Processed</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                      <div className="text-sm text-green-800 dark:text-green-200">Successfully Added</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">Duplicates Skipped</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                      <div className="text-sm text-red-800 dark:text-red-200">Failed</div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                      <h5 className="font-medium text-red-900 dark:text-red-100 mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Import Errors ({importResult.errors.length})
                      </h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-800 dark:text-red-200">
                            Row {error.row}: {error.email} - {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {importStep === 2 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contacts.length} contacts ready to import
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={resetImportModal}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {importStep === 3 ? 'Close' : 'Cancel'}
                </button>
                {importStep === 2 && (
                  <button
                    onClick={handleImportContacts}
                    disabled={isImporting || contacts.length === 0}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Import {contacts.length} Contacts
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact List Modal */}
      {showContactList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Contact Management
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredContacts.length} contacts found
                </p>
              </div>
              <button
                onClick={() => setShowContactList(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search contacts by name, email, or company..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={contactTagFilter}
                    onChange={(e) => setContactTagFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Tags</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  {selectedContacts.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected ({selectedContacts.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Table */}
            <div className="p-6">
              {contactsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedContacts.length === paginatedContacts.length && paginatedContacts.length > 0}
                            onChange={handleSelectAllContacts}
                            className="rounded"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tags</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Custom Fields</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedContacts.map((contact) => (
                        <tr key={contact.email} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact.email)}
                              onChange={() => handleSelectContact(contact.email)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {[contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{contact.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {contact.company || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {contact.tags && contact.tags.length > 0 ? (
                                contact.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className={`px-2 py-1 text-xs rounded-full ${getTagColor(tag)}`}
                                  >
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">No tags</span>
                              )}
                              {contact.tags && contact.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{contact.tags.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {contact.customFields && Object.keys(contact.customFields).length > 0 ? (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {Object.entries(contact.customFields).slice(0, 2).map(([key, value]) => (
                                  <div key={key}>
                                    <strong>{key}:</strong> {value}
                                  </div>
                                ))}
                                {Object.keys(contact.customFields).length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{Object.keys(contact.customFields).length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">None</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {/* TODO: Edit contact */}}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit contact"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.email)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete contact"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredContacts.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {contactSearch || contactTagFilter !== 'all' 
                          ? 'No contacts match your search criteria'
                          : 'No contacts found. Import some contacts to get started.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((currentPage - 1) * contactsPerPage) + 1} to {Math.min(currentPage * contactsPerPage, filteredContacts.length)} of {filteredContacts.length} contacts
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 border rounded text-sm ${
                            currentPage === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total: {contactList.length} contacts
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowContactList(false)
                    setShowImportModal(true)
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import More Contacts
                </button>
                <button
                  onClick={() => setShowContactList(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmailCampaigns