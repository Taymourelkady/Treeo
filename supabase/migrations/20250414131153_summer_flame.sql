/*
  # Add Dashboard-Specific Metrics

  1. New Metrics
    - Sales Metrics:
      - Monthly Recurring Revenue (MRR)
      - Average Order Value (AOV)
      - Sales Growth Rate (SGR)
      - Conversion Rate (CVR)
      
    - Customer Metrics:
      - Customer Lifetime Value (CLV)
      - Customer Acquisition Cost (CAC)
      - Net Promoter Score (NPS)
      - Churn Rate (CHR)
      
    - Revenue Metrics:
      - Gross Revenue (GRV)
      - Net Revenue (NRV)
      - Revenue per User (RPU)
      - Revenue Growth Rate (RGR)

  2. Updates
    - Links metrics to their respective groups
    - Maintains consistent formatting and descriptions
*/

-- Get first user ID for sample data
DO $$
DECLARE
  first_user_id uuid;
  sales_group_id uuid;
  customer_group_id uuid;
  revenue_group_id uuid;
BEGIN
  -- Get first user
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;

  -- Create metric groups if they don't exist
  INSERT INTO metric_groups (name, description, user_id, is_public)
  VALUES 
    (
      'Sales Metrics',
      'Key metrics for tracking sales performance and revenue generation',
      first_user_id,
      true
    ),
    (
      'Customer Metrics',
      'Metrics focused on customer behavior, retention, and satisfaction',
      first_user_id,
      true
    ),
    (
      'Revenue Metrics',
      'Financial metrics for tracking revenue growth and profitability',
      first_user_id,
      true
    )
  ON CONFLICT (user_id, name) DO NOTHING
  RETURNING id INTO revenue_group_id;

  -- Get group IDs
  SELECT id INTO sales_group_id FROM metric_groups WHERE name = 'Sales Metrics' LIMIT 1;
  SELECT id INTO customer_group_id FROM metric_groups WHERE name = 'Customer Metrics' LIMIT 1;
  SELECT id INTO revenue_group_id FROM metric_groups WHERE name = 'Revenue Metrics' LIMIT 1;

  -- Add Sales Metrics
  INSERT INTO metrics (
    name,
    abbreviation,
    description,
    calculation_method,
    is_public,
    user_id,
    group_id
  )
  VALUES
    (
      'Monthly Recurring Revenue',
      'MRR',
      'Total revenue generated from all active subscriptions in a month',
      'SUM(subscription_amount) WHERE status = ''active''',
      true,
      first_user_id,
      sales_group_id
    ),
    (
      'Average Order Value',
      'AOV',
      'Average amount spent per order',
      'SUM(order_total) / COUNT(DISTINCT order_id)',
      true,
      first_user_id,
      sales_group_id
    ),
    (
      'Sales Growth Rate',
      'SGR',
      'Percentage increase in sales compared to previous period',
      '((current_period_sales - previous_period_sales) / previous_period_sales) * 100',
      true,
      first_user_id,
      sales_group_id
    ),
    (
      'Conversion Rate',
      'CVR',
      'Percentage of visitors who complete a purchase',
      '(completed_purchases / total_visitors) * 100',
      true,
      first_user_id,
      sales_group_id
    )
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Add Customer Metrics
  INSERT INTO metrics (
    name,
    abbreviation,
    description,
    calculation_method,
    is_public,
    user_id,
    group_id
  )
  VALUES
    (
      'Customer Lifetime Value',
      'CLV',
      'Total revenue expected from a customer throughout their relationship',
      'AVG(purchase_value) * purchase_frequency * avg_customer_lifespan',
      true,
      first_user_id,
      customer_group_id
    ),
    (
      'Customer Acquisition Cost',
      'CAC',
      'Average cost to acquire a new customer',
      'SUM(marketing_spend) / COUNT(new_customers)',
      true,
      first_user_id,
      customer_group_id
    ),
    (
      'Net Promoter Score',
      'NPS',
      'Measure of customer satisfaction and loyalty',
      '((promoters - detractors) / total_responses) * 100',
      true,
      first_user_id,
      customer_group_id
    ),
    (
      'Churn Rate',
      'CHR',
      'Percentage of customers who stop using the service',
      '(churned_customers / total_customers_start) * 100',
      true,
      first_user_id,
      customer_group_id
    )
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Add Revenue Metrics
  INSERT INTO metrics (
    name,
    abbreviation,
    description,
    calculation_method,
    is_public,
    user_id,
    group_id
  )
  VALUES
    (
      'Gross Revenue',
      'GRV',
      'Total revenue before deductions',
      'SUM(revenue) BEFORE deductions',
      true,
      first_user_id,
      revenue_group_id
    ),
    (
      'Net Revenue',
      'NRV',
      'Revenue after all deductions and adjustments',
      'gross_revenue - (refunds + discounts + adjustments)',
      true,
      first_user_id,
      revenue_group_id
    ),
    (
      'Revenue per User',
      'RPU',
      'Average revenue generated per active user',
      'total_revenue / active_users',
      true,
      first_user_id,
      revenue_group_id
    ),
    (
      'Revenue Growth Rate',
      'RGR',
      'Percentage increase in revenue over time',
      '((current_period_revenue - previous_period_revenue) / previous_period_revenue) * 100',
      true,
      first_user_id,
      revenue_group_id
    )
  ON CONFLICT (user_id, name) DO NOTHING;

END $$;