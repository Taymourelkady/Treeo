/*
  # Fix shared access policies recursion

  1. Changes
    - Drop and recreate the "Users can manage sharing for own resources" policy
    - Modify the policy to check resource ownership directly without recursion
    - Keep other policies unchanged

  2. Security
    - Maintains existing security model but eliminates infinite recursion
    - Users can still only manage sharing for resources they own
    - Read access for shared resources remains unchanged
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can manage sharing for own resources" ON shared_access;

-- Recreate the policy with non-recursive logic
CREATE POLICY "Users can manage sharing for own resources" ON shared_access
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  CASE 
    WHEN resource_type = 'dashboard'::resource_type THEN
      EXISTS (
        SELECT 1 FROM dashboards 
        WHERE dashboards.id = resource_id 
        AND dashboards.user_id = auth.uid()
      )
    WHEN resource_type = 'metric'::resource_type THEN
      EXISTS (
        SELECT 1 FROM metrics 
        WHERE metrics.id = resource_id 
        AND metrics.user_id = auth.uid()
      )
    WHEN resource_type = 'query'::resource_type THEN
      EXISTS (
        SELECT 1 FROM queries 
        WHERE queries.id = resource_id 
        AND queries.user_id = auth.uid()
      )
    ELSE false
  END
);