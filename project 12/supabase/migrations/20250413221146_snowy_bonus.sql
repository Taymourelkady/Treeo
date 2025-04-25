/*
  # Add Customer and Inventory Metrics

  1. New Metrics
    - Customer Metrics:
      - Customer Retention Rate (CRR)
      - Customer Acquisition Cost (CAC)
      - Customer Lifetime Value (CLV)
      - Net Promoter Score (NPS)
    
    - Inventory Metrics:
      - Inventory Turnover Rate (ITR)
      - Days of Inventory Outstanding (DIO)
      - Stock-to-Sales Ratio (SSR)
      - Stockout Rate (SR)

  2. Updates
    - Links metrics to their respective groups
    - Maintains consistent formatting and descriptions
*/

-- First ensure the metric groups exist
INSERT INTO metric_groups (name, description, user_id, is_public)
SELECT 'Customer Metrics', 'Key metrics for tracking customer behavior and satisfaction', id, true
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM metric_groups WHERE name = 'Customer Metrics'
)
LIMIT 1;

INSERT INTO metric_groups (name, description, user_id, is_public)
SELECT 'Inventory Metrics', 'Metrics for monitoring inventory performance and efficiency', id, true
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM metric_groups WHERE name = 'Inventory Metrics'
)
LIMIT 1;

-- Add Customer Metrics
INSERT INTO metrics (
  name,
  description,
  calculation_method,
  is_public,
  user_id,
  group_id
)
SELECT
  m.name,
  m.description,
  m.calculation_method,
  true,
  u.id,
  mg.id
FROM (
  VALUES
    (
      'Customer Retention Rate',
      'The percentage of customers who remain active over a specific time period',
      '(Customers at End - New Customers) / Customers at Start * 100'
    ),
    (
      'Customer Acquisition Cost',
      'The average cost to acquire a new customer, including marketing and sales expenses',
      'Total Acquisition Costs / Number of New Customers'
    ),
    (
      'Customer Lifetime Value',
      'The total revenue expected from a customer throughout the business relationship',
      'Average Purchase Value * Purchase Frequency * Average Customer Lifespan'
    ),
    (
      'Net Promoter Score',
      'Measure of customer satisfaction and loyalty based on likelihood to recommend',
      '(Promoters - Detractors) / Total Respondents * 100'
    )
) AS m(name, description, calculation_method)
CROSS JOIN (SELECT id FROM users LIMIT 1) AS u
CROSS JOIN (SELECT id FROM metric_groups WHERE name = 'Customer Metrics' LIMIT 1) AS mg
ON CONFLICT (user_id, name) DO NOTHING;

-- Add Inventory Metrics
INSERT INTO metrics (
  name,
  description,
  calculation_method,
  is_public,
  user_id,
  group_id
)
SELECT
  m.name,
  m.description,
  m.calculation_method,
  true,
  u.id,
  mg.id
FROM (
  VALUES
    (
      'Inventory Turnover Rate',
      'How many times inventory is sold and replaced over a specific period',
      'Cost of Goods Sold / Average Inventory'
    ),
    (
      'Days of Inventory Outstanding',
      'Average number of days company holds inventory before selling it',
      '(Average Inventory / Cost of Goods Sold) * 365'
    ),
    (
      'Stock-to-Sales Ratio',
      'Relationship between inventory levels and sales',
      'Current Inventory Value / Sales Revenue'
    ),
    (
      'Stockout Rate',
      'Percentage of time items are unavailable when customers want to purchase',
      'Number of Stockouts / Total Number of SKUs * 100'
    )
) AS m(name, description, calculation_method)
CROSS JOIN (SELECT id FROM users LIMIT 1) AS u
CROSS JOIN (SELECT id FROM metric_groups WHERE name = 'Inventory Metrics' LIMIT 1) AS mg
ON CONFLICT (user_id, name) DO NOTHING;