import React from 'react';

interface Metric {
  name: string;
  abbreviation: string;
  group: string;
}

interface MetricDropdownProps {
  metrics: Metric[];
  onSelect: (metric: Metric) => void;
  position: { top: number; left: number };
}

const MetricDropdown: React.FC<MetricDropdownProps> = ({ metrics, onSelect, position }) => {
  if (metrics.length === 0) return null;

  return (
    <div 
      className="metric-dropdown"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: '0.5rem'
      }}
    >
      {Object.entries(metrics.reduce((acc, metric) => {
        const groupKey = metric.group;
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(metric);
        return acc;
      }, {} as Record<string, Metric[]>)).map(([groupName, groupMetrics]) => (
        <div key={groupName} className="metric-section">
          <div className="metric-title">{groupName}</div>
          {groupMetrics.map((metric) => (
            <button
              key={`${metric.group}.${metric.name}`}
              className="metric-item"
              onClick={() => onSelect(metric)}
            >
              <div className="metric-item-content">
                <div className="metric-name">{metric.name}</div>
                <div className="metric-abbr">{metric.abbreviation}</div>
              </div>
            </button>
          ))}
        </div>
      ))}

      <style>{`
        .metric-dropdown {
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          min-width: 300px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.3);
        }

        .metric-section {
          border-bottom: 1px solid var(--border-color);
        }

        .metric-section:last-child {
          border-bottom: none;
        }

        .metric-title {
          color: var(--text-light);
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.75rem 1rem 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--background-darker);
        }

        .metric-item {
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

        .metric-item:hover {
          background: var(--hover-bg);
        }
        
        .metric-item-content {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .metric-name {
          color: white;
          font-weight: 500;
        }

        .metric-abbr {
          color: var(--text-light);
          font-size: 0.6875rem;
        }

        .metric-item:hover .metric-abbr {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};

export default MetricDropdown;