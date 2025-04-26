/*
  # Fix Metric Groups Policies

  1. Changes
    - Update RLS policies for metric_groups table to allow authenticated users to:
      - Create new metric groups
      - Read their own metric groups
      - Update their own metric groups
      - Delete their own metric groups
    - Ensure proper security while maintaining functionality

  2. Security
    - Maintain RLS enabled
    - Only allow users to manage their own metric groups
    - Allow reading of public metric groups
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own metric groups" ON metric_groups;
DROP POLICY IF EXISTS "Users can insert own metric groups" ON metric_groups;
DROP POLICY IF EXISTS "Users can update own metric groups" ON metric_groups;
DROP POLICY IF EXISTS "Users can delete own metric groups" ON metric_groups;

-- Create new policies
CREATE POLICY "Users can read metric groups"
  ON metric_groups
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      user_id = auth.uid() OR 
      is_public = true
    )
  );

CREATE POLICY "Users can create metric groups"
  ON metric_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can update own metric groups"
  ON metric_groups
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    deleted_at IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete own metric groups"
  ON metric_groups
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    deleted_at IS NULL
  );