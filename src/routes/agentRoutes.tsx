import { Routes, Route, Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import AgentDashboard from '../pages/agent/AgentDashboard';
import AgentChat from '../pages/agent/AgentChat';

const AgentRoutes = () => {
  const { canAccess } = usePermissions();

  // Check if user has agent permissions
  const canAccessAgent = canAccess('agent:view');

  if (!canAccessAgent) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        {/* Agent Dashboard */}
        <Route 
          path="/dashboard" 
          element={<AgentDashboard />} 
        />
        
        {/* Agent Chat Interface */}
        <Route 
          path="/chat/:handoffId" 
          element={<AgentChat />} 
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default AgentRoutes;
