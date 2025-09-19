import React from 'react'
import {
  Info,
  FileText,
  CheckCircle
} from 'lucide-react'

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

interface CampaignStepsProps {
  step: number
  campaignForm: CampaignForm
  templates: EmailTemplate[]
  availableTags: string[]
  updateCampaignForm: (updates: Partial<CampaignForm>) => void
  handleTemplateSelect: (template: EmailTemplate) => void
  calculateRecipientCount: () => number
}

export const CampaignSteps: React.FC<CampaignStepsProps> = ({
  step,
  campaignForm,
  templates,
  availableTags,
  updateCampaignForm,
  handleTemplateSelect,
  calculateRecipientCount
}) => {
  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={campaignForm.name}
              onChange={(e) => updateCampaignForm({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Enter campaign name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Campaign Type
            </label>
            <select
              value={campaignForm.type}
              onChange={(e) => updateCampaignForm({ type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="newsletter">Newsletter</option>
              <option value="promotional">Promotional</option>
              <option value="welcome">Welcome</option>
              <option value="transactional">Transactional</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Subject *
          </label>
          <input
            type="text"
            value={campaignForm.subject}
            onChange={(e) => updateCampaignForm({ subject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email subject line"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Campaign Tips
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Keep subject lines under 50 characters for better open rates</li>
                <li>• Use action words and create urgency</li>
                <li>• Personalize when possible (we'll add merge tags later)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Choose Your Email Template
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Select a template that matches your campaign type: {campaignForm.type}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates
            .filter(template => !campaignForm.type || template.category === campaignForm.type)
            .map((template) => (
              <div
                key={template.id}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  campaignForm.templateId === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                  {template.name}
                </h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.category === 'newsletter' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    template.category === 'promotional' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    template.category === 'welcome' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {template.category}
                  </span>
                  {campaignForm.templateId === template.id && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
        </div>

        {templates.filter(t => !campaignForm.type || t.category === campaignForm.type).length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No templates available for {campaignForm.type} campaigns.
            </p>
          </div>
        )}
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Who should receive this campaign?
          </h4>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="recipientType"
                value="all"
                checked={campaignForm.recipientType === 'all'}
                onChange={(e) => updateCampaignForm({ recipientType: e.target.value as any })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">All Contacts</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Send to all contacts in your database (~1,250 contacts)</div>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="recipientType"
                value="segment"
                checked={campaignForm.recipientType === 'segment'}
                onChange={(e) => updateCampaignForm({ recipientType: e.target.value as any })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">Segmented Audience</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Send to contacts with specific tags</div>
                {campaignForm.recipientType === 'segment' && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <label key={tag} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={campaignForm.selectedTags.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateCampaignForm({ selectedTags: [...campaignForm.selectedTags, tag] })
                              } else {
                                updateCampaignForm({ selectedTags: campaignForm.selectedTags.filter(t => t !== tag) })
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                            {tag}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </label>

            <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="recipientType"
                value="custom"
                checked={campaignForm.recipientType === 'custom'}
                onChange={(e) => updateCampaignForm({ recipientType: e.target.value as any })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">Custom List</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Enter specific email addresses</div>
                {campaignForm.recipientType === 'custom' && (
                  <div className="mt-3">
                    <textarea
                      value={campaignForm.customRecipients.join('\n')}
                      onChange={(e) => updateCampaignForm({ customRecipients: e.target.value.split('\n').filter(Boolean) })}
                      placeholder="Enter email addresses, one per line"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Estimated Recipients:
              </span>
              <span className="text-lg font-bold text-blue-600">
                {calculateRecipientCount().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            When should this campaign be sent?
          </h4>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="schedulingType"
                value="now"
                checked={campaignForm.schedulingType === 'now'}
                onChange={(e) => updateCampaignForm({ schedulingType: e.target.value as any })}
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Send Now</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Campaign will be sent immediately after creation</div>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="schedulingType"
                value="scheduled"
                checked={campaignForm.schedulingType === 'scheduled'}
                onChange={(e) => updateCampaignForm({ schedulingType: e.target.value as any })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">Schedule for Later</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Choose a specific date and time</div>
                {campaignForm.schedulingType === 'scheduled' && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={campaignForm.scheduledDate}
                        onChange={(e) => updateCampaignForm({ scheduledDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={campaignForm.scheduledTime}
                        onChange={(e) => updateCampaignForm({ scheduledTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Provider
            </label>
            <select
              value={campaignForm.emailProvider}
              onChange={(e) => updateCampaignForm({ emailProvider: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="sendgrid">SendGrid</option>
              <option value="mailgun">Mailgun</option>
              <option value="ses">Amazon SES</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tracking Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={campaignForm.trackOpens}
                  onChange={(e) => updateCampaignForm({ trackOpens: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Track email opens</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={campaignForm.trackClicks}
                  onChange={(e) => updateCampaignForm({ trackClicks: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Track link clicks</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={campaignForm.unsubscribeLink}
                  onChange={(e) => updateCampaignForm({ unsubscribeLink: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Include unsubscribe link</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 5) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Review Your Campaign
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Double-check all details before sending
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Campaign Details</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="text-gray-900 dark:text-white">{campaignForm.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                  <span className="text-gray-900 dark:text-white">{campaignForm.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-gray-900 dark:text-white capitalize">{campaignForm.type}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Recipients</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-gray-900 dark:text-white capitalize">{campaignForm.recipientType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Count:</span>
                  <span className="text-gray-900 dark:text-white">{calculateRecipientCount().toLocaleString()}</span>
                </div>
                {campaignForm.recipientType === 'segment' && campaignForm.selectedTags.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tags:</span>
                    <span className="text-gray-900 dark:text-white">{campaignForm.selectedTags.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Delivery</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Schedule:</span>
                  <span className="text-gray-900 dark:text-white capitalize">{campaignForm.schedulingType}</span>
                </div>
                {campaignForm.schedulingType === 'scheduled' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                    <span className="text-gray-900 dark:text-white">
                      {campaignForm.scheduledDate} at {campaignForm.scheduledTime}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                  <span className="text-gray-900 dark:text-white capitalize">{campaignForm.emailProvider}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">Email Preview</h5>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 p-4 max-h-96 overflow-y-auto">
              <div className="text-sm space-y-2 mb-4">
                <div><strong>Subject:</strong> {campaignForm.subject}</div>
                <div><strong>From:</strong> Your Company &lt;noreply@company.com&gt;</div>
              </div>
              <hr className="my-4" />
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: campaignForm.htmlContent
                    .replace(/{{company_name}}/g, 'Your Company')
                    .replace(/{{campaign_title}}/g, campaignForm.name)
                    .replace(/{{main_content}}/g, 'This is your campaign content...')
                    .replace(/{{cta_text}}/g, 'Learn More')
                    .replace(/{{year}}/g, new Date().getFullYear().toString())
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default CampaignSteps
