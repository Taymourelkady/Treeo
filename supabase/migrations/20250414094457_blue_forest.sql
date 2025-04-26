/*
  # Populate Dashboard Data
  
  1. Initial Data
    - Create sample dashboards:
      - Sales Overview
      - Customer Metrics
      - Revenue Analysis
    - Add components for each dashboard:
      - Charts
      - Metrics
      - Tables
    
  2. Configuration
    - Set up chart configurations
    - Add sample queries
    - Configure component positions
*/

-- Get the first user's ID for sample data
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get first user
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;

  -- Create sample dashboards
  INSERT INTO dashboards (user_id, title, creation_method, is_public)
  VALUES
    (first_user_id, 'Sales Overview', 'chat', true),
    (first_user_id, 'Customer Metrics', 'chat', true),
    (first_user_id, 'Revenue Analysis', 'chat', true);

  -- Add components to Sales Overview dashboard
  WITH sales_dashboard AS (
    SELECT id FROM dashboards WHERE title = 'Sales Overview' LIMIT 1
  )
  INSERT INTO dashboard_components (
    dashboard_id,
    type,
    configuration,
    query_text,
    position
  )
  SELECT
    sales_dashboard.id,
    type,
    configuration::jsonb,
    query_text,
    position
  FROM sales_dashboard, (VALUES
    (
      'chart'::component_type,
      '{
        "type": "line",
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "datasets": [{
          "data": [3000, 3200, 4500, 4200, 5800, 5500],
          "borderColor": "#167147",
          "tension": 0.4,
          "pointRadius": 0,
          "borderWidth": 2
        }]
      }',
      'SELECT date_trunc(''month'', order_date) as month, SUM(total_amount) as sales FROM orders GROUP BY 1 ORDER BY 1 LIMIT 6',
      0
    ),
    (
      'metric'::component_type,
      '{
        "value": 24500,
        "trend": "+12.5%",
        "trendDirection": "up"
      }',
      'SELECT SUM(total_amount) as total_sales FROM orders WHERE order_date >= now() - interval ''30 days''',
      1
    )
  ) as t(type, configuration, query_text, position);

  -- Add components to Customer Metrics dashboard
  WITH customer_dashboard AS (
    SELECT id FROM dashboards WHERE title = 'Customer Metrics' LIMIT 1
  )
  INSERT INTO dashboard_components (
    dashboard_id,
    type,
    configuration,
    query_text,
    position
  )
  SELECT
    customer_dashboard.id,
    type,
    configuration::jsonb,
    query_text,
    position
  FROM customer_dashboard, (VALUES
    (
      'chart'::component_type,
      '{
        "type": "bar",
        "labels": ["New", "Returning", "Churned"],
        "datasets": [{
          "data": [120, 350, 45],
          "backgroundColor": ["#167147", "#4E7BE9", "#E94E7B"]
        }]
      }',
      'SELECT customer_type, COUNT(*) as count FROM customer_segments GROUP BY customer_type',
      0
    ),
    (
      'metric'::component_type,
      '{
        "value": 1234,
        "trend": "-2.3%",
        "trendDirection": "down"
      }',
      'SELECT COUNT(DISTINCT customer_id) as active_customers FROM orders WHERE order_date >= now() - interval ''30 days''',
      1
    )
  ) as t(type, configuration, query_text, position);

  -- Add components to Revenue Analysis dashboard
  WITH revenue_dashboard AS (
    SELECT id FROM dashboards WHERE title = 'Revenue Analysis' LIMIT 1
  )
  INSERT INTO dashboard_components (
    dashboard_id,
    type,
    configuration,
    query_text,
    position
  )
  SELECT
    revenue_dashboard.id,
    type,
    configuration::jsonb,
    query_text,
    position
  FROM revenue_dashboard, (VALUES
    (
      'chart'::component_type,
      '{
        "type": "line",
        "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        "datasets": [{
          "data": [9000, 9500, 14000, 13500, 16000, 15000],
          "borderColor": "#167147",
          "tension": 0.4,
          "pointRadius": 0,
          "borderWidth": 2
        }]
      }',
      'SELECT date_trunc(''month'', order_date) as month, SUM(total_amount) as revenue FROM orders GROUP BY 1 ORDER BY 1 LIMIT 6',
      0
    ),
    (
      'metric'::component_type,
      '{
        "value": 73500,
        "trend": "+8.2%",
        "trendDirection": "up"
      }',
      'SELECT SUM(total_amount) as total_revenue FROM orders WHERE order_date >= now() - interval ''30 days''',
      1
    )
  ) as t(type, configuration, query_text, position);

END $$;