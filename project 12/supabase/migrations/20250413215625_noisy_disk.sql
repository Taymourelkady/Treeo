/*
  # Add Metric Groups

  1. New Tables
    - `metric_groups`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `user_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `is_public` (boolean)

  2. Changes
    - Add `group_id` column to metrics table
    - Add foreign key constraint
    - Add initial metric groups
    - Update existing metrics with group assignments

  3. Security
    - Enable RLS on metric_groups
    - Add policies for CRUD operations
*/

-- Create metric_groups table
CREATE TABLE IF NOT EXISTS metric_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE metric_groups ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read own metric groups"
  ON metric_groups
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    is_public = true OR 
    EXISTS (
      SELECT 1 FROM shared_access 
      WHERE resource_type = 'metric'::resource_type 
      AND resource_id = metric_groups.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own metric groups"
  ON metric_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own metric groups"
  ON metric_groups
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own metric groups"
  ON metric_groups
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add group_id to metrics table
ALTER TABLE metrics 
ADD COLUMN group_id uuid REFERENCES metric_groups(id);

-- Insert default metric groups
INSERT INTO metric_groups (name, description, user_id, is_public)
VALUES 
(
  'Sales Metrics',
  'Key performance indicators related to sales performance and revenue',
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Customer Metrics',
  'Metrics tracking customer behavior, retention, and satisfaction',
  (SELECT id FROM users LIMIT 1),
  true
),
(
  'Financial Metrics',
  'Financial performance and health indicators',
  (SELECT id FROM users LIMIT 1),
  true
);

-- Update existing metrics with group assignments
UPDATE metrics
SET group_id = (
  SELECT id FROM metric_groups 
  WHERE name = 'Sales Metrics' 
  LIMIT 1
)
WHERE name IN (
  'Monthly Recurring Revenue',
  'Average Revenue Per User',
  'Sales Growth Rate'
);