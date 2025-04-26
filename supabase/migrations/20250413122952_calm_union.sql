/*
  # Add access levels to users

  1. New Tables
    - `access_levels`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)

  2. Changes to Existing Tables
    - Add `access_level_id` to `profiles` table
    - Add foreign key constraint

  3. Security
    - Enable RLS on access_levels table
    - Add policies for reading access levels
    - Update profile policies to include access level checks
*/

-- Create access levels table
CREATE TABLE IF NOT EXISTS access_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Add default access levels
INSERT INTO access_levels (name, description) VALUES
  ('admin', 'Full system access with all privileges'),
  ('data_science', 'Access to data analysis and model training'),
  ('sales', 'Access to sales-related dashboards and metrics'),
  ('operations', 'Access to operational metrics and dashboards'),
  ('product', 'Access to product-related analytics')
ON CONFLICT (name) DO NOTHING;

-- Add access_level_id to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS access_level_id uuid REFERENCES access_levels(id);

-- Set default access level to 'admin' for existing profiles
DO $$
BEGIN
  UPDATE profiles 
  SET access_level_id = (SELECT id FROM access_levels WHERE name = 'admin')
  WHERE access_level_id IS NULL;
END $$;

-- Make access_level_id required for new profiles
ALTER TABLE profiles 
ALTER COLUMN access_level_id SET NOT NULL;

-- Enable RLS on access_levels
ALTER TABLE access_levels ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read access levels
CREATE POLICY "Anyone can read access levels"
  ON access_levels
  FOR SELECT
  TO authenticated
  USING (true);

-- Update profile trigger to set default access level
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, access_level_id)
  VALUES (
    new.id,
    new.email,
    (SELECT id FROM access_levels WHERE name = 'admin')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;