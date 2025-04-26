/*
  # Add Mock Queries Table

  1. New Tables
    - `_mock_queries`
      - `id` (uuid, primary key)
      - `query` (text) - The SQL query to match
      - `result` (jsonb) - The mock result data to return
      - `created_at` (timestamp)

  2. Sample Data
    - Add mock data for common queries
    - Include suppliers, customers, and orders data
*/

-- Create mock queries table
CREATE TABLE IF NOT EXISTS _mock_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add index for query matching
CREATE INDEX idx_mock_queries_query ON _mock_queries(query);

-- Insert sample mock data
INSERT INTO _mock_queries (query, result) VALUES
-- Suppliers query
('SELECT * FROM suppliers LIMIT 10', '[
  {"id": 1, "name": "Acme Corp", "active": true, "rating": 4.5},
  {"id": 2, "name": "Global Supplies", "active": true, "rating": 4.8},
  {"id": 3, "name": "Tech Solutions", "active": true, "rating": 4.2}
]'::jsonb),

-- Customer support tickets
('SELECT customer_id, issue_type, status FROM support_tickets', '[
  {"customer_id": "c123", "issue_type": "Technical", "status": "Open"},
  {"customer_id": "c456", "issue_type": "Billing", "status": "Resolved"},
  {"customer_id": "c789", "issue_type": "Account", "status": "Pending"}
]'::jsonb),

-- User data
('SELECT user_id, last_login FROM users WHERE department_id = 5', '[
  {"user_id": "u123", "last_login": "2024-04-14T12:00:00Z"},
  {"user_id": "u456", "last_login": "2024-04-13T15:30:00Z"},
  {"user_id": "u789", "last_login": "2024-04-12T09:45:00Z"}
]'::jsonb),

-- Simple suppliers query
('SELECT * FROM suppliers', '[
  {"id": 1, "name": "Acme Corp", "active": true, "rating": 4.5},
  {"id": 2, "name": "Global Supplies", "active": true, "rating": 4.8},
  {"id": 3, "name": "Tech Solutions", "active": true, "rating": 4.2}
]'::jsonb);

-- Enable RLS
ALTER TABLE _mock_queries ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read mock queries
CREATE POLICY "Anyone can read mock queries"
  ON _mock_queries
  FOR SELECT
  TO authenticated
  USING (true);