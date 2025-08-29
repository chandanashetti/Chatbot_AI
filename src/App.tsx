import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from './store/store'
import LandingPage from './pages/LandingPage'
import ChatInterface from './pages/ChatInterface'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/admin/Dashboard'
import Integrations from './pages/admin/Integrations'
import AgentManagement from './pages/admin/AgentManagement'
import ChatReview from './pages/admin/ChatReview'
import TicketManagement from './pages/admin/TicketManagement'
import UserManagement from './pages/admin/UserManagement'
import BotManagement from './pages/admin/BotManagement'
import BotBuilder from './pages/admin/BotBuilder'
import BotSettings from './pages/admin/BotSettings'
import KnowledgeBase from './pages/admin/KnowledgeBase'
import Logs from './pages/admin/Logs'
import Analytics from './pages/admin/Analytics'
import AdminSettings from './pages/admin/Settings'
import ThemeProvider from './components/providers/ThemeProvider'
import GlobalChatWidget from './components/widgets/GlobalChatWidget'

function App() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin" 
            element={isAuthenticated ? <AdminLayout /> : <Navigate to="/login" replace />}
          >
            <Route index element={<Dashboard />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="agents" element={<AgentManagement />} />
            <Route path="chats" element={<ChatReview />} />
            <Route path="tickets" element={<TicketManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="bots" element={<BotManagement />} />
            <Route path="bots/:botId/builder" element={<BotBuilder />} />
            <Route path="bots/:botId/settings" element={<BotSettings />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="logs" element={<Logs />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Global Chat Widget - appears on all pages where enabled */}
        <GlobalChatWidget />
      </div>
    </ThemeProvider>
  )
}

export default App
