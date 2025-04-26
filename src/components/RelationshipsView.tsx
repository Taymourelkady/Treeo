import React from 'react';
import { Database, Key, Share2 } from 'lucide-react';

interface TableRelation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

const relations: TableRelation[] = [
  {
    fromTable: 'orders',
    fromColumn: 'customer_id',
    toTable: 'customers',
    toColumn: 'id'
  },
  {
    fromTable: 'orders',
    fromColumn: 'supplier_id',
    toTable: 'suppliers',
    toColumn: 'id'
  },
  {
    fromTable: 'order_lines',
    fromColumn: 'order_id',
    toTable: 'orders',
    toColumn: 'id'
  },
  {
    fromTable: 'order_lines',
    fromColumn: 'sku_id',
    toTable: 'skus',
    toColumn: 'id'
  }
];

const RelationshipsView = () => {
  return (
    <div className="relationships-view">
      <h2>Database Relationships</h2>
      
      <div className="relationships-grid">
        {relations.map((relation, index) => (
          <div key={index} className="relation-card">
            <div className="relation-tables">
              <div className="table from-table">
                <div className="table-header">
                  <Database size={16} />
                  <h3>{relation.fromTable}</h3>
                </div>
                <div className="table-column">
                  <Key size={12} className="key-icon" />
                  <span className="column-name">{relation.fromColumn}</span>
                </div>
              </div>

              <div className="relation-arrow">
                <Share2 size={16} />
              </div>

              <div className="table to-table">
                <div className="table-header">
                  <Database size={16} />
                  <h3>{relation.toTable}</h3>
                </div>
                <div className="table-column">
                  <Key size={12} className="key-icon" />
                  <span className="column-name">{relation.toColumn}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .relationships-view {
          padding: 2rem;
          width: 100%;
        }

        .relationships-view h2 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          color: white;
        }

        .relationships-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .relation-card {
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .relation-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
        }

        .relation-tables {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .table {
          flex: 1;
          background: var(--background-darker);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          overflow: hidden;
        }

        .table-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .table-header h3 {
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
        }

        .table-column {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          transition: all 0.2s;
        }

        .table-column:hover {
          background: var(--hover-bg);
        }

        .key-icon {
          color: #eab308;
        }

        .column-name {
          font-family: monospace;
          font-size: 0.875rem;
          color: white;
        }

        .relation-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color);
          transform: rotate(-90deg);
        }
      `}</style>
    </div>
  );
};

export default RelationshipsView;