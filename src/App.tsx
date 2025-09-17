import { Routes, Route } from 'react-router-dom'
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
import RoleManagement from './pages/admin/RoleManagement'
import BotManagement from './pages/admin/BotManagement'
import BotBuilder from './pages/admin/BotBuilder'
import BotSettings from './pages/admin/BotSettings'
import KnowledgeBase from './pages/admin/KnowledgeBase'
import Logs from './pages/admin/Logs'
import Analytics from './pages/admin/Analytics'
import AdminSettings from './pages/admin/Settings'
import ThemeProvider from './components/providers/ThemeProvider'
import GlobalChatWidget from './components/widgets/GlobalChatWidget'
import AgentRoutes from './routes/agentRoutes'
import RoleBasedRoute from './components/auth/RoleBasedRoute'
import DashboardRedirect from './components/auth/DashboardRedirect'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Dashboard Redirect - redirects authenticated users to their role-specific dashboard */}
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Protected Admin Routes - Only for admin-level roles */}
            <Route
              path="/admin/*"
              element={
                <RoleBasedRoute allowedRoles={['admin', 'superadministrator', 'manager', 'operator', 'viewer']}>
                  <AdminLayout />
                </RoleBasedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="agents" element={<AgentManagement />} />
              <Route path="chats" element={<ChatReview />} />
              <Route path="tickets" element={<TicketManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="roles" element={<RoleManagement />} />
              <Route path="bots" element={<BotManagement />} />
              <Route path="bots/:botId/builder" element={<BotBuilder />} />
              <Route path="bots/:botId/settings" element={<BotSettings />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="logs" element={<Logs />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Protected Agent Routes - Only for agent role */}
            <Route
              path="/agent/*"
              element={
                <RoleBasedRoute allowedRoles={['agent']}>
                  <AgentRoutes />
                </RoleBasedRoute>
              }
            />

            {/* Fallback - redirect to dashboard for authenticated users, home for others */}
            <Route path="*" element={<DashboardRedirect />} />
          </Routes>

          {/* Global Chat Widget - appears on all pages where enabled */}
          <GlobalChatWidget />
        </div>
    </ThemeProvider>
  )
}

export default App
