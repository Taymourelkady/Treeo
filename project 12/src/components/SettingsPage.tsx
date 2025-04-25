import React from 'react';
import { ChevronDown, Bell, Lock, UserCircle, Globe, Palette, ArrowLeft } from 'lucide-react';
import type { Profile } from '../lib/types';

interface SettingsPageProps {
  profile: Profile;
  onBack: () => void;
}

const SettingsPage = ({ profile, onBack }: SettingsPageProps) => {
  const [selectedTab, setSelectedTab] = React.useState('profile');
  
  return (
    <div className="settings-container">
      <header className="settings-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h1>Settings</h1>
      </header>

      <div className="settings-content">
        <div className="settings-sidebar">
          <div className="user-info">
            <div className="avatar">
              {profile.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-details">
              <h3>{profile.email.split('@')[0]}</h3>
              <span>{profile.email}</span>
            </div>
          </div>

          <nav className="settings-nav">
            <button 
              className={`nav-item ${selectedTab === 'profile' ? 'active' : ''}`}
              onClick={() => setSelectedTab('profile')}
            >
              <UserCircle size={16} />
              Profile
            </button>
            <button 
              className={`nav-item ${selectedTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setSelectedTab('notifications')}
            >
              <Bell size={16} />
              Notifications
            </button>
            <button 
              className={`nav-item ${selectedTab === 'security' ? 'active' : ''}`}
              onClick={() => setSelectedTab('security')}
            >
              <Lock size={16} />
              Security
            </button>
            <button 
              className={`nav-item ${selectedTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setSelectedTab('appearance')}
            >
              <Palette size={16} />
              Appearance
            </button>
            <button 
              className={`nav-item ${selectedTab === 'language' ? 'active' : ''}`}
              onClick={() => setSelectedTab('language')}
            >
              <Globe size={16} />
              Language
            </button>
          </nav>
        </div>

        <div className="settings-main">
          {selectedTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Settings</h2>
              <div className="form-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  value={profile.email.split('@')[0]}
                  className="settings-input"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={profile.email}
                  className="settings-input"
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea 
                  className="settings-input"
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>
              <button className="save-button">
                Save Changes
              </button>
            </div>
          )}

          {selectedTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <div className="notification-group">
                <label className="notification-option">
                  <input type="checkbox" defaultChecked />
                  <span>Email notifications for new mentions</span>
                </label>
                <label className="notification-option">
                  <input type="checkbox" defaultChecked />
                  <span>Dashboard activity updates</span>
                </label>
                <label className="notification-option">
                  <input type="checkbox" />
                  <span>Weekly analytics report</span>
                </label>
                <label className="notification-option">
                  <input type="checkbox" defaultChecked />
                  <span>Security alerts</span>
                </label>
              </div>
            </div>
          )}

          {selectedTab === 'security' && (
            <div className="settings-section">
              <h2>Security Settings</h2>
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  className="settings-input"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="settings-input"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  className="settings-input"
                />
              </div>
              <button className="save-button">
                Update Password
              </button>
            </div>
          )}

          {selectedTab === 'appearance' && (
            <div className="settings-section">
              <h2>Appearance Settings</h2>
              <div className="theme-options">
                <label className="theme-option">
                  <input 
                    type="radio" 
                    name="theme" 
                    value="system"
                    defaultChecked 
                  />
                  <div className="theme-preview system">
                    <span>System</span>
                  </div>
                </label>
                <label className="theme-option">
                  <input 
                    type="radio" 
                    name="theme" 
                    value="light" 
                  />
                  <div className="theme-preview light">
                    <span>Light</span>
                  </div>
                </label>
                <label className="theme-option">
                  <input 
                    type="radio" 
                    name="theme" 
                    value="dark" 
                  />
                  <div className="theme-preview dark">
                    <span>Dark</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {selectedTab === 'language' && (
            <div className="settings-section">
              <h2>Language Settings</h2>
              <div className="form-group">
                <label>Select Language</label>
                <select className="settings-input">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="ru">Русский</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </div>
              <button className="save-button">
                Save Language
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .settings-container {
          height: 100vh;
          background: var(--background-darker);
          color: white;
          display: flex;
          flex-direction: column;
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .settings-header h1 {
          font-size: 1.25rem;
          font-weight: 500;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .settings-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .settings-sidebar {
          width: 240px;
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
        }

        .user-info {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: var(--primary-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .user-details h3 {
          color: white;
          margin: 0;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .user-details span {
          color: var(--text-light);
          font-size: 0.75rem;
        }

        .settings-nav {
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          border-radius: 0.375rem;
          transition: all 0.2s;
          text-align: left;
        }

        .nav-item:hover {
          background: var(--hover-bg);
          color: white;
        }

        .nav-item.active {
          background: var(--primary-color);
          color: white;
        }

        .settings-main {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        .settings-section {
          max-width: 600px;
        }

        .settings-section h2 {
          font-size: 1.25rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-group label {
          display: block;
          color: var(--text-light);
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .settings-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: white;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .settings-input:focus {
          outline: none;
          border-color: var(--primary-color);
          background: var(--background-darker);
        }

        textarea.settings-input {
          min-height: 100px;
          resize: vertical;
        }

        .save-button {
          padding: 0.75rem 1.5rem;
          background: var(--primary-color);
          border: none;
          border-radius: 0.375rem;
          color: white;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-button:hover {
          background: var(--secondary-color);
        }

        .notification-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notification-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .notification-option input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid var(--border-color);
          background: var(--background-dark);
          cursor: pointer;
        }

        .theme-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .theme-option {
          cursor: pointer;
        }

        .theme-option input[type="radio"] {
          display: none;
        }

        .theme-preview {
          height: 120px;
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .theme-preview.system {
          background: linear-gradient(135deg, var(--background-dark) 50%, white 50%);
        }

        .theme-preview.light {
          background: white;
          color: black;
        }

        .theme-preview.dark {
          background: var(--background-dark);
        }

        .theme-option input[type="radio"]:checked + .theme-preview {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;