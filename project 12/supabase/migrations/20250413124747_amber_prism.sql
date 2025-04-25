/*
  # Add Connection Config Table
  
  1. New Tables
    - `connection_config`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Identifier for the connection
      - `host` (text) - Database host
      - `database` (text) - Database name
      - `port` (integer) - Database port
      - `user_name` (text) - Database user
      - `password` (text) - Database password (stored securely)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
  2. Security
    - Enable RLS on connection_config table
    - No policies added - table only accessible via service role
    - Secure password storage
*/

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create connection_config table
CREATE TABLE IF NOT EXISTS connection_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  host text NOT NULL,
  database text NOT NULL,
  port integer NOT NULL DEFAULT 5432,
  user_name text NOT NULL,
  password text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_connection_timestamp_trigger
  BEFORE UPDATE ON connection_config
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_timestamp();

-- Enable RLS
ALTER TABLE connection_config ENABLE ROW LEVEL SECURITY;

-- Insert mockdata connection with encrypted password using pgcrypto
INSERT INTO connection_config (
  name,
  host,
  database,
  port,
  user_name,
  password
) VALUES (
  'mockdata',
  'db.example.com',
  'mockdata',
  5432,
  'mock_user',
  crypt('mock_password', gen_salt('bf'))
);