import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { addBot, BotTemplate, BotType } from '../../store/slices/botSlice'
import { X, Filter, Headphones, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BotCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onBotCreated?: (botId: string) => void
}

const BotCreationModal = ({ isOpen, onClose, onBotCreated }: BotCreationModalProps) => {
  const dispatch = useDispatch()
  const { templates } = useSelector((state: RootState) => state.bots)
  const [step, setStep] = useState<'select-type' | 'select-method' | 'create-custom' | 'select-template'>('select-type')
  const [selectedType, setSelectedType] = useState<BotType | null>(null)

  const [customBotName, setCustomBotName] = useState('')

  if (!isOpen) return null

  const botTypes = [
    {
      type: 'lead_generation' as BotType,
      name: 'Lead Generation Bot',
      description: 'Any Data Collection Bot',
      icon: Filter,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      type: 'customer_support' as BotType,
      name: 'Customer Support Bot',
      description: 'Help customers with their queries',
      icon: Headphones,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  ]

  const handleTypeSelect = (type: BotType) => {
    setSelectedType(type)
    setStep('select-method')
  }

  const handleTemplateSelect = () => {
    setStep('select-template')
  }

  const handleCustomSelect = () => {
    setStep('create-custom')
  }

  const handleTemplateChoice = (template: BotTemplate) => {
    createBotFromTemplate(template)
  }

  const createBotFromTemplate = (template: BotTemplate) => {
    const newBot = {
      name: template.name,
      description: template.description,
      type: template.type,
      status: 'draft' as const,
      templateId: template.id,
      flow: {
        id: `flow-${Date.now()}`,
        name: 'Main Flow',
        description: 'Primary conversation flow',
        nodes: [
          {
            id: 'start',
            type: 'message' as const,
            position: { x: 100, y: 100 },
            data: {
              title: 'Welcome Message',
              content: template.preview.messages[0]?.content || 'Hello! How can I help you today?'
            }
          }
        ],
        connections: []
      },
      settings: {
        personality: {
          tone: 'friendly' as const,
          style: 'conversational' as const,
          language: 'en'
        },
        behavior: {
          responseDelay: 1000,
          typingIndicator: true,
          fallbackMessage: 'I didn\'t understand that. Can you rephrase?',
          maxRetries: 3,
          handoffTriggers: ['human', 'agent', 'speak to someone']
        },
        appearance: {
          avatar: '',
          name: template.name,
          welcomeMessage: template.preview.messages[0]?.content || 'Hello! How can I help you today?',
          theme: {
            primaryColor: '#3B82F6',
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937'
          }
        },
        integrations: {
          platforms: ['website' as const],
          webhooks: [],
          crm: {
            enabled: false
          }
        }
      },
      createdBy: '1',
      isPublished: false,
      version: '1.0.0'
    }

    dispatch(addBot(newBot))
    toast.success(`${template.name} created successfully!`)
    onClose()
    if (onBotCreated) {
      onBotCreated(Date.now().toString())
    }
  }

  const handleCustomBotCreate = () => {
    if (!customBotName.trim()) {
      toast.error('Please enter a bot name')
      return
    }

    const newBot = {
      name: customBotName,
      description: `Custom ${selectedType?.replace('_', ' ')} bot`,
      type: selectedType || 'custom' as BotType,
      status: 'draft' as const,
      flow: {
        id: `flow-${Date.now()}`,
        name: 'Main Flow',
        description: 'Primary conversation flow',
        nodes: [
          {
            id: 'start',
            type: 'message' as const,
            position: { x: 100, y: 100 },
            data: {
              title: 'Welcome Message',
              content: 'Hello! How can I help you today?'
            }
          }
        ],
        connections: []
      },
      settings: {
        personality: {
          tone: 'friendly' as const,
          style: 'conversational' as const,
          language: 'en'
        },
        behavior: {
          responseDelay: 1000,
          typingIndicator: true,
          fallbackMessage: 'I didn\'t understand that. Can you rephrase?',
          maxRetries: 3,
          handoffTriggers: ['human', 'agent', 'speak to someone']
        },
        appearance: {
          avatar: '',
          name: customBotName,
          welcomeMessage: 'Hello! How can I help you today?',
          theme: {
            primaryColor: '#3B82F6',
            backgroundColor: '#FFFFFF',
            textColor: '#1F2937'
          }
        },
        integrations: {
          platforms: ['website' as const],
          webhooks: [],
          crm: {
            enabled: false
          }
        }
      },
      createdBy: '1',
      isPublished: false,
      version: '1.0.0'
    }

    dispatch(addBot(newBot))
    toast.success(`${customBotName} created successfully!`)
    onClose()
    if (onBotCreated) {
      onBotCreated(Date.now().toString())
    }
  }

  const getFilteredTemplates = () => {
    return templates.filter(template => 
      !selectedType || template.type === selectedType
    )
  }

  const renderStepContent = () => {
    switch (step) {
      case 'select-type':
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Create Bot
              </h3>
            </div>

            <div className="space-y-4">
              {botTypes.map((botType) => {
                const Icon = botType.icon
                return (
                  <button
                    key={botType.type}
                    onClick={() => handleTypeSelect(botType.type)}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 hover:shadow-lg group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-2xl ${botType.bgColor}`}>
                        <Icon className={`w-6 h-6 ${botType.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          {botType.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {botType.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'select-method':
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Create Bot
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Creating a <span className="font-medium">{selectedType?.replace('_', ' ')}</span> is just a matter of seconds now.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleTemplateSelect}
                className="w-full btn-primary text-center py-4"
              >
                Pick From Templates
              </button>
              
              <div className="text-center text-slate-500 dark:text-slate-400 font-medium">
                OR
              </div>
              
              <button
                onClick={handleCustomSelect}
                className="w-full btn-secondary text-center py-4"
              >
                Create Your Own Bot
              </button>
            </div>
          </div>
        )

      case 'select-template':
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Choose Template
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Select a template to get started quickly
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {getFilteredTemplates().map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateChoice(template)}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200 hover:shadow-lg group text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl">{template.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          {template.name}
                        </h4>
                        {template.isPopular && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 text-xs font-medium rounded-lg">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {template.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1">
                          <BarChart3 className="w-3 h-3" />
                          <span>{template.complexity}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{template.estimatedTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStep('select-method')}
                className="btn-secondary w-full"
              >
                Back
              </button>
            </div>
          </div>
        )

      case 'create-custom':
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Create New Bot
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Enter a name for your Bot
                </label>
                <input
                  type="text"
                  value={customBotName}
                  onChange={(e) => setCustomBotName(e.target.value)}
                  placeholder="My Awesome Bot"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setStep('select-method')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomBotCreate}
                  disabled={!customBotName.trim()}
                  className="btn-primary flex-1"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div></div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="overflow-y-auto">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}

// Clock icon component (since it's not imported)
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default BotCreationModal
