import React from 'react';
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatMode from './components/ChatMode';
import ScientistMode from './components/ScientistMode';
import LoginPage from './components/LoginPage';
import SettingsPage from './components/SettingsPage';
import { useProfile } from './lib/hooks';
import { supabase } from './lib/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const { profile, loading: profileLoading } = useProfile();
  const [mode, setMode] = useState<'chat' | 'scientist'>('chat');
  const [view, setView] = useState<'chat' | 'dashboard' | 'customers' | 'revenue' | 'metrics'>('chat');
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [dashboardTitle, setDashboardTitle] = React.useState('Sales Overview');
  const [metricsTitle, setMetricsTitle] = React.useState('');
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | undefined>();
  const [isNewDashboard, setIsNewDashboard] = React.useState(false);
  const [isNewMetric, setIsNewMetric] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const handleSettingsClick = () => {
    setShowSettings(true);
    setShowProfileMenu(false);
  };

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    !isAuthenticated ? (
      <LoginPage onAuthSuccess={() => setIsAuthenticated(true)} />
    ) : profileLoading ? (
      <div className="loading">Loading...</div>
    ) : profile ? (
      showSettings ? (
        <SettingsPage 
          profile={profile}
          onBack={() => setShowSettings(false)}
        />
      ) : (
      <div className="app-container">
        <Sidebar 
          mode={mode} 
          profile={profile}
          onModeChange={setMode} 
          onQuerySelect={setSelectedQuery}
          onViewChange={(view, title, groupId) => {
            setSelectedGroupId(groupId);
            setView(view);
            setIsNewDashboard(title.includes(new Date().toLocaleTimeString()));
            setDashboardTitle(title);
            setIsNewMetric(title.includes(new Date().toLocaleTimeString()));
            setMetricsTitle(title);
            setSelectedGroupId(groupId);
          }} 
        />
        <main className="main-content">  
          {mode === 'chat' ? (
            <ChatMode 
              profile={profile}
              view={view} 
              showProfileMenu={showProfileMenu}
              setShowProfileMenu={setShowProfileMenu}
              onSettingsClick={handleSettingsClick}
              dashboardTitle={dashboardTitle}
              isNewDashboard={isNewDashboard}
              isNewMetric={isNewMetric}
              metricsTitle={metricsTitle} 
            />
          ) : (
            <ScientistMode 
              profile={profile} 
              queryName={selectedQuery}
              showProfileMenu={showProfileMenu}
              setShowProfileMenu={setShowProfileMenu}
              onSettingsClick={handleSettingsClick}
            />
          )}
        </main>
      </div>
      )
    ) : null
  );
}

export default App;