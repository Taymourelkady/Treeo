/*
  # Add Abbreviation Column to Metrics Table

  1. Changes
    - Add abbreviation column to metrics table
    - Update existing metrics with their abbreviations
    - Add NOT NULL constraint after populating data

  2. Updates
    - Sales Metrics: MRR, ARPU, SGR
    - Customer Metrics: CRR, CAC, CLV, NPS
    - Inventory Metrics: ITR, DIO, SSR, SR
*/

-- Add abbreviation column
ALTER TABLE metrics
ADD COLUMN abbreviation text;

-- Update Sales Metrics
UPDATE metrics
SET abbreviation = CASE
  WHEN name = 'Monthly Recurring Revenue' THEN 'MRR'
  WHEN name = 'Average Revenue Per User' THEN 'ARPU'
  WHEN name = 'Sales Growth Rate' THEN 'SGR'
END
WHERE name IN ('Monthly Recurring Revenue', 'Average Revenue Per User', 'Sales Growth Rate');

-- Update Customer Metrics
UPDATE metrics
SET abbreviation = CASE
  WHEN name = 'Customer Retention Rate' THEN 'CRR'
  WHEN name = 'Customer Acquisition Cost' THEN 'CAC'
  WHEN name = 'Customer Lifetime Value' THEN 'CLV'
  WHEN name = 'Net Promoter Score' THEN 'NPS'
END
WHERE name IN ('Customer Retention Rate', 'Customer Acquisition Cost', 'Customer Lifetime Value', 'Net Promoter Score');

-- Update Inventory Metrics
UPDATE metrics
SET abbreviation = CASE
  WHEN name = 'Inventory Turnover Rate' THEN 'ITR'
  WHEN name = 'Days of Inventory Outstanding' THEN 'DIO'
  WHEN name = 'Stock-to-Sales Ratio' THEN 'SSR'
  WHEN name = 'Stockout Rate' THEN 'SR'
END
WHERE name IN ('Inventory Turnover Rate', 'Days of Inventory Outstanding', 'Stock-to-Sales Ratio', 'Stockout Rate');

-- Make abbreviation required after populating data
ALTER TABLE metrics
ALTER COLUMN abbreviation SET NOT NULL;