-- =============================================
-- Migration 004: Fix Insecure user_metadata RLS
-- =============================================

-- 1. Helper function to check if current user is Admin securely
-- SECURITY DEFINER allows this function to bypass RLS policies
-- SET search_path = public ensures it uses the correct schema
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'Administrador'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Drop the insecure policy
-- Based on the error message provided by the user
DROP POLICY IF EXISTS "interesses_insert_admin" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "interesses_isolation" ON public.interesses_funcionarios;

-- 3. Re-create secure policies for interesses_funcionarios

-- Allow employees to view and manifest interest in deals within their org
CREATE POLICY "interesses_standard_access" ON public.interesses_funcionarios
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- Allow admins full control over interests (if needed, otherwise standard access might suffice)
CREATE POLICY "interesses_admin_full_access" ON public.interesses_funcionarios
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 4. Audit other policies for user_metadata (Best effort as we can't see all existing manual policies)
-- The user only reported interests, but we ensure our own migrations are clean.
