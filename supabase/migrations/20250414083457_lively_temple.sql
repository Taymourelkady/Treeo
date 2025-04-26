/*
  # Fix Metrics Relationship

  1. Changes
    - Add foreign key relationship between metrics and metric_groups tables
    - Update existing metrics to reference the correct group_id
    - Add index for better query performance

  2. Security
    - No changes to RLS policies needed
*/

-- Rename existing group_id column to avoid conflicts
ALTER TABLE metrics 
RENAME COLUMN group_id TO old_group_id;

-- Add new group_id column with proper foreign key constraint
ALTER TABLE metrics
ADD COLUMN group_id uuid REFERENCES metric_groups(id);

-- Update existing metrics with their group IDs
UPDATE metrics
SET group_id = old_group_id
WHERE old_group_id IS NOT NULL;

-- Drop old column
ALTER TABLE metrics
DROP COLUMN old_group_id;

-- Add index for better join performance
CREATE INDEX idx_metrics_group_id ON metrics(group_id);