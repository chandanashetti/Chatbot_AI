import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { 
  updateBotFlow, 
  setBuilderState,
  BotNode
} from '../../store/slices/botSlice'
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

  const handleSave = () => {
    toast.success('Bot flow saved successfully!')
  }

  const handleTest = () => {
    setShowTestPanel(true)
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
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Design your bot's conversation flow
            </p>
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
            className={`w-full h-full relative ${builderState.showGrid ? 'bg-grid-pattern' : 'bg-slate-100 dark:bg-slate-900'}`}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            style={{ transform: `scale(${builderState.zoom})`, transformOrigin: 'top left' }}
          >
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
                  <div className="absolute -right-2 top-1/2 w-4 h-4 bg-primary-500 rounded-full border-2 border-white transform -translate-y-1/2"></div>
                  <div className="absolute -left-2 top-1/2 w-4 h-4 bg-slate-400 rounded-full border-2 border-white transform -translate-y-1/2"></div>
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

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Actions</h4>
                <div className="space-y-2">
                  <button className="btn-secondary w-full text-sm">
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
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Test Bot</h3>
              <button
                onClick={() => setShowTestPanel(false)}
                className="btn-ghost p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="chat-bubble chat-bubble-bot">
                  Hello! I'm testing your bot flow. How can I help you?
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="input-field flex-1"
                />
                <button className="btn-primary px-4">
                  Send
                </button>
              </div>
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
