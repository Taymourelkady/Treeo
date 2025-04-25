/*
  # Add Chat Queries Table

  1. New Tables
    - `chat_queries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `prompt` (text)
      - `generated_sql` (text)
      - `visualization_type` (enum)
      - `created_at` (timestamp)
      - `executed_at` (timestamp)
      - `execution_successful` (boolean)
      - `result_sample` (jsonb)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create chat_queries table
CREATE TABLE IF NOT EXISTS chat_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  generated_sql text NOT NULL,
  visualization_type visualization_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  executed_at timestamptz,
  execution_successful boolean,
  result_sample jsonb,
  CONSTRAINT valid_result_sample CHECK (
    (execution_successful = false AND result_sample IS NULL) OR
    (execution_successful = true)
  )
);

-- Enable RLS
ALTER TABLE chat_queries ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read own chat queries"
  ON chat_queries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat queries"
  ON chat_queries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat queries"
  ON chat_queries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());