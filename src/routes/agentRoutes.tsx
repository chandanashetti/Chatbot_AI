import { Routes, Route, Navigate } from 'react-router-dom';
import AgentLayout from '../components/layout/AgentLayout';
import AgentDashboard from '../pages/agent/AgentDashboard';
import AgentChat from '../pages/agent/AgentChat';
import AgentAnalytics from '../pages/agent/AgentAnalytics';
import HandoffRequests from '../pages/agent/HandoffRequests';

const AgentRoutes = () => {
  return (
    <Routes>
      {/* Agent Layout with all sub-routes */}
      <Route path="/" element={<AgentLayout />}>
        {/* Agent Dashboard */}
        <Route path="dashboard" element={<AgentDashboard />} />

        {/* Handoff Requests Management */}
        <Route path="handoffs" element={<HandoffRequests />} />

        {/* Agent Analytics */}
        <Route path="analytics" element={<AgentAnalytics />} />

        {/* Agent Chat Interface - outside layout for full screen */}
        <Route path="chat/:handoffId" element={<AgentChat />} />

        {/* Default redirect */}
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
};

export default AgentRoutes;
