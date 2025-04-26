import React from 'react';
import { MessageSquare, FileCode, Heading as Headset, UserCog, LayoutGrid, Users, DollarSign, Share2, UserSquare, Package, ArrowLeftRight, MoreVertical, Palmtree, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import ShareDialog from './ShareDialog';
import CreateGroupModal from './CreateGroupModal';
import { MetricsService, type MetricGroup, MetricsError } from '../lib/metricsService';
import { DashboardService, type Dashboard, DashboardError } from '../lib/dashboardService';
import type { Profile } from '../lib/types';

interface SidebarProps {
  profile: Profile;
  mode: 'chat' | 'scientist';
  onModeChange: (mode: 'chat' | 'scientist') => void;
  onQuerySelect?: (queryName: string) => void;
  onViewChange?: (view: 'chat' | 'dashboard' | 'customers' | 'revenue' | 'metrics', title: string, groupId?: string) => void;
}

const Sidebar = ({ profile, mode, onModeChange, onViewChange, onQuerySelect }: SidebarProps) => {
  const [activeItem, setActiveItem] = React.useState('chat');
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [shareDialog, setShareDialog] = React.useState<{ isOpen: boolean; title: string }>({ isOpen: false, title: '' });
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [metricGroups, setMetricGroups] = React.useState<MetricGroup[]>([]);
  const [loadingMetrics, setLoadingMetrics] = React.useState(true);
  const [dashboards, setDashboards] = React.useState<Dashboard[]>([]);
  const [loadingDashboards, setLoadingDashboards] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [queries, setQueries] = React.useState<Array<{ id: string; name: string; timestamp: string; icon?: React.ReactNode }>>([
    { 
      id: 'supplier-query',
      name: 'Supplier Query',
      timestamp: '9:00:00 AM',
      icon: <FileCode size={24} />
    },
    {
      id: 'customer-support',
      name: 'Customer Support',
      timestamp: '9:30:00 AM',
      icon: <Headset size={24} />
    },
    {
      id: 'personal-query',
      name: 'Personal Query',
      timestamp: '10:00:00 AM',
      icon: <UserCog size={24} />
    }
  ]);
  const [trainingSessions, setTrainingSessions] = React.useState<Array<{ id: string; name: string; timestamp: string }>>([]);

  const addNewQuery = () => {
    const timestamp = new Date().toLocaleTimeString();
    const newQuery = {
      id: `query-${Date.now()}`,
      name: `Query ${timestamp}`,
      timestamp
    };
    setQueries([newQuery, ...queries]);
    setActiveItem(newQuery.id);
    onQuerySelect?.('');
  };

  const addNewTrainingSession = () => {
    const timestamp = new Date().toLocaleTimeString();
    const newSession = {
      id: `training-${Date.now()}`,
      name: `Training Session ${timestamp}`,
      timestamp
    };
    setTrainingSessions([newSession, ...trainingSessions]);
    setActiveItem(newSession.id);
    onQuerySelect?.('New Training Session');
  };

  const addNewDashboard = () => {
    const timestamp = new Date().toLocaleTimeString();
    const title = `Dashboard ${timestamp}`;
    
    DashboardService.createDashboard({
      title,
      user_id: profile.id,
      creation_method: 'chat',
      is_public: false
    })
    .then(dashboard => {
      setDashboards(prev => [dashboard, ...prev]);
      setActiveItem(dashboard.id);
      onViewChange?.('dashboard', dashboard.title);
    })
    .catch(error => {
      console.error('Failed to create dashboard:', error);
      setError(error instanceof DashboardError ? error.message : 'Failed to create dashboard');
    });
  };

  const fetchDashboards = React.useCallback(async () => {
    try {
      setLoadingDashboards(true);
      setError(null);
      const data = await DashboardService.getDashboards();
      setDashboards(data);
    } catch (error) {
      console.error('Failed to fetch dashboards:', error);
      setError(error instanceof DashboardError ? error.message : 'Failed to load dashboards');
    } finally {
      setLoadingDashboards(false);
    }
  }, []);

  const fetchMetricGroups = React.useCallback(async () => {
    try {
      setLoadingMetrics(true);
      const data = await MetricsService.getMetricsByGroup();
      setMetricGroups(data);
    } catch (error) {
      console.error('Failed to fetch metric groups:', error);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMetricGroups();
    fetchDashboards();
  }, [fetchMetricGroups]);

  const handleMenuClick = (e: React.MouseEvent, menuId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setActiveMenu(null);
  };

  const handleRename = (id: string, type: 'dashboard' | 'metric' | 'query') => {
    if (editingName.trim()) {
      switch (type) {
        case 'dashboard':
          DashboardService.updateDashboard(id, { title: editingName })
            .then(() => {
              setDashboards(prev => prev.map(d => 
                d.id === id ? { ...d, title: editingName } : d
              ));
              setEditingId(null);
              setEditingName('');
            })
            .catch(error => {
              console.error('Failed to rename dashboard:', error);
              setError(error instanceof DashboardError ? error.message : 'Failed to rename dashboard');
            });
          break;
        case 'metric':
          setMetrics(metrics.map(m => 
            m.id === id ? { ...m, name: editingName } : m
          ));
          break;
        case 'query':
          setQueries(queries.map(q => 
            q.id === id ? { ...q, name: editingName } : q
          ));
          break;
      }
      setEditingId(null);
      setEditingName('');
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu && !(event.target as Element).closest('.menu-container')) {
        setActiveMenu(null);
      }
      if (editingId && !(event.target as Element).closest('.editing')) {
        setEditingId(null);
        setEditingName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  return (
    <aside className="sidebar">
      <div className="logo">
        <Palmtree size={38} className="logo-icon" />
        <span>Tree</span>
      </div>
      
      <nav className="nav-menu">
        {mode === 'chat' ? (
          <div>
            <div className="nav-section">
              <button 
                className="new-chat-button"
                onClick={() => {
                  setActiveItem('chat');
                  onViewChange?.('chat', '');
                }}
              >
                <MessageSquare size={16} />
                <span>New Chat</span>
              </button>
              <h3>RECENT CHATS</h3>
              <a 
                href="#" 
                className={`nav-item ${activeItem === 'recent-chat' ? 'active' : ''}`} 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveItem('recent-chat');
                  onViewChange?.('chat', '');
                }}
              >
                <MessageSquare size={20} />
                <span>Chat 9:01:52 AM</span>
              </a>
            </div>

            <div className="nav-section">
              <div className="section-header">
                <h3>Dashboards</h3>
                <button className="add-button" onClick={addNewDashboard}>
                  +
                </button>
              </div>
              {loadingDashboards ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <span>Loading dashboards...</span>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>{error}</p>
                  <button onClick={fetchDashboards} className="retry-button">
                    Try Again
                  </button>
                </div>
              ) : dashboards.length === 0 ? (
                <div className="empty-state">
                  <p>No dashboards yet</p>
                  <button onClick={addNewDashboard} className="create-button">
                    Create Your First Dashboard
                  </button>
                </div>
              ) : dashboards.map((dashboard) => (
                <div key={dashboard.id} className="nav-item-container">
                  <button 
                    onClick={() => {
                      setActiveItem(dashboard.id);
                      onViewChange?.('dashboard', dashboard.title);
                    }} 
                    className={`nav-item ${activeItem === dashboard.id ? 'active' : ''}`}
                  >
                    <LayoutGrid size={20} />
                    {editingId === dashboard.id ? (
                      <input
                        className="rename-input editing"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRename(dashboard.id, 'dashboard');
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span>{dashboard.title}</span>
                    )}
                  </button>
                  <div className="menu-container">
                    <button
                      className="menu-trigger"
                      onClick={(e) => handleMenuClick(e, dashboard.id)}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenu === dashboard.id && (
                      <div className="menu-dropdown">
                        <button 
                          className="menu-item"
                          onClick={() => startEditing(dashboard.id, dashboard.title)}
                        >
                          <Pencil size={16} />
                          Rename
                        </button>
                        <button 
                          className="menu-item"
                          onClick={() => {
                            setShareDialog({ isOpen: true, title: dashboard.title });
                            setActiveMenu(null);
                          }}
                        >
                          Manage Access
                        </button>
                        <button className="menu-item">Duplicate</button>
                        <button 
                          className="menu-item delete"
                          onClick={() => {
                            DashboardService.deleteDashboard(dashboard.id)
                              .then(() => {
                                setDashboards(prev => prev.filter(d => d.id !== dashboard.id));
                                setActiveMenu(null);
                              })
                              .catch(error => {
                                console.error('Failed to delete dashboard:', error);
                                setError(error instanceof DashboardError ? error.message : 'Failed to delete dashboard');
                              });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="nav-section">
              <div className="section-header">
                <h3>Metrics Dictionary</h3>
                <button className="add-button" onClick={() => setShowCreateGroup(true)}>
                  +
                </button>
              </div>
              {loadingMetrics ? (
                <div className="loading-state">
                  <div className="loading-spinner" />
                  <span>Loading metrics...</span>
                </div>
              ) : (
                metricGroups.map((group) => (
                  <div key={group.id} className="metric-group">
                    <div className="nav-item-container">
                      <button 
                        className={`nav-item ${activeItem === group.id ? 'active' : ''}`}
                        onClick={() => {
                          // Clear any existing selection first
                          setActiveItem('');
                          // Then set the new active item after a brief delay
                          setTimeout(() => {
                          setActiveItem(group.id);
                          onViewChange?.('metrics', group.name, group.id);
                          }, 50);
                        }}
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Share2 size={20} />
                        <span>{group.name}</span>
                      </button>
                      <div className="menu-container">
                        <button
                          className="menu-trigger"
                          onClick={(e) => handleMenuClick(e, group.id)}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenu === group.id && (
                          <div className="menu-dropdown">
                            <button 
                              className="menu-item"
                              onClick={() => {
                                setShareDialog({ isOpen: true, title: group.name });
                                setActiveMenu(null);
                              }}
                            >
                              <Share2 size={20} />
                              Manage Access
                            </button>
                            <button 
                              className="menu-item"
                              onClick={() => startEditing(group.id, group.name)}
                            >
                              <Pencil size={16} />
                              Rename
                            </button>
                            <button 
                              className="menu-item delete"
                              onClick={() => {
                                MetricsService.deleteMetricGroup(group.id)
                                  .then(() => {
                                    setMetricGroups(prev => prev.filter(g => g.id !== group.id));
                                    setActiveMenu(null);
                                  })
                                  .catch(error => {
                                    console.error('Failed to delete metric group:', error);
                                    setError(error instanceof MetricsError ? error.message : 'Failed to delete metric group');
                                  });
                              }}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="nav-section">
              <div className="section-header">
                <h3>Database</h3>
              </div>
              <div className="database-items">
                <a
                  href="#"
                  className={`nav-item ${activeItem === 'tables' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem('tables');
                    onQuerySelect?.('Tables');
                  }}
                >
                  <Package size={16} />
                  <span>Tables</span>
                </a>
                <a
                  href="#"
                  className={`nav-item ${activeItem === 'relationships' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem('relationships');
                    onQuerySelect?.('Relationships');
                  }}
                >
                  <Share2 size={16} />
                  <span>Relationships</span>
                </a>
              </div>
            </div>

            <div className="nav-section">
              <div className="section-header">
                <h3>Queries</h3>
                <button className="add-button" onClick={addNewQuery}>
                  +
                </button>
              </div>
              {queries.map((query) => (
                <a
                  key={query.id}
                  href="#"
                  className={`nav-item ${activeItem === query.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem(query.id);
                    onQuerySelect?.(query.name);
                  }}
                >
                  {query.icon || <FileCode size={16} />}
                  {editingId === query.id ? (
                    <input
                      className="rename-input editing"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRename(query.id, 'query');
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span>{query.name}</span>
                  )}
                  <div className="menu-container">
                    <button
                      className="menu-trigger"
                      onClick={(e) => handleMenuClick(e, query.id)}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeMenu === query.id && (
                      <div className="menu-dropdown">
                        <button 
                          className="menu-item"
                          onClick={() => startEditing(query.id, query.name)}
                        >
                          <Pencil size={16} />
                          Rename
                        </button>
                        <button className="menu-item">Duplicate</button>
                        <button className="menu-item delete">Delete</button>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
            
            <div className="nav-section">
              <div className="section-header">
                <h3>Schema Health</h3>
              </div>
              <div className="schema-issues">
                <a
                  href="#"
                  className={`nav-item warning ${activeItem === 'naming-issue' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem('naming-issue');
                    onQuerySelect?.('New Training Session');
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>Ambiguous Column Names (3)</span>
                </a>
                <a
                  href="#"
                  className={`nav-item error ${activeItem === 'fk-issue' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem('fk-issue');
                    onQuerySelect?.('New Training Session');
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>Missing Foreign Keys (2)</span>
                </a>
                <a
                  href="#"
                  className={`nav-item warning ${activeItem === 'hygiene-issue' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveItem('hygiene-issue');
                    onQuerySelect?.('New Training Session');
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>Data Hygiene Issues (4)</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      <button 
        onClick={() => {
          const newMode = mode === 'chat' ? 'scientist' : 'chat';
          onModeChange(newMode);
          if (newMode === 'scientist') {
            setActiveItem('new-query');
          }
        }}
        className="mode-switch-button"
      >
        <ArrowLeftRight size={16} />
        <span>Switch to {mode === 'chat' ? 'Scientist' : 'Chat'} Mode</span>
      </button>
      
      <ShareDialog 
        isOpen={shareDialog.isOpen}
        onClose={() => setShareDialog({ isOpen: false, title: '' })}
        title={shareDialog.title}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSuccess={() => {
          fetchMetricGroups();
        }}
        userId={profile.id}
      />

      <style>{`
        .sidebar {
          width: 260px;
          background: var(--background-dark);
          color: white;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .new-chat-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--primary-color);
          border: none;
          border-radius: 0.375rem;
          color: white;
          width: 100%;
          cursor: pointer;
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 600;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .logo-icon {
          color: white;
        }
        
        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .nav-section h3 {
          font-size: 0.875rem;
          color: var(--text-light);
          text-transform: uppercase;
          margin-top: 1rem;
          margin-bottom: 1rem;
          font-family: ${mode === 'scientist' ? 'monospace' : 'inherit'};
        }
        
        .database-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .add-button {
          background: none;
          border: none;
          color: var(--text-light);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
        }
        
        .add-button:hover {
          background: var(--hover-bg);
          color: white;
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.5rem 1.5rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          text-decoration: none;
          width: calc(100% + 3rem);
          margin-left: -1.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
          font-size: 0.875rem;
          font-family: ${mode === 'scientist' ? 'monospace' : 'inherit'};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-item svg {
          width: 20px;
          height: 20px;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }
        
        .nav-item:hover {
          background: var(--hover-bg);
          color: white;
        }
        
        .nav-item.active {
          background: #0C310A;
          color: white;
          border-radius: 0;
        }
        
        .nav-item.warning {
          color: #eab308;
        }
        
        .nav-item.error {
          color: #ef4444;
        }
        
        .schema-issues {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-right: 1.5rem;
        }

        .nav-item-container .nav-item {
          flex: 1;
        }

        .rename-input {
          background: transparent;
          border: none;
          color: white;
          font-size: 0.875rem;
          width: 100%;
          padding: 0;
          outline: none;
          font-family: inherit;
        }

        .menu-container {
          position: relative;
        }

        .menu-trigger {
          background: transparent;
          border: none;
          color: var(--text-light);
          padding: 0.25rem;
          border-radius: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nav-item-container:hover .menu-trigger {
          opacity: 1;
        }

        .menu-trigger:hover {
          background: var(--hover-bg);
          color: white;
        }

        .menu-dropdown {
          position: absolute;
          top: 0;
          right: 100%;
          margin-right: 0.5rem;
          background: var(--background-darker);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          overflow: hidden;
          min-width: 160px;
          z-index: 100;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .menu-item {
          width: 100%;
          text-align: left;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .menu-item:hover {
          background: var(--hover-bg);
          color: white;
        }

        .menu-item.delete {
          color: #ef4444;
        }

        .menu-item.delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .mode-switch-button {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: transparent;
          border: 1px solid #45B619;
          border-radius: 0.375rem;
          color: #45B619;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-switch-button:hover {
          background: rgba(69, 182, 25, 0.1);
        }
        
        .mode-switch-button svg {
          color: #45B619;
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          color: var(--text-light);
          font-size: 0.875rem;
        }

        .loading-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .metric-count {
          margin-left: auto;
          background: var(--background-darker);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-light);
        }

        .error-state {
          padding: 1rem 1.5rem;
          color: #ef4444;
          font-size: 0.875rem;
        }

        .retry-button {
          display: block;
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: none;
          border-radius: 0.375rem;
          color: #ef4444;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .empty-state {
          padding: 1rem 1.5rem;
          color: var(--text-light);
          font-size: 0.875rem;
          text-align: center;
        }

        .create-button {
          display: block;
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--primary-color);
          border: none;
          border-radius: 0.375rem;
          color: white;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .create-button:hover {
          background: var(--secondary-color);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;