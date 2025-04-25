interface Column {
  name: string;
  type: string;
  table: string;
  description?: string;
}

interface Table {
  name: string;
  columns: Column[];
  description?: string;
}

export const schema: Table[] = [
  {
    name: 'orders',
    description: 'Order information',
    columns: [
      { name: 'id', type: 'text', table: 'orders' },
      { name: 'customer_id', type: 'uuid', table: 'orders' },
      { name: 'order_date', type: 'date', table: 'orders' },
      { name: 'status', type: 'text', table: 'orders' },
      { name: 'created_at', type: 'timestamp', table: 'orders' }
    ]
  },
  {
    name: 'customers',
    description: 'Customer information',
    columns: [
      { name: 'id', type: 'uuid', table: 'customers' },
      { name: 'name', type: 'text', table: 'customers' },
      { name: 'email', type: 'text', table: 'customers' },
      { name: 'created_at', type: 'timestamp', table: 'customers' }
    ]
  },
  {
    name: 'products',
    description: 'Product catalog',
    columns: [
      { name: 'id', type: 'uuid', table: 'products' },
      { name: 'name', type: 'text', table: 'products' },
      { name: 'price', type: 'numeric', table: 'products' },
      { name: 'created_at', type: 'timestamp', table: 'products' }
    ]
  }
];

export function searchColumns(query: string): Column[] {
  const normalizedQuery = query.toLowerCase();
  return schema.flatMap(table => 
    table.columns.filter(column => {
      const searchText = `${table.name}.${column.name}`.toLowerCase();
      return searchText.includes(normalizedQuery);
    })
  );
}