import React, { useState } from 'react';
import { Play, ChevronDown, Maximize2, Minimize2, Plus, X, ArrowLeft, Settings, HelpCircle, LogOut, AlertTriangle, CheckCircle, Database, Key } from 'lucide-react';
import type { Profile } from '../lib/types';
import RelationshipsView from './RelationshipsView';
import { QueryService, QueryResult } from '../lib/queryService';
import { useMockData, mockTables } from '../lib/mockdata';

interface Prompt {
  id: string;
  text: string;
}

interface QueryViewProps {
  profile: Profile;
  queryName?: string;
  initialQuery?: string;
  showProfileMenu: boolean;
  setShowProfileMenu: (show: boolean) => void;
  onSettingsClick: () => void;
  onSaveTraining?: (description: string, query: string) => void;
}

const QueryView = ({ 
  profile, 
  queryName, 
  initialQuery, 
  showProfileMenu,
  setShowProfileMenu,
  onSettingsClick,
  onSaveTraining 
}: QueryViewProps) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [queryResults, setQueryResults] = useState<QueryResult<any> | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([{ id: '1', text: '' }]);
  const [isValidated, setIsValidated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTrainingResults, setShowTrainingResults] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [schemaIssues] = useState([
    {
      id: 1,
      type: 'naming',
      table: 'users',
      column: 'u_id',
      severity: 'warning',
      message: 'Ambiguous column name. Consider renaming to "user_id"',
      status: 'pending'
    },
    {
      id: 2,
      type: 'relationship',
      table: 'orders',
      column: 'customer_id',
      severity: 'error',
      message: 'Missing foreign key relationship to customers.id',
      status: 'fixed'
    },
    {
      id: 3,
      type: 'hygiene',
      table: 'products',
      column: 'isActv',
      severity: 'warning',
      message: 'Inconsistent boolean naming. Consider renaming to "is_active"',
      status: 'pending'
    }
  ]);
  const [error, setError] = useState<{ type: 'syntax' | 'execution' | null; message: string | null }>({
    type: null,
    message: null
  });
  const profileRef = React.useRef<HTMLDivElement>(null);
  const { executeQuery } = useMockData();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addPrompt = () => {
    setPrompts([...prompts, { id: Date.now().toString(), text: '' }]);
  };

  const removePrompt = (id: string) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter(prompt => prompt.id !== id));
    }
  };

  const updatePrompt = (id: string, text: string) => {
    setPrompts(prompts.map(prompt => 
      prompt.id === id ? { ...prompt, text } : prompt
    ));
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsExecuting(true);
    setError({ type: null, message: null });
    
    try {
      const result = await QueryService.executeQuery(query.trim(), {
        source: 'scientist',
        name: queryName
      });
      
      setQueryResults(result);
      if (result.error) {
        const errorMessage = result.error.message.toLowerCase();
        setError({
          type: errorMessage.includes('syntax') || errorMessage.includes('parse') ? 'syntax' : 'execution',
          message: result.error.message
        });
        setQueryResults(null);
      } else {
        setQueryResults(result);
      }
      setShowTrainingResults(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while executing the query';
      setError({
        type: errorMessage.toLowerCase().includes('syntax') ? 'syntax' : 'execution',
        message: errorMessage
      });
      setQueryResults(null);
    } finally {
      setIsExecuting(false);
    }
  };

  React.useEffect(() => {
    if (queryName && initialQuery) {
      setQuery(initialQuery);
    }
  }, [queryName]);

  return (
    <div className="query-container">
      <header className="top-header">
        <div className="header-left">
          <button className="access-level">
            Admin
            <ChevronDown size={16} />
          </button>
        </div>
        <button 
          className="user-info" 
          ref={profileRef}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <div className="user-details">
            <h3>{profile.email.split('@')[0]}</h3>
            <span>{profile.email}</span>
          </div>
          <div className="avatar">
            {profile.email.substring(0, 2).toUpperCase()}
          </div>
          {showProfileMenu && (
            <div className="profile-dropdown">
              <button 
                className="profile-item"
                onClick={onSettingsClick}
              >
                <Settings size={16} />
                Settings
              </button>
              <button className="profile-item">
                <HelpCircle size={16} />
                Help & Support
              </button>
              <button className="profile-item text-red-500">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </button>
      </header>

      <div className="query-content">
        {queryName === 'Tables' ? (
          <div className="tables-view">
            <h2>Database Tables</h2>
            <div className="tables-grid">
              {mockTables.map((table) => (
                <div key={table.name} className="table-card">
                  <div className="table-header">
                    <Database size={16} />
                    <h3>{table.name}</h3>
                  </div>
                  <div className="table-columns">
                    {table.columns.map((column) => (
                      <div key={column.name} className="column-item">
                        {column.name === 'id' && <Key size={12} className="key-icon" />}
                        <span className="column-name">{column.name}</span>
                        <span className="column-type">{column.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : queryName === 'Relationships' ? (
          <RelationshipsView />
        ) : queryName === 'New Training Session' ? (
          <div className="training-content">
            <div className="schema-health-section">
              <h2>Schema Health Check</h2>
              <div className="schema-issues">
                {schemaIssues.map((issue) => (
                  <div key={issue.id} className={`schema-issue ${issue.severity} ${issue.status}`}>
                    <div className="issue-icon">
                      {issue.status === 'fixed' ? (
                        <CheckCircle size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                    </div>
                    <div className="issue-content">
                      <div className="issue-header">
                        <span className="issue-type">{issue.type}</span>
                        <span className="issue-location">{issue.table}.{issue.column}</span>
                      </div>
                      <p className="issue-message">{issue.message}</p>
                    </div>
                    {issue.status === 'pending' && (
                      <button className="mark-fixed-button">
                        Mark as Fixed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {queryResults && showTrainingResults && (
              <div className={`training-results-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
                <div className="results-header">
                  <div className="header-left">
                    <button 
                      className="back-button"
                      onClick={() => setShowTrainingResults(false)}
                    >
                      <ArrowLeft size={16} />
                      Back to Query
                    </button>
                    <h2>Query Results</h2>
                  </div>
                  <button 
                    className="fullscreen-toggle"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(queryResults.data[0] || {}).map((column, index) => (
                          <th key={index}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.keys(queryResults.data[0] || {}).map((column, colIndex) => (
                            <td key={colIndex}>{row[column]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={`query-editor ${isFullscreen ? 'hidden' : ''}`}>
              {queryName && <h2 className="query-name">{queryName}</h2>}
              <textarea
                spellCheck={false}
                value={query}
                className={error?.type === 'syntax' ? 'syntax-error' : ''}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM table_name WHERE condition;"
              />
              {error.message && (
                <div className={`error-message ${error.type === 'syntax' ? 'syntax' : 'execution'}`}>
                  <div className="error-title">
                    {error.type === 'syntax' ? 'Syntax Error' : 'Execution Error'}
                  </div>
                  <div className="error-details">
                    {error.message}
                  </div>
                </div>
              )}
              <div className="query-actions">
                <button 
                  className="run-query" 
                  onClick={handleQuerySubmit}
                  disabled={isExecuting || !query.trim()}
                >
                  {isExecuting ? (
                    <div className="loading-spinner" />
                  ) : (
                    <>
                      <Play size={16} />
                      Run Query
                    </>
                  )}
                </button>
                <button className="save-query">
                  Save Query
                </button>
              </div>
            </div>

            <div className="query-results">
              <div className="results-header">
                <h2>Query Results</h2>
                <button 
                  className="fullscreen-toggle"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
              {queryResults && (
                <div className="results-table">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(queryResults.data[0] || {}).map((column, index) => (
                          <th key={index}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResults.data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.keys(queryResults.data[0] || {}).map((column, colIndex) => (
                            <td key={colIndex}>{row[column]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .query-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--background-darker);
          color: white;
          overflow: hidden;
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
          background: transparent;
          border: none;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          gap: 1rem;
          flex-direction: row-reverse;
        }

        .user-info:hover {
          background: var(--hover-bg);
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
          transition: all 0.2s;
        }

        .user-info:hover .avatar {
          background: var(--secondary-color);
        }

        .profile-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
          min-width: 200px;
          z-index: 100;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .profile-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-item:hover {
          background: var(--hover-bg);
          color: white;
        }

        .profile-item.text-red-500 {
          color: #ef4444;
        }

        .profile-item.text-red-500:hover {
          background: rgba(239, 68, 68, 0.1);
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

        .query-content {
          flex: 1;
          display: flex;
          padding: 1.5rem;
          gap: 1.5rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .tables-view {
          padding: 2rem;
          width: 100%;
        }

        .tables-view h2 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          color: white;
        }

        .tables-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .table-card {
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
          transition: all 0.2s;
        }

        .table-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
        }

        .table-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--background-darker);
          border-bottom: 1px solid var(--border-color);
        }

        .table-header h3 {
          font-size: 1rem;
          font-weight: 500;
          color: white;
        }

        .table-columns {
          padding: 1rem;
        }

        .column-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .column-item:hover {
          background: var(--hover-bg);
        }

        .key-icon {
          color: #eab308;
        }

        .column-name {
          color: white;
          font-size: 0.875rem;
          font-family: monospace;
        }

        .column-type {
          color: var(--text-light);
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          background: var(--background-darker);
          border-radius: 0.25rem;
          margin-left: auto;
        }

        .training-content {
          width: 100%;
          height: 100%;
        }

        .schema-health-section {
          background: var(--background-dark);
          border-radius: 0.5rem;
          padding: 2rem;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .query-editor {
          flex: 1;
          background: var(--background-dark);
          border-radius: 0.5rem;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .query-editor textarea {
          flex: 1;
          background: transparent;
          border: none;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          padding: 1rem;
          color: white;
          font-family: monospace;
          font-size: 0.875rem;
          resize: none;
          outline: none;
          line-height: 1.5;
          min-height: 200px;
        }

        .query-editor textarea.syntax-error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }

        .query-editor textarea:focus {
          border-color: var(--primary-color);
          background: var(--background-darker);
        }

        .query-editor textarea.syntax-error:focus {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .error-message {
          font-size: 0.875rem;
          margin-top: 0.5rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
        }

        .error-message.syntax {
          background: rgba(239, 68, 68, 0.1);
          border-left: 4px solid #ef4444;
        }

        .error-message.execution {
          background: rgba(234, 179, 8, 0.1);
          border-left: 4px solid #eab308;
        }

        .error-title {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .error-message.syntax .error-title {
          color: #ef4444;
        }

        .error-message.execution .error-title {
          color: #eab308;
        }

        .error-details {
          color: var(--text-light);
          line-height: 1.5;
        }

        .query-actions {
          display: flex;
          gap: 0.5rem;
        }

        .run-query {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--primary-color);
          border: none;
          border-radius: 0.375rem;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .run-query:hover {
          background: var(--secondary-color);
        }

        .run-query:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .save-query {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid var(--text-light);
          border-radius: 0.375rem;
          color: var(--text-light);
          cursor: pointer;
          font-size: 0.875rem;
        }

        .save-query:hover {
          background: var(--hover-bg);
          color: white;
          border-color: white;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .query-results {
          flex: 1;
          background: var(--background-dark);
          border-radius: 0.5rem;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .query-name {
          color: var(--primary-color);
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .query-results h2 {
          color: white;
          font-size: 1rem;
          margin-bottom: 1rem;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .fullscreen-toggle {
          background: transparent;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .fullscreen-toggle:hover {
          background: var(--hover-bg);
          color: white;
        }

        .query-editor.hidden {
          display: none;
        }

        .query-editor.hidden + .query-results {
          flex: 1;
        }
        
        .results-table {
          overflow-x: auto;
          overflow-y: auto;
          flex: 1;
          max-height: calc(100vh - 300px);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          table-layout: fixed;
        }
        
        th {
          background: var(--background-darker);
          color: var(--text-light);
          text-align: left;
          padding: 0.75rem;
          font-weight: 500;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        td {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        tr:hover td {
          background: var(--hover-bg);
        }
        
        .training-section {
          background: var(--background-dark);
          border-radius: 0.5rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        
        .prompts-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }

        .prompt-item {
          position: relative;
          display: flex;
          flex: 1;
        }

        .remove-prompt {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--background-dark);
          border: none;
          color: var(--text-light);
          padding: 0.25rem;
          border-radius: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.2s;
        }

        .prompt-item:hover .remove-prompt {
          opacity: 1;
        }

        .remove-prompt:hover {
          background: var(--hover-bg);
          color: #ef4444;
        }

        .add-prompt {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--background-darker);
          border: 1px dashed var(--border-color);
          color: var(--text-light);
          padding: 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          justify-content: center;
          transition: all 0.2s;
        }

        .add-prompt:hover {
          background: var(--hover-bg);
          color: white;
          border-style: solid;
        }
        
        .training-section h2 {
          color: white;
          font-size: 1.125rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .schema-issues {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        
        .schema-issue {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          background: var(--background-darker);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          transition: all 0.2s;
        }
        
        .schema-issue:hover {
          border-color: var(--primary-color);
          transform: translateX(4px);
        }
        
        .schema-issue.warning {
          border-left: 4px solid #eab308;
        }
        
        .schema-issue.error {
          border-left: 4px solid #ef4444;
        }
        
        .schema-issue.fixed {
          opacity: 0.7;
          background: var(--background-dark);
        }
        
        .issue-icon {
          color: #eab308;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.25rem;
          padding: 0.25rem;
        }
        
        .schema-issue.error .issue-icon {
          color: #ef4444;
        }
        
        .schema-issue.fixed .issue-icon {
          color: #22c55e;
        }
        
        .issue-content {
          flex: 1;
        }
        
        .issue-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .issue-type {
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-light);
          background: var(--background-dark);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          letter-spacing: 0.05em;
        }
        
        .issue-location {
          font-family: monospace;
          font-size: 0.875rem;
          color: var(--text-light);
          opacity: 0.8;
        }
        
        .issue-message {
          color: white;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .mark-fixed-button {
          padding: 0.625rem 1.25rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          margin-left: auto;
          margin-top: -0.25rem;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .mark-fixed-button:hover {
          
          background: var(--hover-bg);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default QueryView;