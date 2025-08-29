import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { 
  updateBotFlow, 
  setBuilderState,
  BotNode,
  BotConnection
} from '../../store/slices/botSlice'
import { botsAPI } from '../../services/api'
import {
  Plus,
  Save,
  ArrowLeft,
  MessageSquare,
  HelpCircle,
  GitBranch,
  Zap,
  Webhook,
  Users,
  Trash2,
  Copy,
  TestTube,
  Grid,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const BotBuilder = () => {
  const { botId } = useParams<{ botId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { bots, builderState } = useSelector((state: RootState) => state.bots)
  
  const bot = bots.find(b => b.id === botId)
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [draggedConnection, setDraggedConnection] = useState<{x: number, y: number} | null>(null)
  const [testMessages, setTestMessages] = useState<Array<{id: string, content: string, sender: 'user' | 'bot', timestamp: Date}>>([])
  const [testSessionId, setTestSessionId] = useState<string | null>(null)
  const [testInput, setTestInput] = useState('')
  const [isTestingFlow, setIsTestingFlow] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const [showNodePanel, setShowNodePanel] = useState(true)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true)
  const [showTestPanel, setShowTestPanel] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!bot) {
      navigate('/admin/bots')
      return
    }
  }, [bot, navigate])

  const nodeTypes = [
    {
      type: 'message',
      name: 'Message',
      icon: MessageSquare,
      color: 'bg-blue-100 text-blue-600 border-blue-200',
      description: 'Send a message to the user'
    },
    {
      type: 'question',
      name: 'Question',
      icon: HelpCircle,
      color: 'bg-green-100 text-green-600 border-green-200',
      description: 'Ask the user a question'
    },
    {
      type: 'condition',
      name: 'Condition',
      icon: GitBranch,
      color: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      description: 'Branch based on conditions'
    },
    {
      type: 'action',
      name: 'Action',
      icon: Zap,
      color: 'bg-purple-100 text-purple-600 border-purple-200',
      description: 'Perform an action'
    },
    {
      type: 'webhook',
      name: 'Webhook',
      icon: Webhook,
      color: 'bg-orange-100 text-orange-600 border-orange-200',
      description: 'Call external API'
    },
    {
      type: 'handoff',
      name: 'Handoff',
      icon: Users,
      color: 'bg-red-100 text-red-600 border-red-200',
      description: 'Transfer to human agent'
    }
  ]

  const handleNodeDrag = useCallback((e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('nodeType', nodeType)
  }, [])

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('nodeType')
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (nodeType && bot) {
      const newNode: BotNode = {
        id: `node-${Date.now()}`,
        type: nodeType as any,
        position: { x: x - 75, y: y - 40 }, // Center the node
        data: {
          title: `New ${nodeType}`,
          content: nodeType === 'message' ? 'Hello! How can I help you?' : ''
        }
      }

      const updatedFlow = {
        ...bot.flow,
        nodes: [...bot.flow.nodes, newNode]
      }

      dispatch(updateBotFlow({ botId: bot.id, flow: updatedFlow }))
      setSelectedNode(newNode.id)
    }
  }, [bot, dispatch])

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId)
  }

  const handleNodeDelete = (nodeId: string) => {
    if (!bot) return
    
    const updatedFlow = {
      ...bot.flow,
      nodes: bot.flow.nodes.filter(n => n.id !== nodeId),
      connections: bot.flow.connections.filter(c => c.source !== nodeId && c.target !== nodeId)
    }

    dispatch(updateBotFlow({ botId: bot.id, flow: updatedFlow }))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }

  const handleNodeUpdate = (nodeId: string, updates: Partial<BotNode>) => {
    if (!bot) return

    const updatedFlow = {
      ...bot.flow,
      nodes: bot.flow.nodes.map(n => 
        n.id === nodeId ? { ...n, ...updates } : n
      )
    }

    dispatch(updateBotFlow({ botId: bot.id, flow: updatedFlow }))
  }

  const handleSave = async () => {
    if (!bot) return
    
    try {
      await botsAPI.updateBotFlow(bot.id, bot.flow)
      toast.success('Bot flow saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save bot flow')
    }
  }

  const handleTest = () => {
    if (!bot || !bot.flow.nodes.length) {
      toast.error('Add some nodes to test the flow')
      return
    }
    
    setShowTestPanel(true)
    setTestMessages([])
    setTestSessionId(`test-${Date.now()}`)
    
    // Add welcome message
    const welcomeMessage = bot.settings?.appearance?.welcomeMessage || 'Hello! How can I help you?'
    setTestMessages([{
      id: 'welcome',
      content: welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    }])
    
    toast.success('Test mode activated!')
  }

  const handleZoomIn = () => {
    dispatch(setBuilderState({ zoom: Math.min(builderState.zoom + 0.1, 2) }))
  }

  const handleZoomOut = () => {
    dispatch(setBuilderState({ zoom: Math.max(builderState.zoom - 0.1, 0.5) }))
  }

  const handleResetZoom = () => {
    dispatch(setBuilderState({ zoom: 1 }))
  }

  const toggleGrid = () => {
    dispatch(setBuilderState({ showGrid: !builderState.showGrid }))
  }

  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.type === type)
    return nodeType?.icon || MessageSquare
  }

  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.type === type)
    return nodeType?.color || 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const selectedNodeData = selectedNode ? bot?.flow.nodes.find(n => n.id === selectedNode) : null

  // Flow validation
  const validateFlow = useCallback(() => {
    if (!bot) return { isValid: false, errors: ['No bot found'] }
    
    const errors: string[] = []
    const { nodes, connections } = bot.flow
    
    // Check if flow has nodes
    if (nodes.length === 0) {
      errors.push('Flow must have at least one node')
    }
    
    // Check for start node
    const hasStartNode = nodes.some(node => 
      node.type === 'message' || 
      node.data.title.toLowerCase().includes('start') ||
      node.data.title.toLowerCase().includes('welcome')
    )
    
    if (nodes.length > 0 && !hasStartNode) {
      errors.push('Flow should have a welcome/start message node')
    }
    
    // Check for orphaned nodes (nodes with no connections)
    if (nodes.length > 1 && connections.length === 0) {
      errors.push('Connect your nodes to create a conversation flow')
    }
    
    // Check for incomplete nodes
    const incompleteNodes = nodes.filter(node => {
      if (!node.data.title || node.data.title.trim().length === 0) return true
      if ((node.type === 'message' || node.type === 'question') && 
          (!node.data.content || node.data.content.trim().length === 0)) return true
      if (node.type === 'webhook' && !node.data.webhook?.url) return true
      return false
    })
    
    if (incompleteNodes.length > 0) {
      errors.push(`${incompleteNodes.length} node(s) need configuration`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      nodeCount: nodes.length,
      connectionCount: connections.length
    }
  }, [bot])

  const flowValidation = validateFlow()

  // Connection handling
  const handleStartConnection = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setConnectingFrom(nodeId)
    setSelectedNode(nodeId)
  }

  const handleEndConnection = (targetNodeId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (connectingFrom && connectingFrom !== targetNodeId && bot) {
      const newConnection: BotConnection = {
        id: `conn-${Date.now()}`,
        source: connectingFrom,
        target: targetNodeId,
        sourceHandle: 'output',
        targetHandle: 'input'
      }

      const updatedFlow = {
        ...bot.flow,
        connections: [...bot.flow.connections, newConnection]
      }

      dispatch(updateBotFlow({ botId: bot.id, flow: updatedFlow }))
      toast.success('Nodes connected successfully!')
    }
    
    setConnectingFrom(null)
    setDraggedConnection(null)
  }

  const handleDeleteConnection = (connectionId: string) => {
    if (!bot) return
    
    const updatedFlow = {
      ...bot.flow,
      connections: bot.flow.connections.filter(c => c.id !== connectionId)
    }

    dispatch(updateBotFlow({ botId: bot.id, flow: updatedFlow }))
    toast.success('Connection deleted')
  }

  // Test functionality
  const sendTestMessage = async () => {
    if (!testInput.trim() || !bot || !testSessionId) return
    
    const userMessage = {
      id: `msg-${Date.now()}`,
      content: testInput.trim(),
      sender: 'user' as const,
      timestamp: new Date()
    }
    
    setTestMessages(prev => [...prev, userMessage])
    setTestInput('')
    setIsTestingFlow(true)
    
    try {
      // Call the test API
      const response = await botsAPI.testBot(bot.id, userMessage.content, testSessionId)
      
      const botMessage = {
        id: `msg-${Date.now()}-bot`,
        content: response.data?.response?.content || 'No response received',
        sender: 'bot' as const,
        timestamp: new Date()
      }
      
      setTimeout(() => {
        setTestMessages(prev => [...prev, botMessage])
        setIsTestingFlow(false)
      }, 1000)
      
    } catch (error) {
      console.error('Test error:', error)
      const errorMessage = {
        id: `msg-${Date.now()}-error`,
        content: 'Sorry, I encountered an error while processing your message.',
        sender: 'bot' as const,
        timestamp: new Date()
      }
      
      setTimeout(() => {
        setTestMessages(prev => [...prev, errorMessage])
        setIsTestingFlow(false)
      }, 1000)
    }
  }

  // Mouse move handler for connection dragging
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (connectingFrom && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      setDraggedConnection({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      })
    }
  }, [connectingFrom])

  // Render connections
  const renderConnections = () => {
    if (!bot) return null
    
    return bot.flow.connections.map(connection => {
      const sourceNode = bot.flow.nodes.find(n => n.id === connection.source)
      const targetNode = bot.flow.nodes.find(n => n.id === connection.target)
      
      if (!sourceNode || !targetNode) return null
      
      const sourceX = sourceNode.position.x + 160 // node width
      const sourceY = sourceNode.position.y + 40  // half node height
      const targetX = targetNode.position.x
      const targetY = targetNode.position.y + 40
      
      const midX = (sourceX + targetX) / 2
      
      return (
        <g key={connection.id}>
          <path
            d={`M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`}
            stroke="#3B82F6"
            strokeWidth="2"
            fill="none"
            className="cursor-pointer hover:stroke-red-500"
            onClick={() => handleDeleteConnection(connection.id)}
          />
          <circle
            cx={targetX}
            cy={targetY}
            r="4"
            fill="#3B82F6"
          />
        </g>
      )
    })
  }

  // Render dragged connection
  const renderDraggedConnection = () => {
    if (!connectingFrom || !draggedConnection || !bot) return null
    
    const sourceNode = bot.flow.nodes.find(n => n.id === connectingFrom)
    if (!sourceNode) return null
    
    const sourceX = sourceNode.position.x + 160
    const sourceY = sourceNode.position.y + 40
    const targetX = draggedConnection.x
    const targetY = draggedConnection.y
    
    const midX = (sourceX + targetX) / 2
    
    return (
      <path
        d={`M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`}
        stroke="#94A3B8"
        strokeWidth="2"
        strokeDasharray="5,5"
        fill="none"
      />
    )
  }

  if (!bot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-slate-600 dark:text-slate-400">Bot not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/bots')}
            className="btn-ghost p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {bot.name} - Flow Builder
            </h1>
            <div className="flex items-center space-x-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Design your bot's conversation flow
              </p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  flowValidation.isValid ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-xs text-slate-500">
                  {flowValidation.isValid ? 'Ready to deploy' : `${flowValidation.errors.length} issue(s)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button onClick={handleZoomOut} className="btn-ghost p-1">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm px-2 text-slate-600 dark:text-slate-400">
              {Math.round(builderState.zoom * 100)}%
            </span>
            <button onClick={handleZoomIn} className="btn-ghost p-1">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleResetZoom} className="btn-ghost p-1">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button onClick={toggleGrid} className={`btn-ghost p-2 ${builderState.showGrid ? 'bg-primary-100 text-primary-600' : ''}`}>
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-ghost p-2"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button onClick={handleTest} className="btn-secondary">
            <TestTube className="w-4 h-4 mr-2" />
            Test
          </button>

          <button onClick={handleSave} className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        {showNodePanel && (
          <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Nodes</h3>
              <button
                onClick={() => setShowNodePanel(false)}
                className="btn-ghost p-1"
              >
                <Minimize className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {nodeTypes.map((nodeType) => {
                const Icon = nodeType.icon
                return (
                  <div
                    key={nodeType.type}
                    draggable
                    onDragStart={(e) => handleNodeDrag(e, nodeType.type)}
                    className={`p-3 rounded-xl border-2 border-dashed cursor-move hover:shadow-md transition-all ${nodeType.color}`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{nodeType.name}</span>
                    </div>
                    <p className="text-xs opacity-75">{nodeType.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className={`w-full h-full relative ${builderState.showGrid ? 'bg-grid-pattern' : 'bg-slate-100 dark:bg-slate-900'}`}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onMouseMove={handleMouseMove}
            onClick={() => {
              setConnectingFrom(null)
              setDraggedConnection(null)
            }}
            style={{ transform: `scale(${builderState.zoom})`, transformOrigin: 'top left' }}
          >
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {renderConnections()}
              {renderDraggedConnection()}
            </svg>
            {/* Render Nodes */}
            {bot.flow.nodes.map((node) => {
              const Icon = getNodeIcon(node.type)
              const isSelected = selectedNode === node.id
              
              return (
                <div
                  key={node.id}
                  className={`absolute w-40 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary-500 shadow-lg bg-white dark:bg-slate-800' 
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary-300'
                  }`}
                  style={{
                    left: node.position.x,
                    top: node.position.y
                  }}
                  onClick={() => handleNodeSelect(node.id)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1 rounded-lg ${getNodeColor(node.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                      {node.data.title}
                    </span>
                  </div>
                  
                  {node.data.content && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {node.data.content}
                    </p>
                  )}

                  {isSelected && (
                    <div className="absolute -top-2 -right-2 flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle copy
                        }}
                        className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNodeDelete(node.id)
                        }}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Connection Points */}
                  <div 
                    className={`absolute -right-2 top-1/2 w-4 h-4 rounded-full border-2 border-white transform -translate-y-1/2 cursor-pointer z-10 ${
                      connectingFrom === node.id ? 'bg-green-500' : 'bg-primary-500 hover:bg-primary-600'
                    }`}
                    onClick={(e) => handleStartConnection(node.id, e)}
                    title="Click to start connection"
                  ></div>
                  <div 
                    className={`absolute -left-2 top-1/2 w-4 h-4 rounded-full border-2 border-white transform -translate-y-1/2 cursor-pointer z-10 ${
                      connectingFrom && connectingFrom !== node.id ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-400'
                    }`}
                    onClick={(e) => connectingFrom ? handleEndConnection(node.id, e) : undefined}
                    title={connectingFrom ? 'Click to complete connection' : 'Input connection point'}
                  ></div>
                </div>
              )
            })}

            {/* Empty State */}
            {bot.flow.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Start Building Your Bot
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Drag and drop nodes from the left panel to create your conversation flow
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Floating Toggle Buttons */}
          <div className="absolute top-4 left-4 space-y-2">
            {!showNodePanel && (
              <button
                onClick={() => setShowNodePanel(true)}
                className="btn-primary p-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Flow Status Panel */}
          {!flowValidation.isValid && (
            <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 max-w-sm">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Flow Status</h4>
              </div>
              <div className="space-y-2">
                {flowValidation.errors.map((error, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-500 text-xs mt-0.5">⚠️</span>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{error}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Nodes: {flowValidation.nodeCount}</span>
                  <span>Connections: {flowValidation.connectionCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {showPropertiesPanel && selectedNodeData && (
          <div className="w-80 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Properties</h3>
              <button
                onClick={() => setShowPropertiesPanel(false)}
                className="btn-ghost p-1"
              >
                <Minimize className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Node Title
                </label>
                <input
                  type="text"
                  value={selectedNodeData.data.title}
                  onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                    data: { ...selectedNodeData.data, title: e.target.value }
                  })}
                  className="input-field"
                />
              </div>

              {(selectedNodeData.type === 'message' || selectedNodeData.type === 'question') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Content
                  </label>
                  <textarea
                    value={selectedNodeData.data.content || ''}
                    onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                      data: { ...selectedNodeData.data, content: e.target.value }
                    })}
                    rows={4}
                    className="input-field"
                    placeholder="Enter your message..."
                  />
                </div>
              )}

              {selectedNodeData.type === 'question' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Options (one per line)
                  </label>
                  <textarea
                    value={selectedNodeData.data.options?.join('\n') || ''}
                    onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                      data: { ...selectedNodeData.data, options: e.target.value.split('\n').filter(o => o.trim()) }
                    })}
                    rows={3}
                    className="input-field"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              {selectedNodeData.type === 'condition' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Condition Rules
                  </label>
                  <div className="space-y-2">
                    <div className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Field/Variable"
                          className="input-field"
                        />
                        <select className="input-field">
                          <option value="equals">Equals</option>
                          <option value="contains">Contains</option>
                          <option value="greater">Greater than</option>
                          <option value="less">Less than</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Value"
                          className="input-field"
                        />
                      </div>
                    </div>
                    <button className="text-primary-600 text-xs hover:underline">
                      + Add condition
                    </button>
                  </div>
                </div>
              )}

              {selectedNodeData.type === 'action' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Action Type
                  </label>
                  <select
                    value={selectedNodeData.data.actionType || 'custom'}
                    onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                      data: { ...selectedNodeData.data, actionType: e.target.value }
                    })}
                    className="input-field"
                  >
                    <option value="custom">Custom Action</option>
                    <option value="collect_email">Collect Email</option>
                    <option value="collect_phone">Collect Phone</option>
                    <option value="save_lead">Save Lead Data</option>
                    <option value="set_variable">Set Variable</option>
                  </select>
                  
                  {selectedNodeData.data.actionType === 'set_variable' && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Variable name"
                        value={selectedNodeData.data.variableName || ''}
                        onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                          data: { ...selectedNodeData.data, variableName: e.target.value }
                        })}
                        className="input-field"
                      />
                      <input
                        type="text"
                        placeholder="Variable value"
                        value={selectedNodeData.data.variableValue || ''}
                        onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                          data: { ...selectedNodeData.data, variableValue: e.target.value }
                        })}
                        className="input-field"
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedNodeData.type === 'webhook' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={selectedNodeData.data.webhook?.url || ''}
                      onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                        data: { 
                          ...selectedNodeData.data, 
                          webhook: { 
                            ...selectedNodeData.data.webhook,
                            url: e.target.value,
                            method: selectedNodeData.data.webhook?.method || 'POST'
                          }
                        }
                      })}
                      className="input-field"
                      placeholder="https://api.example.com/webhook"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Method
                    </label>
                    <select
                      value={selectedNodeData.data.webhook?.method || 'POST'}
                      onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                        data: { 
                          ...selectedNodeData.data, 
                          webhook: { 
                            ...selectedNodeData.data.webhook,
                            url: selectedNodeData.data.webhook?.url || '',
                            method: e.target.value as 'GET' | 'POST'
                          }
                        }
                      })}
                      className="input-field"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </div>
                </>
              )}

              {selectedNodeData.type === 'handoff' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Handoff Reason
                  </label>
                  <textarea
                    value={selectedNodeData.data.reason || ''}
                    onChange={(e) => handleNodeUpdate(selectedNodeData.id, {
                      data: { ...selectedNodeData.data, reason: e.target.value }
                    })}
                    rows={2}
                    className="input-field"
                    placeholder="Why is this conversation being handed off?"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Node Information</h4>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Node ID:</span>
                    <span className="font-mono">{selectedNodeData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{selectedNodeData.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Position:</span>
                    <span>{selectedNodeData.position.x}, {selectedNodeData.position.y}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connections:</span>
                    <span>
                      {bot?.flow.connections.filter(c => c.source === selectedNodeData.id || c.target === selectedNodeData.id).length || 0}
                    </span>
                  </div>
                </div>
                
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2 mt-4">Actions</h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      if (!bot) return
                      const newNode = {
                        ...selectedNodeData,
                        id: `node-${Date.now()}`,
                        position: {
                          x: selectedNodeData.position.x + 200,
                          y: selectedNodeData.position.y + 100
                        },
                        data: {
                          ...selectedNodeData.data,
                          title: selectedNodeData.data.title + ' (Copy)'
                        }
                      }
                      
                      const updatedFlow = {
                        ...bot.flow,
                        nodes: [...bot.flow.nodes, newNode]
                      }
                      
                      dispatch(updateBotFlow({ botId: bot.id, flow: updatedFlow }))
                      setSelectedNode(newNode.id)
                      toast.success('Node duplicated')
                    }}
                    className="btn-secondary w-full text-sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate Node
                  </button>
                  <button 
                    onClick={() => handleNodeDelete(selectedNodeData.id)}
                    className="btn-ghost w-full text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Node
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Panel */}
        {showTestPanel && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Test Bot</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Session: {testSessionId?.slice(-8)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setTestMessages([])
                    setTestSessionId(`test-${Date.now()}`)
                    const welcomeMessage = bot?.settings?.appearance?.welcomeMessage || 'Hello! How can I help you?'
                    setTestMessages([{
                      id: 'welcome-new',
                      content: welcomeMessage,
                      sender: 'bot',
                      timestamp: new Date()
                    }])
                  }}
                  className="btn-ghost p-1 text-xs"
                  title="Reset conversation"
                >
                  ↻
                </button>
                <button
                  onClick={() => setShowTestPanel(false)}
                  className="btn-ghost p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {testMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTestingFlow && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isTestingFlow && sendTestMessage()}
                  placeholder="Type your message..."
                  className="input-field flex-1 text-sm"
                  disabled={isTestingFlow}
                />
                <button 
                  onClick={sendTestMessage}
                  disabled={!testInput.trim() || isTestingFlow}
                  className="btn-primary px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              
              {bot && bot.flow.nodes.length === 0 && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    ⚠️ Add nodes to your flow to test the conversation
                  </p>
                </div>
              )}
              
              {bot && bot.flow.nodes.length > 0 && bot.flow.connections.length === 0 && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 Connect your nodes to create a conversation flow
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles for Grid Pattern */}
      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default BotBuilder
