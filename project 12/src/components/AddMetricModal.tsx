import React from 'react';
import { X } from 'lucide-react';
import Portal from './Portal';
import { detectVisualizationType } from '../lib/chartDetection';
import { MetricsService, type MetricGroup } from '../lib/metricsService';

interface AddMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (metric: {
    name: string;
    abbreviation: string;
    calculation_method: string;
    description?: string;
    group_id: string;
  }) => Promise<void>;
  groups: MetricGroup[];
  selectedGroupId?: string;
  submitting?: boolean;
  error?: string | null;
  initialValues?: Metric;
}

const AddMetricModal = ({
  isOpen,
  onClose,
  onSubmit,
  groups,
  selectedGroupId,
  submitting = false,
  error = null,
  initialValues
}: AddMetricModalProps) => {
  const [availableGroups, setAvailableGroups] = React.useState<MetricGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = React.useState(true);
  const [groupError, setGroupError] = React.useState<string | null>(null);
  const [metric, setMetric] = React.useState({
    name: '',
    abbreviation: '',
    calculation_method: '',
    description: '',
    group_id: selectedGroupId || '',
    visualization_type: 'metric' as const,
    time_granularity: 'monthly' as const,
    formatting: {}
  });

  // Fetch all available groups when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLoadingGroups(true);
      setGroupError(null);
      
      MetricsService.getMetricGroups()
        .then(groups => {
          setAvailableGroups(groups);
          setMetric(prev => ({
            ...prev,
            group_id: selectedGroupId || groups[0]?.id || ''
          }));
        })
        .catch(error => {
          setGroupError('Failed to load metric groups');
          console.error('Error loading groups:', error);
        })
        .finally(() => {
          setLoadingGroups(false);
        });
    }
  }, [isOpen, selectedGroupId]);

  // Reset form when modal opens/closes or group selection changes
  React.useEffect(() => {
    if (isOpen) {
      setMetric(initialValues || {
        name: '',
        abbreviation: '',
        calculation_method: '',
        description: '',
        group_id: selectedGroupId || availableGroups[0]?.id || '',
        visualization_type: 'metric',
        time_granularity: 'monthly',
        formatting: {}
      });
    }
  }, [isOpen, selectedGroupId, availableGroups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (metric.name.trim()) {
      await onSubmit(metric);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>{initialValues ? 'Edit Metric' : 'Add New Metric'}</h2>
            <button className="close-button" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                id="name"
                type="text"
                value={metric.name}
                onChange={(e) => setMetric({ ...metric, name: e.target.value })}
                placeholder="e.g., Customer Retention Rate"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="abbreviation">Abbreviation *</label>
              <input
                id="abbreviation"
                type="text"
                value={metric.abbreviation}
                onChange={(e) => setMetric({ ...metric, abbreviation: e.target.value })}
                placeholder="e.g., CRR"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="group">Group *</label>
              <select
                value={metric.group_id}
                onChange={(e) => setMetric({ ...metric, group_id: e.target.value })}
                id="group"
                className="form-input"
                required
                disabled={loadingGroups}
              >
                {loadingGroups ? (
                  <option value="">Loading groups...</option>
                ) : (
                  <>
                    <option value="">Select a group</option>
                    {availableGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {groupError && (
                <div className="error-message">
                  {groupError}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="calculation">Calculation Method *</label>
              <textarea
                id="calculation"
                value={metric.calculation_method}
                onChange={(e) => {
                  const calculation_method = e.target.value;
                  const suggestedType = detectVisualizationType({ 
                    calculation_method,
                    name: metric.name
                  });
                  setMetric({ 
                    ...metric, 
                    calculation_method,
                    visualization_type: suggestedType
                  });
                }}
                placeholder="e.g., SUM(revenue) / COUNT(DISTINCT customer_id)"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="visualization">Visualization Type</label>
              <select
                id="visualization"
                value={metric.visualization_type}
                onChange={(e) => setMetric({ ...metric, visualization_type: e.target.value as 'line' | 'bar' | 'pie' | 'metric' })}
                className="form-input"
              >
                <option value="metric">Single Metric</option>
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="granularity">Time Granularity</label>
              <select
                id="granularity"
                value={metric.time_granularity}
                onChange={(e) => setMetric({ ...metric, time_granularity: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                className="form-input"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={metric.description}
                onChange={(e) => setMetric({ ...metric, description: e.target.value })}
                placeholder="Enter a clear definition of the metric..."
                className="form-input"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={submitting || loadingGroups || !metric.name.trim() || !metric.abbreviation.trim() || !metric.calculation_method.trim() || !metric.group_id}
              >
                {submitting ? (
                  <div className="button-content">
                    <div className="loading-spinner" />
                    <span>{initialValues ? 'Updating...' : 'Creating...'}</span>
                  </div>
                ) : (
                  initialValues ? 'Update Metric' : 'Create Metric'
                )}
              </button>
            </div>
          </form>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: var(--background-darker);
            border-radius: 0.5rem;
            width: 100%;
            max-width: 500px;
            overflow: hidden;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
          }

          .modal-header h2 {
            font-size: 1.125rem;
            font-weight: 500;
            color: white;
          }

          .close-button {
            background: transparent;
            border: none;
            color: var(--text-light);
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .close-button:hover {
            background: var(--hover-bg);
            color: white;
          }

          form {
            padding: 1.5rem;
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

          .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--background-dark);
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            color: white;
            font-size: 0.875rem;
            transition: all 0.2s;
          }

          .form-input:focus {
            outline: none;
            border-color: var(--primary-color);
            background: var(--background-darker);
          }

          textarea.form-input {
            min-height: 100px;
            resize: vertical;
          }

          .error-message {
            color: #ef4444;
            font-size: 0.875rem;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 0.375rem;
          }

          .modal-actions {
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
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .cancel-button:hover {
            background: var(--hover-bg);
            color: white;
          }

          .submit-button:hover {
            background: var(--secondary-color);
          }

          .submit-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .button-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top-color: currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </Portal>
  );
};

export default AddMetricModal;