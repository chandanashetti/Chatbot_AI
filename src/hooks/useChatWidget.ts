import { useState, useCallback } from 'react'

export interface ChatWidgetConfig {
  enabled: boolean
  title: string
  initialMessage: string
  placeholder: string
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme: 'light' | 'dark' | 'auto'
  autoOpen?: boolean
  showOnPages?: string[]
  hideOnPages?: string[]
}

const defaultConfig: ChatWidgetConfig = {
  enabled: true,
  title: 'AI Assistant',
  initialMessage: 'Hi! How can I help you today?',
  placeholder: 'Type your message...',
  position: 'bottom-right',
  theme: 'auto',
  autoOpen: false,
  showOnPages: [],
  hideOnPages: []
}

export const useChatWidget = (initialConfig?: Partial<ChatWidgetConfig>) => {
  const [config, setConfig] = useState<ChatWidgetConfig>({
    ...defaultConfig,
    ...initialConfig
  })

  const updateConfig = useCallback((updates: Partial<ChatWidgetConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const shouldShowWidget = useCallback((currentPath: string) => {
    // If showOnPages is specified, only show on those pages
    if (config.showOnPages && config.showOnPages.length > 0) {
      return config.showOnPages.some(page => currentPath.includes(page))
    }

    // If hideOnPages is specified, hide on those pages
    if (config.hideOnPages && config.hideOnPages.length > 0) {
      return !config.hideOnPages.some(page => currentPath.includes(page))
    }

    // Default: show on all pages if enabled
    return config.enabled
  }, [config.enabled, config.showOnPages, config.hideOnPages])

  return {
    config,
    updateConfig,
    shouldShowWidget
  }
}

export default useChatWidget
