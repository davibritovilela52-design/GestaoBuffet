-- =============================================
-- Migration 003: Robust RLS Recursion Fix
-- =============================================

-- 1. Helper function to get current user's org_id without triggering RLS recursively
-- SECURITY DEFINER allows this function to bypass RLS policies
-- SET search_path = public ensures it uses the correct schema
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Clean up ALL existing problematic policies
-- Using a loop or explicit drops for all tables mentioned in 001/002
DROP POLICY IF EXISTS "Tenant isolation select" ON public.profiles;
DROP POLICY IF EXISTS "Tenant isolation update" ON public.profiles;
DROP POLICY IF EXISTS "Tenant isolation insert" ON public.profiles;

DROP POLICY IF EXISTS "Tenant isolation" ON public.leads;
DROP POLICY IF EXISTS "Public lead creation" ON public.leads;

DROP POLICY IF EXISTS "Tenant isolation" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "Tenant isolation" ON public.receita_despesa;
DROP POLICY IF EXISTS "Tenant isolation" ON public.payment_alerts;
DROP POLICY IF EXISTS "Tenant isolation" ON public.documentos_negocio;

DROP POLICY IF EXISTS "Users can view their own org" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their org" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create orgs" ON public.organizations;

-- 3. Re-create policies using the safe function

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_access" ON public.profiles 
  USING (id = auth.uid()) 
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_org_access" ON public.profiles FOR SELECT
  USING (org_id IS NOT NULL AND org_id = get_my_org_id());

-- organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_select" ON public.organizations FOR SELECT
  USING (id = get_my_org_id());

CREATE POLICY "org_owner_update" ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "org_insert" ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_isolation" ON public.leads
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

CREATE POLICY "leads_public_insert" ON public.leads FOR INSERT
  WITH CHECK (TRUE);

-- interesses_funcionarios
ALTER TABLE public.interesses_funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interesses_isolation" ON public.interesses_funcionarios
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- receita_despesa
ALTER TABLE public.receita_despesa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receita_isolation" ON public.receita_despesa
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- payment_alerts
ALTER TABLE public.payment_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_isolation" ON public.payment_alerts
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());

-- documentos_negocio
ALTER TABLE public.documentos_negocio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_isolation" ON public.documentos_negocio
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());
