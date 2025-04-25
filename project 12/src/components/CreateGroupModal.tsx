import React from 'react';
import { X } from 'lucide-react';
import Portal from './Portal';
import { MetricsService, MetricsError } from '../lib/metricsService';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const CreateGroupModal = ({ isOpen, onClose, onSuccess, userId }: CreateGroupModalProps) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await MetricsService.createMetricGroup({
        name: name.trim(),
        description: description.trim(),
        user_id: userId,
        is_public: isPublic
      });

      setName('');
      setDescription('');
      setIsPublic(true);
      onClose();
      onSuccess();
    } catch (error) {
      setError(error instanceof MetricsError ? error.message : 'Failed to create metric group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Create New Metric Group</h2>
            <button className="close-button" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sales Metrics"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this metric group..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="checkbox-input"
                />
                <span>Make this group public</span>
              </label>
              <p className="help-text">
                Public groups are visible to all users
              </p>
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
                disabled={submitting || !name.trim()}
              >
                {submitting ? (
                  <div className="button-content">
                    <div className="loading-spinner" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Group'
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

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            color: white;
          }

          .checkbox-input {
            width: 1rem;
            height: 1rem;
            border-radius: 0.25rem;
            border: 1px solid var(--border-color);
            background: var(--background-dark);
            cursor: pointer;
          }

          .help-text {
            margin-top: 0.25rem;
            color: var(--text-light);
            font-size: 0.75rem;
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

export default CreateGroupModal;