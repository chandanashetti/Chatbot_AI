(function() {
  'use strict';
  
  // Prevent multiple widget instances
  if (window.ChatbotWidget) {
    console.log('Chatbot widget already initialized');
    return;
  }
  
  // Mark widget as loaded
  window.ChatbotWidget = { loaded: true };

  // Widget configuration
  let config = {
    botId: null,
    apiUrl: null,
    theme: 'default',
    position: 'bottom-right',
    sessionId: null,
    isOpen: false,
    isMinimized: true,
    appearance: {
      name: 'AI Assistant',
      welcomeMessage: 'Hello! How can I help you today?',
      description: 'AI Assistant',
      avatar: null,
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#EFF6FF',
        backgroundColor: '#FFFFFF',
        textColor: '#374151'
      },
      typography: {
        fontFamily: 'system-ui',
        fontSize: 14,
        lineHeight: 1.5
      },
      position: {
        side: 'right',
        offset: { x: 20, y: 20 }
      },
      messageStyle: {
        bubbleStyle: 'rounded',
        showAvatar: true,
        showTimestamp: false
      },
      background: {
        type: 'none',
        value: ''
      }
    }
  };

  // Initialize widget
  function initWidget() {
    // Get configuration from script attributes
    const scripts = document.getElementsByTagName('script');
    let widgetScript = null;
    
    for (let script of scripts) {
      if (script.getAttribute('data-bot-id')) {
        widgetScript = script;
        break;
      }
    }

    if (!widgetScript) {
      console.error('ChatBot: Widget script not found. Make sure you include the data-bot-id attribute in your script tag.');
      return;
    }

    config.botId = widgetScript.getAttribute('data-bot-id');
    config.apiUrl = widgetScript.getAttribute('data-api-url');
    config.theme = widgetScript.getAttribute('data-theme') || 'default';
    
    // Load custom configuration if provided
    const customConfig = widgetScript.getAttribute('data-config');
    if (customConfig) {
      try {
        const parsed = JSON.parse(customConfig.replace(/&quot;/g, '"'));
        if (parsed.appearance) {
          config.appearance = { ...config.appearance, ...parsed.appearance };
        }
      } catch (error) {
        console.warn('ChatBot: Invalid custom configuration', error);
      }
    }

    if (!config.botId || !config.apiUrl) {
      console.error('ChatBot: Missing required configuration. Please provide data-bot-id and data-api-url attributes.');
      console.log('Current config:', { botId: config.botId, apiUrl: config.apiUrl });
      return;
    }

    // Load widget configuration
    loadWidgetConfig()
      .then(() => {
        createSession();
        createWidgetHTML();
        attachEventListeners();
        console.log('ChatBot: Widget initialized successfully');
      })
      .catch(error => {
        console.error('ChatBot: Failed to initialize widget', error);
        // Still create widget with default config
        createWidgetHTML();
        attachEventListeners();
      });
  }

  // Load widget configuration from API
  async function loadWidgetConfig() {
    try {
      console.log(`ChatBot: Loading configuration from ${config.apiUrl}/api/widget/${config.botId}/config`);
      
      const response = await fetch(`${config.apiUrl}/api/widget/${config.botId}/config`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const widgetConfig = await response.json();
      console.log('ChatBot: Configuration loaded successfully', widgetConfig);
      
      config = { ...config, ...widgetConfig };
    } catch (error) {
      console.error('ChatBot: Failed to load configuration', error);
      console.log('ChatBot: Using default configuration');
      // Continue with default config instead of throwing
    }
  }

  // Create new session
  async function createSession() {
    try {
      const response = await fetch(`${config.apiUrl}/api/widget/${config.botId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInfo: {
            referrer: document.referrer,
            url: window.location.href,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        config.sessionId = data.sessionId;
      }
    } catch (error) {
      console.error('ChatBot: Failed to create session', error);
      config.sessionId = 'fallback-' + Math.random().toString(36).substr(2, 9);
    }
  }

  // Create widget HTML
  function createWidgetHTML() {
    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'chatbot-widget-container';
    
    // Apply custom positioning
    const position = config.appearance.position;
    const positionStyles = position.side === 'left' 
      ? `left: ${position.offset.x}px;` 
      : `right: ${position.offset.x}px;`;
    
    // Apply custom background if set
    let backgroundStyles = '';
    if (config.appearance.background.type === 'color') {
      backgroundStyles = `background-color: ${config.appearance.background.value};`;
    } else if (config.appearance.background.type === 'gradient') {
      backgroundStyles = `background: ${config.appearance.background.value};`;
    } else if (config.appearance.background.type === 'image') {
      backgroundStyles = `background-image: url('${config.appearance.background.value}'); background-size: cover; background-position: center;`;
    }
    
    widgetContainer.innerHTML = `
      <style>
        #chatbot-widget-container {
          position: fixed;
          bottom: ${position.offset.y}px;
          ${positionStyles}
          z-index: 10000;
          font-family: ${config.appearance.typography.fontFamily};
        }

        #chatbot-toggle {
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: ${config.appearance.theme.primaryColor};
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        #chatbot-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }

        #chatbot-toggle svg {
          width: 24px;
          height: 24px;
          fill: white;
        }

        #chatbot-window {
          display: none;
          width: 350px;
          height: 500px;
          background: ${config.appearance.theme.backgroundColor};
          border-radius: ${config.appearance.messageStyle.bubbleStyle === 'square' ? '4px' : config.appearance.messageStyle.bubbleStyle === 'minimal' ? '8px' : '12px'};
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          margin-bottom: 10px;
          overflow: hidden;
          flex-direction: column;
          font-family: ${config.appearance.typography.fontFamily};
          font-size: ${config.appearance.typography.fontSize}px;
          line-height: ${config.appearance.typography.lineHeight};
        }

        #chatbot-window.open {
          display: flex;
        }

        #chatbot-header {
          background: ${config.appearance.theme.primaryColor};
          color: white;
          padding: 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        #chatbot-title {
          font-weight: bold;
          font-size: 16px;
        }

        #chatbot-subtitle {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 2px;
        }

        #chatbot-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
        }

        #chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          background: ${config.appearance.theme.secondaryColor || '#f8f9fa'};
          ${backgroundStyles}
        }

        .chatbot-message {
          margin-bottom: 15px;
          display: flex;
          align-items: flex-start;
        }

        .chatbot-message.user {
          justify-content: flex-end;
        }

        .chatbot-message.bot {
          justify-content: flex-start;
        }

        .chatbot-message-content {
          max-width: 80%;
          padding: 10px 15px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
        }

        .chatbot-message.user .chatbot-message-content {
          background: ${config.theme?.primaryColor || '#007bff'};
          color: white;
        }

        .chatbot-message.bot .chatbot-message-content {
          background: white;
          color: ${config.theme?.textColor || '#333'};
          border: 1px solid #e9ecef;
        }

        #chatbot-input-container {
          padding: 15px;
          background: white;
          border-top: 1px solid #e9ecef;
          display: flex;
          gap: 10px;
        }

        #chatbot-input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #e9ecef;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }

        #chatbot-send {
          background: ${config.appearance.theme.primaryColor};
          color: white;
          border: none;
          border-radius: 20px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: ${config.appearance.typography.fontSize}px;
        }

        #chatbot-typing {
          display: none;
          padding: 10px 15px;
          color: #666;
          font-size: 14px;
          font-style: italic;
        }

        .chatbot-options {
          margin-top: 10px;
        }

        .chatbot-option {
          display: block;
          width: 100%;
          padding: 8px 12px;
          margin: 5px 0;
          background: white;
          border: 1px solid ${config.appearance.theme.primaryColor};
          color: ${config.appearance.theme.primaryColor};
          border-radius: ${config.appearance.messageStyle.bubbleStyle === 'square' ? '4px' : '15px'};
          cursor: pointer;
          font-size: ${config.appearance.typography.fontSize - 1}px;
          text-align: left;
        }

        .chatbot-option:hover {
          background: ${config.appearance.theme.primaryColor};
          color: white;
        }

        @media (max-width: 480px) {
          #chatbot-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 40px);
            margin: 20px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
          }
        }
      </style>

      <div id="chatbot-window">
        <div id="chatbot-header">
          <div style="display: flex; align-items: center;">
            ${config.appearance.avatar ? `<img src="${config.appearance.avatar}" alt="Bot Avatar" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px;">` : ''}
            <div>
              <div id="chatbot-title">${config.appearance.name}</div>
              ${config.appearance.description ? `<div id="chatbot-subtitle">${config.appearance.description}</div>` : ''}
            </div>
          </div>
          <button id="chatbot-close">&times;</button>
        </div>
        <div id="chatbot-messages"></div>
        <div id="chatbot-typing">Bot is typing...</div>
        <div id="chatbot-input-container">
          <input type="text" id="chatbot-input" placeholder="Type your message..." />
          <button id="chatbot-send">Send</button>
        </div>
      </div>

      <button id="chatbot-toggle">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
    `;

    document.body.appendChild(widgetContainer);

    // Add welcome message if configured
    if (config.appearance.welcomeMessage) {
      addMessage('bot', config.appearance.welcomeMessage);
    }
  }

  // Attach event listeners
  function attachEventListeners() {
    const toggle = document.getElementById('chatbot-toggle');
    const close = document.getElementById('chatbot-close');
    const input = document.getElementById('chatbot-input');
    const send = document.getElementById('chatbot-send');

    toggle.addEventListener('click', toggleWidget);
    close.addEventListener('click', closeWidget);
    input.addEventListener('keypress', handleInputKeypress);
    send.addEventListener('click', sendMessage);
  }

  // Toggle widget open/close
  function toggleWidget() {
    const window = document.getElementById('chatbot-window');
    config.isOpen = !config.isOpen;
    
    if (config.isOpen) {
      window.classList.add('open');
      document.getElementById('chatbot-input').focus();
    } else {
      window.classList.remove('open');
    }
  }

  // Close widget
  function closeWidget() {
    config.isOpen = false;
    document.getElementById('chatbot-window').classList.remove('open');
  }

  // Handle input keypress
  function handleInputKeypress(event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }

  // Send message
  async function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to UI
    addMessage('user', message);
    input.value = '';

    // Show typing indicator
    showTyping();

    try {
      // Send message to API
      const response = await fetch(`${config.apiUrl}/api/widget/${config.botId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId: config.sessionId
        })
      });

      hideTyping();

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.response) {
          // Add bot response with delay for natural feel
          setTimeout(() => {
            addMessage('bot', data.response.content, data.response.options);
          }, config.responseDelay || 500);
        }
      } else {
        addMessage('bot', 'Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      hideTyping();
      console.error('ChatBot: Send message error', error);
      addMessage('bot', 'Sorry, I\'m having trouble connecting. Please try again.');
    }
  }

  // Add message to chat
  function addMessage(sender, content, options = null) {
    const messagesContainer = document.getElementById('chatbot-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'chatbot-message-content';
    contentDiv.textContent = content;
    
    messageDiv.appendChild(contentDiv);

    // Add options if provided
    if (options && options.length > 0) {
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'chatbot-options';
      
      options.forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.className = 'chatbot-option';
        optionButton.textContent = option;
        optionButton.addEventListener('click', () => {
          document.getElementById('chatbot-input').value = option;
          sendMessage();
        });
        optionsDiv.appendChild(optionButton);
      });
      
      messageDiv.appendChild(optionsDiv);
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show typing indicator
  function showTyping() {
    document.getElementById('chatbot-typing').style.display = 'block';
  }

  // Hide typing indicator
  function hideTyping() {
    document.getElementById('chatbot-typing').style.display = 'none';
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

})();
