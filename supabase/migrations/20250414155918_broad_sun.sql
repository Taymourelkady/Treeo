/*
  # Add Initial Dashboard Components

  1. New Components
    - Sales Overview Dashboard:
      - Total Sales Chart
      - Revenue Chart
      - Active Customers Metric
      - Orders Metric
    
    - Customer Metrics Dashboard:
      - Customer Growth Chart
      - Customer Retention Chart
      - NPS Score Metric
      - Churn Rate Metric
    
    - Revenue Analysis Dashboard:
      - Monthly Revenue Chart
      - Revenue by Channel Chart
      - ARR Metric
      - Revenue Growth Metric

  2. Configuration
    - Set up chart configurations
    - Add sample queries
    - Configure component positions
*/

-- Get first user ID for sample data
DO $$
DECLARE
  first_user_id uuid;
  sales_dashboard_id uuid;
  customer_dashboard_id uuid;
  revenue_dashboard_id uuid;
BEGIN
  -- Get first user
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;

  -- Get dashboard IDs
  SELECT id INTO sales_dashboard_id 
  FROM dashboards 
  WHERE title = 'Sales Overview' 
  AND user_id = first_user_id 
  LIMIT 1;

  SELECT id INTO customer_dashboard_id 
  FROM dashboards 
  WHERE title = 'Customer Metrics' 
  AND user_id = first_user_id 
  LIMIT 1;

  SELECT id INTO revenue_dashboard_id 
  FROM dashboards 
  WHERE title = 'Revenue Analysis' 
  AND user_id = first_user_id 
  LIMIT 1;

  -- Add components to Sales Overview dashboard
  INSERT INTO dashboard_components (
    dashboard_id,
    type,
    configuration,
    query_text,
    position
  ) VALUES
  (
    sales_dashboard_id,
    'chart',
    '{
      "type": "line",
      "title": "Total Sales",
      "value": 24500,
      "trend": "+12.5% from last month",
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
    sales_dashboard_id,
    'chart',
    '{
      "type": "line",
      "title": "Revenue",
      "value": 73500,
      "trend": "+8.2% from last month",
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
    1
  ),
  (
    sales_dashboard_id,
    'metric',
    '{
      "title": "Active Customers",
      "value": 1234,
      "trend": "-2.3% from last month"
    }',
    'SELECT COUNT(DISTINCT customer_id) as active_customers FROM orders WHERE order_date >= now() - interval ''30 days''',
    2
  ),
  (
    sales_dashboard_id,
    'metric',
    '{
      "title": "Orders",
      "value": 856,
      "trend": "+5.7% from last month"
    }',
    'SELECT COUNT(*) as total_orders FROM orders WHERE order_date >= now() - interval ''30 days''',
    3
  );

  -- Add components to Customer Metrics dashboard
  INSERT INTO dashboard_components (
    dashboard_id,
    type,
    configuration,
    query_text,
    position
  ) VALUES
  (
    customer_dashboard_id,
    'chart',
    '{
      "type": "bar",
      "title": "Customer Growth",
      "value": 2500,
      "trend": "+15.3% from last month",
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "datasets": [{
        "data": [1800, 2000, 2200, 2300, 2400, 2500],
        "backgroundColor": "#167147"
      }]
    }',
    'SELECT date_trunc(''month'', signup_date) as month, COUNT(*) as new_customers FROM customers GROUP BY 1 ORDER BY 1 LIMIT 6',
    0
  ),
  (
    customer_dashboard_id,
    'chart',
    '{
      "type": "line",
      "title": "Customer Retention",
      "value": 85,
      "trend": "+2.1% from last month",
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "datasets": [{
        "data": [82, 81, 83, 84, 83, 85],
        "borderColor": "#167147",
        "tension": 0.4,
        "pointRadius": 0,
        "borderWidth": 2
      }]
    }',
    'SELECT date_trunc(''month'', date) as month, retention_rate FROM customer_retention GROUP BY 1 ORDER BY 1 LIMIT 6',
    1
  ),
  (
    customer_dashboard_id,
    'metric',
    '{
      "title": "NPS Score",
      "value": 65,
      "trend": "+5 points from last month"
    }',
    'SELECT AVG(score) as nps FROM nps_responses WHERE date >= now() - interval ''30 days''',
    2
  ),
  (
    customer_dashboard_id,
    'metric',
    '{
      "title": "Churn Rate",
      "value": 2.3,
      "trend": "-0.5% from last month"
    }',
    'SELECT churn_rate FROM customer_churn WHERE date >= now() - interval ''30 days'' ORDER BY date DESC LIMIT 1',
    3
  );

  -- Add components to Revenue Analysis dashboard
  INSERT INTO dashboard_components (
    dashboard_id,
    type,
    configuration,
    query_text,
    position
  ) VALUES
  (
    revenue_dashboard_id,
    'chart',
    '{
      "type": "line",
      "title": "Monthly Revenue",
      "value": 125000,
      "trend": "+18.5% from last month",
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "datasets": [{
        "data": [85000, 90000, 98000, 105000, 115000, 125000],
        "borderColor": "#167147",
        "tension": 0.4,
        "pointRadius": 0,
        "borderWidth": 2
      }]
    }',
    'SELECT date_trunc(''month'', date) as month, SUM(amount) as revenue FROM revenue GROUP BY 1 ORDER BY 1 LIMIT 6',
    0
  ),
  (
    revenue_dashboard_id,
    'chart',
    '{
      "type": "pie",
      "title": "Revenue by Channel",
      "labels": ["Direct", "Referral", "Organic", "Social"],
      "datasets": [{
        "data": [45000, 35000, 25000, 20000],
        "backgroundColor": ["#167147", "#4E7BE9", "#4EE997", "#E94E7B"]
      }]
    }',
    'SELECT channel, SUM(amount) as revenue FROM revenue GROUP BY channel ORDER BY revenue DESC LIMIT 4',
    1
  ),
  (
    revenue_dashboard_id,
    'metric',
    '{
      "title": "Annual Recurring Revenue",
      "value": 1500000,
      "trend": "+22.4% from last year"
    }',
    'SELECT SUM(amount) * 12 as arr FROM monthly_recurring_revenue WHERE date >= now() - interval ''30 days''',
    2
  ),
  (
    revenue_dashboard_id,
    'metric',
    '{
      "title": "Revenue Growth",
      "value": 18.5,
      "trend": "+3.2% from last month"
    }',
    'SELECT growth_rate FROM revenue_growth WHERE date >= now() - interval ''30 days'' ORDER BY date DESC LIMIT 1',
    3
  );

END $$;