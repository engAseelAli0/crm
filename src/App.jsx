
import React, { useState, useEffect } from 'react';
import LoginPage from './features/auth/pages/LoginPage';
import AgentDashboardPage from './features/agent/pages/AgentDashboardPage';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import ComplaintSubmission from './features/agent/components/ComplaintSubmission';
import { DataManager } from './shared/utils/DataManager';


import { ToastProvider } from './shared/components/Toast';
import MaintenanceScreen from './shared/components/MaintenanceScreen';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [showLoginInMaintenance, setShowLoginInMaintenance] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      // 1. Check Session Immediately (Critical: Prioritize Session Restoration)
      // We do this BEFORE any network calls so the user is not logged out during loading.
      try {
        const session = DataManager.getCurrentUser();
        if (session) {
          setUser(session);
          console.log('Session restored for:', session.username);
        }
      } catch (e) {
        console.error("Session restore failed", e);
      }

      try {
        // 2. Check Maintenance Mode from Supabase
        const { data: settings } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();

        if (settings?.value?.enabled) {
          setIsMaintenance(true);
        }

        // Subscribe to changes with cleanup
        const channelName = 'maintenance_updates_v3'; // Unique name to force fresh sub
        const channel = supabase.channel(channelName)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, (payload) => {
            console.log('App Setting Changed (Realtime):', payload);
            if (payload.new && payload.new.key === 'maintenance_mode') {
              // Handle both nested value (safe) and direct
              const newVal = payload.new.value;
              const isEnabled = newVal && typeof newVal === 'object' ? newVal.enabled : newVal === true;
              setIsMaintenance(isEnabled);
            }
          })
          .on('broadcast', { event: 'maintenance_toggled' }, (payload) => {
            console.log('Broadcast Received:', payload);
            if (payload.payload) {
              setIsMaintenance(payload.payload.enabled);
            }
          })
          .subscribe((status) => {
            console.log(`Maintenance Subscription Status (${channelName}):`, status);
          });

        // Cleanup function for the effect
        return () => {
          console.log("Unsubscribing from maintenance channel...");
          supabase.removeChannel(channel);
        };

      } catch (err) {
        console.error('App initialization error:', err);
      } finally {
        // Initialize Mock Data
        DataManager.seed();
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

  // Maintenance Check
  if (isMaintenance && (!user || user.username !== 'AseelDev')) {
    if (!user && showLoginInMaintenance) {
      return (
        <ToastProvider>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLoginInMaintenance(false)}
              style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              Back
            </button>
            <LoginPage onLogin={handleLogin} />
          </div>
        </ToastProvider>
      );
    }
    return (
      <div onClick={(e) => {
        // Secret 5-tap to show login if needed, OR just a hidden button
        // I'll add a subtle clickable area in the MaintenanceScreen component?
        // User requested "AseelDev user shows settings to hide/show".
        // Here I simply show maintenance.
        // How does AseelDev login?
        // Visual trick: A specific key combo or just clicking a specific pixel?
        // For now, I'll pass a prop to MaintenanceScreen to allow a "Developer Login" trigger.
      }}>
        <MaintenanceScreen onDevLogin={() => setShowLoginInMaintenance(true)} />
      </div>
    );
  }

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
