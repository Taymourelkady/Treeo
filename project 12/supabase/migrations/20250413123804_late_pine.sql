/*
  # Implement MVP Schema

  1. New Tables
    - `dashboards`: Stores dashboard information and metadata
    - `dashboard_components`: Stores individual components within dashboards
    - `metrics`: Stores metric definitions and calculations
    - `queries`: Stores SQL queries and their natural language descriptions
    - `training_sessions`: Stores model training data
    - `shared_access`: Manages resource sharing between users

  2. Enums
    - Creation method types
    - Component types
    - Resource types
    - Access level types

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read/write their own resources
      - Read shared resources
      - Manage sharing for their resources
*/

-- Create enums
CREATE TYPE creation_method AS ENUM ('chat', 'query');
CREATE TYPE component_type AS ENUM ('chart', 'metric', 'table');
CREATE TYPE resource_type AS ENUM ('dashboard', 'metric', 'query');
CREATE TYPE access_level_type AS ENUM ('view', 'edit');

-- Create dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  creation_method creation_method NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  UNIQUE(user_id, title)
);

-- Create dashboard_components table
CREATE TABLE IF NOT EXISTS dashboard_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid REFERENCES dashboards(id) ON DELETE CASCADE,
  type component_type NOT NULL,
  configuration jsonb DEFAULT '{}',
  query_text text,
  chat_prompt text,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  calculation_method text,
  created_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  UNIQUE(user_id, name)
);

-- Create queries table
CREATE TABLE IF NOT EXISTS queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sql_text text NOT NULL,
  natural_language_description text,
  created_at timestamptz DEFAULT now(),
  last_run_at timestamptz,
  UNIQUE(user_id, name)
);

-- Create training_sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  natural_language_input text NOT NULL,
  sql_query text NOT NULL,
  status text CHECK (status IN ('success', 'failure')),
  created_at timestamptz DEFAULT now()
);

-- Create shared_access table
CREATE TABLE IF NOT EXISTS shared_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type resource_type NOT NULL,
  resource_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  access_level access_level_type NOT NULL DEFAULT 'view',
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource_type, resource_id, user_id)
);

-- Enable RLS
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;

-- Policies for dashboards
CREATE POLICY "Users can read own dashboards"
  ON dashboards
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM shared_access
      WHERE resource_type = 'dashboard'
      AND resource_id = dashboards.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own dashboards"
  ON dashboards
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own dashboards"
  ON dashboards
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own dashboards"
  ON dashboards
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for dashboard_components
CREATE POLICY "Users can read dashboard components"
  ON dashboard_components
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE id = dashboard_components.dashboard_id
      AND (
        user_id = auth.uid() OR
        is_public = true OR
        EXISTS (
          SELECT 1 FROM shared_access
          WHERE resource_type = 'dashboard'
          AND resource_id = dashboards.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert dashboard components"
  ON dashboard_components
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE id = dashboard_components.dashboard_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update dashboard components"
  ON dashboard_components
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE id = dashboard_components.dashboard_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE id = dashboard_components.dashboard_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete dashboard components"
  ON dashboard_components
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE id = dashboard_components.dashboard_id
      AND user_id = auth.uid()
    )
  );

-- Policies for metrics
CREATE POLICY "Users can read own metrics"
  ON metrics
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM shared_access
      WHERE resource_type = 'metric'
      AND resource_id = metrics.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own metrics"
  ON metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own metrics"
  ON metrics
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own metrics"
  ON metrics
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for queries
CREATE POLICY "Users can read own queries"
  ON queries
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM shared_access
      WHERE resource_type = 'query'
      AND resource_id = queries.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own queries"
  ON queries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own queries"
  ON queries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own queries"
  ON queries
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for training_sessions
CREATE POLICY "Users can read own training sessions"
  ON training_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own training sessions"
  ON training_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policies for shared_access
CREATE POLICY "Users can read shared access entries"
  ON shared_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage sharing for own resources"
  ON shared_access
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dashboards WHERE id = resource_id AND user_id = auth.uid()
      UNION
      SELECT 1 FROM metrics WHERE id = resource_id AND user_id = auth.uid()
      UNION
      SELECT 1 FROM queries WHERE id = resource_id AND user_id = auth.uid()
    )
  );