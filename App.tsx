import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClientDashboard } from './pages/ClientDashboard';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  
  // Track active role for session
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'CLIENT' | null>(null);

  // Check for saved session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('foxon_session');
    if (savedSession) {
      try {
        const { role } = JSON.parse(savedSession);
        if (role === 'ADMIN' || role === 'CLIENT') {
          setCurrentRole(role);
          setView(role === 'ADMIN' ? 'ADMIN_DASHBOARD' : 'CLIENT_DASHBOARD');
        }
      } catch (e) {
        localStorage.removeItem('foxon_session');
      }
    }
  }, []);

  const handleLoginSuccess = (role: 'ADMIN' | 'CLIENT', remember: boolean) => {
    setCurrentRole(role);
    
    if (remember) {
      localStorage.setItem('foxon_session', JSON.stringify({ 
        role, 
        timestamp: Date.now() 
      }));
    }

    if (role === 'ADMIN') {
      setView('ADMIN_DASHBOARD');
    } else {
      setView('CLIENT_DASHBOARD');
    }
  };

  const handleHome = () => {
    // Logout Logic
    localStorage.removeItem('foxon_session');
    setView('LANDING');
    setCurrentRole(null);
  };

  // Layout needs to know the active role to display correct header info
  // If we are on dashboards, use the currentRole state.
  const activeRole = (view === 'ADMIN_DASHBOARD' || view === 'CLIENT_DASHBOARD') 
    ? (currentRole || undefined)
    : undefined;

  return (
    <Layout activeRole={activeRole} onHome={handleHome} onLogout={handleHome}>
      {view === 'LANDING' && <Landing onLoginSuccess={handleLoginSuccess} />}
      
      {view === 'ADMIN_DASHBOARD' && <AdminDashboard />}
      {view === 'CLIENT_DASHBOARD' && <ClientDashboard />}
    </Layout>
  );
};

export default App;