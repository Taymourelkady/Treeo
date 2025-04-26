import React from 'react';
import { X, Link2, Globe, Copy } from 'lucide-react';
import Portal from './Portal';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const ShareDialog = ({ isOpen, onClose, title }: ShareDialogProps) => {
  if (!isOpen) return null;

  return (
    <Portal>
    <div className="share-dialog-overlay">
      <div className="share-dialog">
        <div className="share-dialog-header">
          <h2>Share "{title}"</h2>
          <button className="close-button" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="share-dialog-content">
          <div className="share-input-container">
            <input
              type="text"
              placeholder="Add people and groups"
              className="share-input"
            />
            <button className="share-button">Share</button>
          </div>

          <div className="share-divider">
            <span>or share with link</span>
          </div>

          <div className="link-access-section">
            <div className="link-access-header">
              <Globe size={16} />
              <span>Anyone with the link</span>
            </div>
            <p className="link-access-description">
              Anyone on the internet with the link can view
            </p>
          </div>

          <div className="share-link-container">
            <Link2 size={14} />
            <input
              type="text"
              value="https://app.example.com/dashboard/share/abc123"
              readOnly
              className="share-link-input"
            />
            <button className="copy-link-button">
              <Copy size={14} />
              Copy link
            </button>
          </div>

          <div className="people-access-section">
            <h3>People with access</h3>
            <div className="person-item">
              <div className="person-avatar">JD</div>
              <div className="person-info">
                <div className="person-name">John Doe (you)</div>
                <div className="person-email">john.doe@company.com</div>
              </div>
              <div className="person-role">Owner</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .share-dialog-overlay {
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

        .share-dialog {
          background: var(--background-darker);
          border-radius: 0.5rem;
          width: 100%;
          max-width: 550px;
          overflow: hidden;
        }

        .share-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .share-dialog-header h2 {
          font-size: 1.125rem;
          font-weight: 500;
          color: white;
        }

        .close-button {
          background: transparent;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .share-dialog-content {
          padding: 1.5rem;
        }

        .share-input-container {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .share-input {
          flex: 1;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
        }

        .share-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .share-button {
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 0.375rem;
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .share-button:hover {
          background: var(--secondary-color);
        }

        .share-divider {
          position: relative;
          text-align: center;
          margin: 1.5rem 0;
        }

        .share-divider::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: var(--border-color);
        }

        .share-divider span {
          background: var(--background-darker);
          padding: 0 1rem;
          color: var(--text-light);
          font-size: 0.875rem;
          position: relative;
        }

        .link-access-section {
          background: var(--background-dark);
          border-radius: 0.375rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .link-access-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          margin-bottom: 0.25rem;
        }

        .link-access-description {
          color: var(--text-light);
          font-size: 0.875rem;
        }

        .share-link-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          margin-bottom: 1.5rem;
        }

        .share-link-container svg {
          color: var(--text-light);
        }

        .share-link-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
        }

        .share-link-input:focus {
          outline: none;
        }

        .copy-link-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
        }

        .copy-link-button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .people-access-section {
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }

        .people-access-section h3 {
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          margin-bottom: 1rem;
        }

        .person-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .person-avatar {
          width: 32px;
          height: 32px;
          background: var(--primary-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .person-info {
          flex: 1;
        }

        .person-name {
          color: white;
          font-size: 0.875rem;
        }

        .person-email {
          color: var(--text-light);
          font-size: 0.75rem;
        }

        .person-role {
          color: var(--text-light);
          font-size: 0.75rem;
        }
      `}</style>
    </div>
    </Portal>
  );
};

export default ShareDialog;