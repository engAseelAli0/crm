
import React, { useState, useEffect } from 'react';
import LoginPage from './features/auth/pages/LoginPage';
import AgentDashboardPage from './features/agent/pages/AgentDashboardPage';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import ComplaintSubmission from './features/agent/components/ComplaintSubmission';
import { DataManager } from './shared/utils/DataManager';


import { ToastProvider } from './shared/components/Toast';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize Mock Data
        DataManager.seed();

        // Check Session
        const session = DataManager.getCurrentUser();
        if (session) {
          setUser(session);
        }
      } catch (err) {
        console.error('App initialization error:', err);
        // Fallback or specific error handling if needed
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    DataManager.logout();
    setUser(null);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>جار التحميل...</div>;

  return (
    <ToastProvider>
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : window.location.pathname === '/agent/complaints' && user.role === 'AGENT' ? (
        <div style={{ background: '#0f172a', minHeight: '100vh', padding: '2rem' }}>
          <ComplaintSubmission user={user} />
        </div>
      ) : ['ADMIN', 'SUPERVISOR', 'EVALUATOR'].includes(user.role) ? (
        <AdminDashboardPage user={user} onLogout={handleLogout} />
      ) : ['AGENT', 'COMPLAINT_OFFICER'].includes(user.role) ? (
        <AgentDashboardPage user={user} onLogout={handleLogout} />
      ) : (
        <div>Unknown Role: {user.role}</div>
      )}
    </ToastProvider>
  );
}

export default App;
