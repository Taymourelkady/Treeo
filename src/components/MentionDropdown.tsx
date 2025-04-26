import React from 'react';
import type { Column } from '../lib/mockdata';

interface MentionDropdownProps {
  columns: Column[];
  onSelect: (column: Column) => void;
  position: { top: number; left: number };
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({ columns, onSelect, position }) => {
  if (columns.length === 0) return null;

  return (
    <div 
      className="mention-dropdown"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: '0.5rem'
      }}
    >
      {Object.entries(columns.reduce((acc, column) => {
        const tableKey = column.table;
        if (!acc[tableKey]) {
          acc[tableKey] = [];
        }
        acc[tableKey].push(column);
        return acc;
      }, {} as Record<string, Column[]>)).map(([tableName, tableColumns]) => (
        <div key={tableName} className="mention-section">
          <div className="mention-title">{tableName}</div>
          {tableColumns.map((column) => (
            <button
              key={`${column.table}.${column.name}`}
              className="mention-item"
              onClick={() => onSelect(column)}
            >
              <div className="mention-item-content">
                <div className="mention-name">{column.name}</div>
                <div className="mention-type">{column.type}</div>
              </div>
            </button>
          ))}
        </div>
      ))}

      <style>{`
        .mention-dropdown {
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          min-width: 300px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.3);
        }

        .mention-section {
          border-bottom: 1px solid var(--border-color);
        }

        .mention-section:last-child {
          border-bottom: none;
        }

        .mention-title {
          color: var(--text-light);
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.75rem 1rem 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--background-darker);
        }

        .mention-item {
          width: 100%;
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-size: 0.8125rem;
        }

        .mention-item:hover {
          background: var(--hover-bg);
        }
        
        .mention-item-content {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .mention-name {
          color: white;
          font-weight: 500;
        }

        .mention-type {
          color: var(--text-light);
          font-size: 0.6875rem;
        }

        .mention-item:hover .mention-type {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};

export default MentionDropdown;