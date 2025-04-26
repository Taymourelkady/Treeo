/*
  # Dashboard Tables Setup

  1. New Tables
    - `dashboards`
      - Core dashboard information
      - User ownership tracking
      - Public/private visibility
    
    - `dashboard_components`
      - Individual dashboard components (charts, metrics)
      - Configuration storage
      - Position tracking

  2. Security
    - Drop existing policies if any
    - Enable RLS on both tables
    - Add policies for CRUD operations
    - Ensure proper access control
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can create dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can update own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can delete own dashboards" ON dashboards;
DROP POLICY IF EXISTS "Users can read dashboard components" ON dashboard_components;
DROP POLICY IF EXISTS "Users can create dashboard components" ON dashboard_components;
DROP POLICY IF EXISTS "Users can update dashboard components" ON dashboard_components;
DROP POLICY IF EXISTS "Users can delete dashboard components" ON dashboard_components;

-- Create dashboard table
CREATE TABLE IF NOT EXISTS dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  creation_method creation_method NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  UNIQUE(user_id, title)
);

-- Create dashboard components table
CREATE TABLE IF NOT EXISTS dashboard_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid REFERENCES dashboards(id) ON DELETE CASCADE,
  type component_type NOT NULL,
  configuration jsonb DEFAULT '{}',
  query_text text,
  chat_prompt text,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_dashboard_components_dashboard_id ON dashboard_components(dashboard_id);

-- Enable RLS
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_components ENABLE ROW LEVEL SECURITY;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_components_updated_at
  BEFORE UPDATE ON dashboard_components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create new policies for dashboards
CREATE POLICY "Users can read dashboards"
  ON dashboards
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_public = true
  );

CREATE POLICY "Users can create dashboards"
  ON dashboards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update own dashboards"
  ON dashboards
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete own dashboards"
  ON dashboards
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Create new policies for dashboard components
CREATE POLICY "Users can read dashboard components"
  ON dashboard_components
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_id
      AND (
        dashboards.user_id = auth.uid() OR
        dashboards.is_public = true
      )
    )
  );

CREATE POLICY "Users can create dashboard components"
  ON dashboard_components
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_id
      AND dashboards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dashboard components"
  ON dashboard_components
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_id
      AND dashboards.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_id
      AND dashboards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dashboard components"
  ON dashboard_components
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_id
      AND dashboards.user_id = auth.uid()
    )
  );