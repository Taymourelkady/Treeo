import React from 'react';
import QueryView from './QueryView';
import type { Profile } from '../lib/types';

interface ScientistModeProps {
  profile: Profile;
  queryName?: string;
  showProfileMenu: boolean;
  setShowProfileMenu: (show: boolean) => void;
  onSettingsClick: () => void;
}

const ScientistMode = ({ 
  profile, 
  queryName,
  showProfileMenu,
  setShowProfileMenu,
  onSettingsClick 
}: ScientistModeProps) => {
  const defaultQueries = {
    'Supplier Query': 'SELECT * FROM suppliers WHERE active = true;',
    'Customer Support': 'SELECT customer_id, issue_type, status FROM support_tickets;',
    'Personal Query': 'SELECT user_id, last_login FROM users WHERE department_id = 5;'
  };

  return (
    <QueryView 
      profile={profile}
      queryName={queryName} 
      showProfileMenu={showProfileMenu}
      setShowProfileMenu={setShowProfileMenu}
      onSettingsClick={onSettingsClick}
      initialQuery={queryName ? defaultQueries[queryName as keyof typeof defaultQueries] : ''} 
    />
  );
};

export default ScientistMode;