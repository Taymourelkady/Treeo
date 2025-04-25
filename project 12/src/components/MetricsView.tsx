import React from 'react';
import { ChevronDown, Plus, Share2, LineChart, BarChart, PieChart, Activity, LayoutDashboard, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { Profile } from '../lib/types';
import { MetricsService, type MetricGroup } from '../lib/metricsService';
import { DashboardService } from '../lib/dashboardService';
import { getVisualizationLabel } from '../lib/chartDetection';
import AddMetricModal from './AddMetricModal';
import ShareDialog from './ShareDialog';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface MetricsViewProps {
  profile: Profile;
  title: string;
  selectedGroupId?: string;
  isNew?: boolean;
  onViewChange?: (view: 'dashboard', title: string) => void;
}

interface NewMetric {
  name: string;
  abbreviation: string;
  description: string;
  calculation_method: string;
  group_id: string;
}

const MetricsView = ({ profile, title, selectedGroupId, isNew = false, onViewChange }: MetricsViewProps) => {
  const [showNewMetric, setShowNewMetric] = React.useState(isNew);
  const [metricGroups, setMetricGroups] = React.useState<MetricGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = React.useState<MetricGroup | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [shareDialog, setShareDialog] = React.useState<{ isOpen: boolean; title: string }>({ isOpen: false, title: '' });
  const [editingMetric, setEditingMetric] = React.useState<Metric | null>(null);
  const successTimeoutRef = React.useRef<number>();
  const refreshTimeoutRef = React.useRef<number>();
  const menuRef = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await MetricsService.getMetricsByGroup();
      setMetricGroups(data);
      
      // If we have a selectedGroupId, find and set the selected group
      if (selectedGroupId) {
        const group = data.find(g => g.id === selectedGroupId);
        setSelectedGroup(group || null);
      }
    } catch (error) {
      setError(error instanceof MetricsError ? error.message : 'Failed to load metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  React.useEffect(() => {
    refresh();
    
    return () => {
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [refresh]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) {
      window.clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
    
    // Schedule a refresh after showing success message
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = window.setTimeout(refresh, 500);
  };

  const handleCreateMetric = async (metric: {
    name: string;
    abbreviation: string;
    calculation_method: string;
    description?: string;
    group_id: string;
  }) => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Create the metric
      await MetricsService.createMetric({
        ...metric,
        user_id: profile.id,
        is_public: false
      });

      // Close modal and show success message
      setShowNewMetric(false);
      showSuccess('Metric created successfully!');
      
      // Refresh the metrics list
      await refresh();
    } catch (error) {
      setError(error instanceof MetricsError ? error.message : 'Failed to create metric. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDashboard = async (groupId: string) => {
    try {
      const dashboard = await DashboardService.createFromMetricGroup(groupId, profile.id);
      onViewChange?.('dashboard', dashboard.title);
    } catch (error) {
      setError(error instanceof MetricsError ? error.message : 'Failed to create dashboard');
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    try {
      await MetricsService.deleteMetric(metricId);
      showSuccess('Metric deleted successfully!');
      setActiveMenu(null);
      await refresh();
    } catch (error) {
      setError(error instanceof MetricsError ? error.message : 'Failed to delete metric');
    }
  };

  const handleEditMetric = async (metric: Metric) => {
    try {
      await MetricsService.updateMetric(metric.id, {
        name: metric.name,
        abbreviation: metric.abbreviation,
        description: metric.description,
        calculation_method: metric.calculation_method,
        visualization_type: metric.visualization_type,
        time_granularity: metric.time_granularity,
        formatting: metric.formatting
      });
      showSuccess('Metric updated successfully!');
      setActiveMenu(null);
      setEditingMetric(null);
      await refresh();
    } catch (error) {
      setError(error instanceof MetricsError ? error.message : 'Failed to update metric');
    }
  };

  return (
    <div className="metrics-container">
      <header className="top-header">
        <div className="header-left">
          <button className="access-level">
            Admin
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="user-info">
          <div className="user-details">
            <h3>{profile.email.split('@')[0]}</h3>
            <span>{profile.email}</span>
          </div>
          <div className="avatar">{profile.email.substring(0, 2).toUpperCase()}</div>
        </div>
      </header>

      <div className="metrics-content">
        <div className="content-header">
          <div>
            <h1>{title}</h1>
            <p className="subtitle">Key performance indicators and their definitions</p>
          </div>
          <button className="add-metric-button" onClick={() => setShowNewMetric(true)}>
            <Plus size={16} />
            Add Metric
          </button>
        </div>

        <div className="metrics-card">
          <AddMetricModal
            isOpen={showNewMetric || isNew}
            onClose={() => setShowNewMetric(false)}
            onSubmit={handleCreateMetric}
            groups={metricGroups}
            selectedGroupId={selectedGroup?.id}
            submitting={submitting || false}
            error={error}
          />

          {!isNew && (
            loading ? (
              <div className="loading">
                <div className="loading-spinner" />
                <span>Loading metrics...</span>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
                <button className="retry-button" onClick={() => refresh()}>
                  Try Again
                </button>
              </div>
            ) : (
              <React.Fragment>
                {metricGroups?.length > 0 ? (
                  // Show only selected group if one is selected, otherwise show all groups
                  (selectedGroup ? [selectedGroup] : metricGroups).map((group) => (
                    <div key={group.id}>
                    <div className="metrics-header">
                      <h2>{group.name}</h2>
                      <button
                        className="create-dashboard-button"
                        onClick={() => handleCreateDashboard(group.id)}
                      >
                        <LayoutDashboard size={16} />
                        Create Dashboard
                      </button>
                    </div>
                    {group.metrics.length > 0 ? (
                      <div className={`metrics-list ${group.name.toLowerCase().replace(/\s+/g, '-')}-list`}>
                        {group.metrics.map((metric) => (
                          <div key={metric.id} className={`metric-item ${group.name.toLowerCase().replace(/\s+/g, '-')}-item`}>
                            <div className="metric-content">
                              <h3>{metric.name}</h3>
                              <div>
                                {metric.visualization_type === 'line' && (
                                  <Line
                                    data={{
                                      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                                      datasets: [{
                                        label: metric.name,
                                        data: [65, 59, 80, 81, 56, 55],
                                        borderColor: '#167147',
                                        tension: 0.4,
                                        pointRadius: 0,
                                        borderWidth: 2,
                                        fill: false
                                      }]
                                    }}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      plugins: {
                                        legend: {
                                          display: false
                                        }
                                      },
                                      scales: {
                                        x: {
                                          grid: {
                                            display: false
                                          },
                                          ticks: {
                                            color: '#94a3b8'
                                          }
                                        },
                                        y: {
                                          grid: {
                                            color: 'rgba(255, 255, 255, 0.1)'
                                          },
                                          ticks: {
                                            color: '#94a3b8'
                                          }
                                        }
                                      }
                                    }}
                                  />
                                )}
                                {metric.visualization_type === 'bar' && (
                                  <Bar
                                    data={{
                                      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                                      datasets: [{
                                        label: metric.name,
                                        data: [65, 59, 80, 81],
                                        backgroundColor: [
                                          '#167147',
                                          '#4E7BE9',
                                          '#4EE997',
                                          '#E94E7B'
                                        ]
                                      }]
                                    }}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      plugins: {
                                        legend: {
                                          display: false
                                        }
                                      },
                                      scales: {
                                        x: {
                                          grid: {
                                            display: false
                                          },
                                          ticks: {
                                            color: '#94a3b8'
                                          }
                                        },
                                        y: {
                                          grid: {
                                            color: 'rgba(255, 255, 255, 0.1)'
                                          },
                                          ticks: {
                                            color: '#94a3b8'
                                          }
                                        }
                                      }
                                    }}
                                  />
                                )}
                                {metric.visualization_type === 'pie' && (
                                  <Pie
                                    data={{
                                      labels: ['Category A', 'Category B', 'Category C'],
                                      datasets: [{
                                        data: [30, 50, 20],
                                        backgroundColor: [
                                          '#167147',
                                          '#4E7BE9',
                                          '#4EE997'
                                        ]
                                      }]
                                    }}
                                    options={{
                                      responsive: true,
                                      maintainAspectRatio: false,
                                      plugins: {
                                        legend: {
                                          position: 'right',
                                          labels: {
                                            color: '#94a3b8',
                                            font: {
                                              size: 11
                                            }
                                          }
                                        }
                                      }
                                    }}
                                  />
                                )}
                                {metric.visualization_type === 'metric' && (
                                  <div className="single-metric">
                                    <div className="metric-value">
                                      {metric.formatting?.prefix || ''}{Math.floor(Math.random() * 1000)}{metric.formatting?.suffix || ''}
                                    </div>
                                    <div className="metric-trend positive">
                                      +12.5% from last {metric.time_granularity}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {metric.description && (
                                <p className="metric-description">{metric.description}</p>
                              )}
                              <div className="metric-details">
                                {metric.calculation_method && (
                                  <p className="calculation-method">{metric.calculation_method}</p>
                                )}
                                <div className="metric-acronym">{metric.abbreviation}</div>
                              </div>
                            </div>
                            <div className="metric-actions" ref={menuRef}>
                              <button
                                className="menu-trigger"
                                onClick={() => setActiveMenu(activeMenu === metric.id ? null : metric.id)}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeMenu === metric.id && (
                                <div className="menu-dropdown">
                                  <button 
                                    className="menu-item"
                                    onClick={() => {
                                      setEditingMetric(metric);
                                      setActiveMenu(null);
                                    }}
                                  >
                                    <Pencil size={16} />
                                    Edit
                                  </button>
                                  <button 
                                    className="menu-item delete"
                                    onClick={() => handleDeleteMetric(metric.id)}
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-metrics">
                        <p>No metrics found in this group</p>
                        <p className="empty-metrics-hint">Click "Add Metric" above to create one</p>
                      </div>
                    )}
                    </div>
                  ))
                ) : (
                  <div className="no-metrics">
                    <p>No metrics found. Click "Add Metric" to create one.</p>
                  </div>
                )}
              </React.Fragment>
            )
          )}
        </div>
      </div>
      
      <AddMetricModal
        isOpen={!!editingMetric}
        onClose={() => setEditingMetric(null)}
        onSubmit={async (updates) => {
          if (editingMetric) {
            await handleEditMetric({
              ...editingMetric,
              ...updates
            });
          }
        }}
        groups={metricGroups}
        selectedGroupId={editingMetric?.group_id}
        initialValues={editingMetric || undefined}
      />

      <style>{`
        .empty-metrics {
          padding: 2rem;
          text-align: center;
          color: var(--text-light);
        }
        
        .empty-metrics-hint {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: var(--text-light);
          font-style: italic;
        }
      `}</style>

      <style>{`
        .metrics-container {
          height: 100vh;
          background: var(--background-darker);
          color: white;
          display: flex;
          flex-direction: column;
        }

        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: var(--background-darker);
          border-bottom: 1px solid var(--border-color);
        }

        .header-left {
          display: flex;
          align-items: center;
        }

        .access-level {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
        }

        .access-level:hover {
          background: var(--hover-bg);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-direction: row-reverse;
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
          font-size: 1rem;
          text-align: right;
        }
        
        .user-details span {
          color: var(--text-light);
          font-size: 0.875rem;
          text-align: right;
          display: block;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .content-header h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: var(--text-light);
          font-size: 0.875rem;
        }

        .add-metric-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--background-dark);
          border: none;
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          border: 1px solid var(--border-color);
        }

        .metrics-content {
          padding: 2rem 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .metrics-card {
          background: var(--background-dark);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .new-metric-form {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          background: var(--background-darker);
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

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: white;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .form-group select {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: white;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .metric-input:focus {
          outline: none;
          border-color: var(--primary-color);
          background: var(--background-darker);
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: var(--text-light);
        }
        
        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 0.375rem;
        }
        
        .success-message {
          color: #4ade80;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(74, 222, 128, 0.1);
          border-radius: 0.375rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .cancel-button {
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
        }

        .submit-button {
          padding: 0.75rem 1.5rem;
          background: var(--primary-color);
          border: none;
          border-radius: 0.375rem;
          color: white;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .cancel-button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .submit-button:hover {
          background: var(--secondary-color);
        }

        .metrics-header {
          padding: 2rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metrics-header h2 {
          font-size: 1rem;
          color: var(--primary-color);
          font-weight: 500;
        }
        
        .create-dashboard-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--primary-color);
          border: none;
          border-radius: 0.5rem;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .create-dashboard-button:hover {
          background: var(--secondary-color);
        }

        .add-metric-button {
          color: var(--primary-color);
          border-color: var(--primary-color);
        }

        .metrics-list {
          padding: 1rem 0;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .metric-item:last-child {
          border-bottom: none;
        }

        .metric-content {
          flex: 1;
          padding-right: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .metric-content h3 {
          font-size: 1rem;
          font-weight: 500;
          color: white;
        }

        .metric-description {
          color: var(--text-light);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .calculation-method {
          color: var(--text-light);
          font-size: 0.75rem;
          font-family: monospace;
          flex: 1;
        }

        .metric-details {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .metric-acronym {
          padding: 0.25rem 0.5rem;
          background: rgba(233, 127, 78, 0.1);
          color: var(--primary-color);
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          flex-shrink: 0;
        }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .metric-item {
          background: var(--background-dark);
          border-radius: 0.5rem;
          padding: 1.25rem;
          border: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          position: relative;
          min-height: 200px;
        }

        .metric-actions {
          position: relative;
          z-index: 10;
        }
        
        .metric-chart {
          height: 150px;
          margin: 1rem 0;
        }
        
        .single-metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
        }
        
        .metric-value {
          font-size: 2.5rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.5rem;
        }
        
        .metric-trend {
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .metric-trend.positive {
          color: #4ade80;
        }
        
        .metric-trend.negative {
          color: #f87171;
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
          opacity: 0.5;
          transition: opacity 0.2s;
        }

        .metric-item:hover .menu-trigger {
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

        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .metric-header h3 {
          font-size: 1.125rem;
          font-weight: 500;
        }

        .metric-description {
          color: var(--text-light);
          font-size: 0.875rem;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .metric-stats {
          display: flex;
          gap: 2rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .label {
          font-size: 0.75rem;
          color: var(--text-light);
          text-transform: uppercase;
        }

        .value {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
        }

        .tren
d.positive {
          color: #4ade80;
        }

        .trend.negative {
          color: #f87171;
        }

        .no-metrics-message {
          padding: 1rem 1.5rem;
          color: var(--text-light);
          font-size: 0.875rem;
          text-align: center;
          font-style: italic;
        }

        .no-metrics {
          padding: 2rem;
          text-align: center;
          color: var(--text-light);
        }

        .loading {
          padding: 2rem;
          text-align: center;
          color: var(--text-light);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .button-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .no-metrics {
          padding: 2rem;
          text-align: center;
          color: var(--text-light);
        }

        .visualization-type {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-light);
          font-size: 0.75rem;
          margin-top: 0.5rem;
        }

        .visualization-type svg {
          color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default MetricsView;