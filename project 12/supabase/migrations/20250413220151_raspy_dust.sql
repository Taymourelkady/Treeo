/*
  # Update Metrics Structure

  1. Changes
    - Add deleted_at column to metric_groups
    - Add deleted_at column to metrics
    - Update existing metrics with proper group assignments
    - Add indexes for performance

  2. Security
    - Update RLS policies to handle soft deletes
*/

-- Add deleted_at column to metric_groups
ALTER TABLE metric_groups
ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Add deleted_at column to metrics
ALTER TABLE metrics
ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Add indexes for better query performance
CREATE INDEX idx_metric_groups_deleted_at ON metric_groups(deleted_at);
CREATE INDEX idx_metrics_deleted_at ON metrics(deleted_at);
CREATE INDEX idx_metrics_group_id ON metrics(group_id);

-- Update RLS policies to handle soft deletes
DROP POLICY IF EXISTS "Users can read own metric groups" ON metric_groups;
CREATE POLICY "Users can read own metric groups"
  ON metric_groups
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      user_id = auth.uid() OR 
      is_public = true OR 
      EXISTS (
        SELECT 1 FROM shared_access 
        WHERE resource_type = 'metric'::resource_type 
        AND resource_id = metric_groups.id 
        AND user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can read own metrics" ON metrics;
CREATE POLICY "Users can read own metrics"
  ON metrics
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      user_id = auth.uid() OR 
      is_public = true OR 
      EXISTS (
        SELECT 1 FROM shared_access 
        WHERE resource_type = 'metric'::resource_type 
        AND resource_id = metrics.id 
        AND user_id = auth.uid()
      )
    )
  );

-- Function to soft delete metric groups
CREATE OR REPLACE FUNCTION soft_delete_metric_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Instead of deleting, update deleted_at timestamp
  UPDATE metric_groups
  SET deleted_at = now()
  WHERE id = OLD.id;
  
  -- Also mark all associated metrics as deleted
  UPDATE metrics
  SET deleted_at = now()
  WHERE group_id = OLD.id;
  
  RETURN NULL;
END;
$$;

-- Create trigger for soft deletes
CREATE TRIGGER before_metric_group_delete
  BEFORE DELETE ON metric_groups
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete_metric_group();