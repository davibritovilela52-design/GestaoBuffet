-- =============================================
-- Migration 001: Multi-Tenancy Foundation
-- =============================================

-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  max_leads INT DEFAULT 15,
  max_members INT DEFAULT 2,
  max_storage_mb INT DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id)
);

-- 2. Add org_id to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE interesses_funcionarios ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE receita_despesa ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE payment_alerts ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
ALTER TABLE documentos_negocio ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(org_id);
CREATE INDEX IF NOT EXISTS idx_receita_org ON receita_despesa(org_id);
CREATE INDEX IF NOT EXISTS idx_interesses_org ON interesses_funcionarios(org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org ON payment_alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_docs_org ON documentos_negocio(org_id);
CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_owner ON organizations(owner_id);

-- 4. Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own org"
  ON organizations FOR SELECT
  USING (id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Owners can update their org"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create orgs"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. RLS policies for tenant isolation on existing tables

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation select" ON profiles;
CREATE POLICY "Tenant isolation select" ON profiles FOR SELECT
  USING (
    org_id IS NULL -- allow reading own profile before org assignment
    OR org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "Tenant isolation insert" ON profiles;
CREATE POLICY "Tenant isolation insert" ON profiles FOR INSERT
  WITH CHECK (TRUE); -- profile creation handled during auth signup

DROP POLICY IF EXISTS "Tenant isolation update" ON profiles;
CREATE POLICY "Tenant isolation update" ON profiles FOR UPDATE
  USING (
    id = auth.uid() -- users can update own profile
    OR org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid())
  );

-- leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON leads;
CREATE POLICY "Tenant isolation" ON leads
  USING (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()))
  WITH CHECK (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()));

-- interesses_funcionarios
ALTER TABLE interesses_funcionarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON interesses_funcionarios;
CREATE POLICY "Tenant isolation" ON interesses_funcionarios
  USING (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()))
  WITH CHECK (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()));

-- receita_despesa
ALTER TABLE receita_despesa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON receita_despesa;
CREATE POLICY "Tenant isolation" ON receita_despesa
  USING (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()))
  WITH CHECK (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()));

-- payment_alerts
ALTER TABLE payment_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON payment_alerts;
CREATE POLICY "Tenant isolation" ON payment_alerts
  USING (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()))
  WITH CHECK (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()));

-- documentos_negocio
ALTER TABLE documentos_negocio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON documentos_negocio;
CREATE POLICY "Tenant isolation" ON documentos_negocio
  USING (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()))
  WITH CHECK (org_id = (SELECT p.org_id FROM profiles p WHERE p.id = auth.uid()));

-- 6. Public access policy for leads (public form creates leads without auth)
DROP POLICY IF EXISTS "Public lead creation" ON leads;
CREATE POLICY "Public lead creation" ON leads FOR INSERT
  WITH CHECK (TRUE); -- Public form inserts are allowed, org_id is set by the form

-- 7. RPC: Create organization and assign to profile (atomic)
CREATE OR REPLACE FUNCTION create_organization(
  p_name TEXT,
  p_slug TEXT
) RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID := auth.uid();
BEGIN
  -- Create org
  INSERT INTO organizations (name, slug, owner_id)
  VALUES (p_name, p_slug, v_user_id)
  RETURNING id INTO v_org_id;

  -- Assign org to profile
  UPDATE profiles SET org_id = v_org_id WHERE id = v_user_id;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update create_profile_for_user to accept org_id
CREATE OR REPLACE FUNCTION create_profile_for_user(
  p_user_id UUID,
  p_email TEXT,
  p_nome TEXT,
  p_role TEXT,
  p_org_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO profiles (id, email, nome, role, status, org_id)
  VALUES (p_user_id, p_email, p_nome, p_role, 'ACTIVE', p_org_id)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    org_id = COALESCE(EXCLUDED.org_id, profiles.org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
