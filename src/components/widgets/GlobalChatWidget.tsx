import React from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import ChatWidget from '../ChatWidget'
import useChatWidget from '../../hooks/useChatWidget'

interface GlobalChatWidgetProps {
  // Allow overriding default configuration
  overrideConfig?: {
    title?: string
    initialMessage?: string
    placeholder?: string
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    theme?: 'light' | 'dark' | 'auto'
  }
}

const GlobalChatWidget: React.FC<GlobalChatWidgetProps> = ({ overrideConfig }) => {
  const location = useLocation()
  const { settings } = useSelector((state: RootState) => state.settings)
  const widgetSettings = settings.chatWidget
  
  // Check if widget is enabled
  if (!widgetSettings.enabled) {
    return null
  }
  
  // Default configuration based on page type and Redux settings
  const getPageSpecificConfig = () => {
    const path = location.pathname
    
    // Check if current page is in hidden pages list
    if (widgetSettings.hiddenPages.some(hiddenPage => path.includes(hiddenPage))) {
      return { enabled: false }
    }
    
    if (path === '/' || path === '/landing') {
      if (!widgetSettings.showOnLanding) {
        return { enabled: false }
      }
      return {
        title: widgetSettings.title || 'Try Our AI Assistant',
        initialMessage: '👋 Welcome! I\'m here to help you learn about our ChatBot AI platform. Ask me about features, pricing, or setup!',
        placeholder: 'Ask about features, pricing, setup...',
        position: widgetSettings.position,
        theme: widgetSettings.theme
      }
    }
    
    // For other pages, check if widget should show on all pages
    if (!widgetSettings.showOnAllPages && path !== '/' && path !== '/landing') {
      return { enabled: false }
    }
    
    // Default configuration using Redux settings
    return {
      title: widgetSettings.title,
      initialMessage: widgetSettings.initialMessage,
      placeholder: widgetSettings.placeholder,
      position: widgetSettings.position,
      theme: widgetSettings.theme
    }
  }

  const { config, shouldShowWidget } = useChatWidget({
    ...getPageSpecificConfig(),
    ...overrideConfig
  })

  // Don't render if widget shouldn't be shown on this page
  if (!shouldShowWidget(location.pathname)) {
    return null
  }

  return (
    <ChatWidget
      title={config.title}
      initialMessage={config.initialMessage}
      placeholder={config.placeholder}
      position={config.position}
      theme={config.theme}
    />
  )
}

export default GlobalChatWidget
