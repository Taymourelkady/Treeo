import React from 'react';
import DataTable from 'react-data-table-component';
import { Search } from 'lucide-react';

interface DataTableProps {
  title: string;
  columns: any[];
  data: any[];
  loading?: boolean;
}

const customStyles = {
  table: {
    style: {
      backgroundColor: 'var(--background-dark)',
      color: 'white',
    },
  },
  tableWrapper: {
    style: {
      display: 'table',
    },
  },
  header: {
    style: {
      backgroundColor: 'var(--background-darker)',
      color: 'white',
      padding: '1.25rem',
      fontSize: '1.125rem',
    },
  },
  headRow: {
    style: {
      backgroundColor: 'var(--background-darker)',
      borderBottomColor: 'var(--border-color)',
      minHeight: '3rem',
    },
  },
  headCells: {
    style: {
      color: 'var(--text-light)',
      fontSize: '0.875rem',
      fontWeight: 500,
      padding: '0.75rem 1rem',
    },
  },
  cells: {
    style: {
      color: 'white',
      fontSize: '0.875rem',
      padding: '0.75rem 1rem',
    },
  },
  rows: {
    style: {
      backgroundColor: 'var(--background-dark)',
      '&:hover': {
        backgroundColor: 'var(--hover-bg)',
        cursor: 'pointer',
      },
      borderBottomColor: 'var(--border-color)',
      minHeight: '3rem',
    },
  },
  pagination: {
    style: {
      backgroundColor: 'var(--background-darker)',
      color: 'white',
      borderTopColor: 'var(--border-color)',
    },
    pageButtonsStyle: {
      color: 'white',
      fill: 'white',
      '&:disabled': {
        color: 'var(--text-light)',
        fill: 'var(--text-light)',
      },
    },
  },
  noData: {
    style: {
      color: 'var(--text-light)',
      padding: '2rem',
    },
  },
};

const DataTableComponent = ({ title, columns, data, loading = false }: DataTableProps) => {
  const [filterText, setFilterText] = React.useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = React.useState(false);

  const filteredItems = data.filter(
    item => columns.some(col => {
      const cellValue = item[col.selector(item)]?.toString().toLowerCase();
      return cellValue?.includes(filterText.toLowerCase());
    })
  );

  const subHeaderComponent = (
    <div className="search-container">
      <Search size={16} className="search-icon" />
      <input
        type="text"
        placeholder="Search..."
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        className="search-input"
      />
    </div>
  );

  return (
    <div className="data-table-container">
      <DataTable
        title={title}
        columns={columns}
        data={filteredItems}
        customStyles={customStyles}
        pagination
        paginationResetDefaultPage={resetPaginationToggle}
        subHeader
        subHeaderComponent={subHeaderComponent}
        persistTableHead
        progressPending={loading}
      />

      <style>{`
        .data-table-container {
          background: var(--background-dark);
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--background-darker);
        }

        .search-icon {
          color: var(--text-light);
        }

        .search-input {
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          min-width: 250px;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .search-input::placeholder {
          color: var(--text-light);
        }
      `}</style>
    </div>
  );
};

export default DataTableComponent;