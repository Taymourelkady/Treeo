/*
  # Authentication Setup

  1. New Tables
    - `users` table to store user records
    - Trigger to create profile records on user signup

  2. Security
    - Enable RLS on users table
    - Add policies for user access

  3. Default Data
    - Create default access levels
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own record" 
  ON public.users
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Create default access levels if they don't exist
INSERT INTO public.access_levels (name, description)
VALUES 
  ('admin', 'Full system access'),
  ('user', 'Standard user access')
ON CONFLICT (name) DO NOTHING;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  default_access_level_id uuid;
BEGIN
  -- Get the default access level ID (user)
  SELECT id INTO default_access_level_id
  FROM public.access_levels
  WHERE name = 'user'
  LIMIT 1;

  -- Create user record
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);

  -- Create profile record
  INSERT INTO public.profiles (id, email, access_level_id)
  VALUES (new.id, new.email, default_access_level_id);

  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();