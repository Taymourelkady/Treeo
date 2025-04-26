/*
  # Add Visualization Preferences to Metrics

  1. New Enums
    - `visualization_type`: Defines how the metric should be displayed
      - line: Line chart for time series
      - bar: Bar chart for comparisons
      - pie: Pie chart for proportions
      - metric: Single number display
    
    - `time_granularity`: Defines the time period for aggregation
      - daily: Daily aggregation
      - weekly: Weekly aggregation
      - monthly: Monthly aggregation

  2. Changes to Metrics Table
    - Add visualization_type column
    - Add time_granularity column
    - Add formatting column for display options (JSONB)

  3. Security
    - No changes to RLS policies needed
    - Existing metric policies cover new columns
*/

-- Create visualization type enum
CREATE TYPE visualization_type AS ENUM (
  'line',
  'bar',
  'pie',
  'metric'
);

-- Create time granularity enum
CREATE TYPE time_granularity AS ENUM (
  'daily',
  'weekly',
  'monthly'
);

-- Add visualization columns to metrics table
ALTER TABLE metrics
ADD COLUMN visualization_type visualization_type DEFAULT 'metric',
ADD COLUMN time_granularity time_granularity DEFAULT 'monthly',
ADD COLUMN formatting jsonb DEFAULT '{}'::jsonb;