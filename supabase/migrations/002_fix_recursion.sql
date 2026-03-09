-- =============================================
-- Migration 002: Fix Infinite Recursion in RLS
-- =============================================

-- 1. Helper function to get current user's org_id without triggering RLS recursively
-- SECURITY DEFINER allows this function to bypass RLS policies
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT org_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Drop problematic policies on profiles
DROP POLICY IF EXISTS "Tenant isolation select" ON profiles;
DROP POLICY IF EXISTS "Tenant isolation update" ON profiles;

-- 3. Re-create policies using the helper function
-- Policies now call the security definer function instead of querying the table directly

CREATE POLICY "Tenant isolation select" ON profiles FOR SELECT
  USING (
    id = auth.uid() -- Always allow user to see their own profile
    OR
    (org_id IS NOT NULL AND org_id = get_my_org_id()) -- Allow seeing other members of the same org
  );

CREATE POLICY "Tenant isolation update" ON profiles FOR UPDATE
  USING (
    id = auth.uid() -- Users can update their own profile
    OR
    (org_id IS NOT NULL AND org_id = get_my_org_id()) -- Admins/Members can update profiles in their org (can be refined later)
  );

-- 4. Ensure other tables also use the safe function if they were recursive (optional but good practice)
-- (Your other policies subselect from profiles, which is fine now that profiles RLS is fixed, 
-- but using get_my_org_id() is more performant).

-- Example update for leads (optional optimization, current one works if profiles is fixed):
-- DROP POLICY IF EXISTS "Tenant isolation" ON leads;
-- CREATE POLICY "Tenant isolation" ON leads
-- USING (org_id = get_my_org_id())
-- WITH CHECK (org_id = get_my_org_id());
