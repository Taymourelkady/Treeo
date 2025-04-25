import { createClient } from '@supabase/supabase-js';

const mockDataUrl = 'https://hrahtlninapzadgeernw.supabase.co';
const mockDataKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyYWh0bG5pbmFwemFkZ2Vlcm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDUzODYsImV4cCI6MjA2MDEyMTM4Nn0.8SFeTPHHJvbjMLqgE2rVeRLIHmpVaqEEwBv7Cc-DhF0';

class MockDataService {
  private client;

  constructor() {
    this.client = createClient(mockDataUrl, mockDataKey);
  }

  async query<T>(sql: string): Promise<{ data: T[] | null; error: Error | null }> {
    try {
      console.log('Executing SQL query:', sql);
      
      const { data, error } = await this.client.rpc('execute_sql', {
        sql_query: sql.trim()
      });
      
      if (error) {
        console.error('Supabase query error:', error);
        return { data: null, error: new Error(error.message) };
      }
      
      if (!data) {
        return { data: [], error: null };
      }
      
      console.log('Mock query executed successfully');
      
      return { data: data as T[], error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('MockDataService query failed:', {
        error: errorMessage,
        sql,
        stack: err instanceof Error ? err.stack : undefined
      });
      
      return {
        data: null,
        error: new Error(`Query execution failed: ${errorMessage}`)
      };
    }
  }
}

// Export singleton instance
export const mockdata = new MockDataService();

export interface Column {
  name: string;
  type: string;
  table: string;
}

export const mockTables = [
  {
    name: 'orders',
    columns: [
      { name: 'id', type: 'text', table: 'orders' },
      { name: 'customer_id', type: 'uuid', table: 'orders' },
      { name: 'order_date', type: 'date', table: 'orders' },
      { name: 'status', type: 'text', table: 'orders' },
      { name: 'total_amount', type: 'numeric', table: 'orders' }
    ]
  },
  {
    name: 'customers',
    columns: [
      { name: 'id', type: 'uuid', table: 'customers' },
      { name: 'name', type: 'text', table: 'customers' },
      { name: 'email', type: 'text', table: 'customers' },
      { name: 'created_at', type: 'timestamp', table: 'customers' }
    ]
  }
];

export const mockMetrics = [
  {
    name: 'Monthly Recurring Revenue',
    abbreviation: 'MRR',
    group: 'Sales Metrics'
  },
  {
    name: 'Average Revenue Per User',
    abbreviation: 'ARPU',
    group: 'Sales Metrics'
  },
  {
    name: 'Customer Lifetime Value',
    abbreviation: 'CLV',
    group: 'Customer Metrics'
  },
  {
    name: 'Customer Acquisition Cost',
    abbreviation: 'CAC',
    group: 'Customer Metrics'
  }
];

export function searchMockMetrics(query: string): typeof mockMetrics {
  const normalizedQuery = query.toLowerCase();
  return mockMetrics.filter(metric => 
    metric.name.toLowerCase().includes(normalizedQuery) ||
    metric.abbreviation.toLowerCase().includes(normalizedQuery)
  );
}

export function searchMockColumns(query: string): Column[] {
  const normalizedQuery = query.toLowerCase();
  return mockTables.flatMap(table => 
    table.columns.filter(column => {
      const searchText = `${table.name}.${column.name}`.toLowerCase();
      return searchText.includes(normalizedQuery);
    })
  );
}

// Add the missing useMockData hook
export function useMockData() {
  const executeQuery = async (sql: string) => {
    return await mockdata.query(sql);
  };

  return { executeQuery };
}