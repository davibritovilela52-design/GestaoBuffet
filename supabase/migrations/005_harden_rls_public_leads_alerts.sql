-- =============================================
-- Migration 005: Harden tenant RLS and public lead capture
-- =============================================

-- Helpers
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'Administrador'
      AND status = 'ACTIVE'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.lead_in_my_org(p_lead_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leads
    WHERE id = p_lead_id
      AND org_id = public.get_my_org_id()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.get_my_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lead_in_my_org(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_in_my_org(UUID) TO authenticated;

ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'Realizado';

ALTER TABLE public.payment_alerts
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date DATE;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interesses_funcionarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receita_despesa TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_negocio TO authenticated;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles',
        'organizations',
        'leads',
        'interesses_funcionarios',
        'receita_despesa',
        'payment_alerts',
        'documentos_negocio'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Remove broad legacy policies before recreating least-privilege access.
DROP POLICY IF EXISTS "Tenant isolation select" ON public.profiles;
DROP POLICY IF EXISTS "Tenant isolation insert" ON public.profiles;
DROP POLICY IF EXISTS "Tenant isolation update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_org_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_before_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update_org_members" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own org" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their org" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create orgs" ON public.organizations;
DROP POLICY IF EXISTS "org_select" ON public.organizations;
DROP POLICY IF EXISTS "org_owner_update" ON public.organizations;
DROP POLICY IF EXISTS "org_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_authenticated" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_owner" ON public.organizations;

DROP POLICY IF EXISTS "Tenant isolation" ON public.leads;
DROP POLICY IF EXISTS "Public lead creation" ON public.leads;
DROP POLICY IF EXISTS "leads_isolation" ON public.leads;
DROP POLICY IF EXISTS "leads_public_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_select_org" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_insert_org" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_update_org" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_delete_org" ON public.leads;

DROP POLICY IF EXISTS "Tenant isolation" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "interesses_isolation" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "interesses_standard_access" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "interesses_admin_full_access" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "interesses_select_org" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "interesses_insert_self_or_admin" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "interesses_update_admin_only" ON public.interesses_funcionarios;
DROP POLICY IF EXISTS "interesses_delete_admin_or_own_pending" ON public.interesses_funcionarios;

DROP POLICY IF EXISTS "Tenant isolation" ON public.receita_despesa;
DROP POLICY IF EXISTS "receita_isolation" ON public.receita_despesa;
DROP POLICY IF EXISTS "receita_select_org" ON public.receita_despesa;
DROP POLICY IF EXISTS "receita_admin_insert_org" ON public.receita_despesa;
DROP POLICY IF EXISTS "receita_admin_update_org" ON public.receita_despesa;
DROP POLICY IF EXISTS "receita_admin_delete_org" ON public.receita_despesa;

DROP POLICY IF EXISTS "Tenant isolation" ON public.payment_alerts;
DROP POLICY IF EXISTS "alerts_isolation" ON public.payment_alerts;
DROP POLICY IF EXISTS "alerts_select_org" ON public.payment_alerts;
DROP POLICY IF EXISTS "alerts_admin_insert_org" ON public.payment_alerts;
DROP POLICY IF EXISTS "alerts_admin_update_org" ON public.payment_alerts;
DROP POLICY IF EXISTS "alerts_admin_delete_org" ON public.payment_alerts;

DROP POLICY IF EXISTS "Tenant isolation" ON public.documentos_negocio;
DROP POLICY IF EXISTS "docs_isolation" ON public.documentos_negocio;
DROP POLICY IF EXISTS "docs_select_org" ON public.documentos_negocio;
DROP POLICY IF EXISTS "docs_admin_insert_org" ON public.documentos_negocio;
DROP POLICY IF EXISTS "docs_admin_update_org" ON public.documentos_negocio;
DROP POLICY IF EXISTS "docs_admin_delete_org" ON public.documentos_negocio;

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_self_or_org" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (org_id IS NOT NULL AND org_id = public.get_my_org_id())
  );

CREATE POLICY "profiles_insert_self_before_org" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND org_id IS NULL
    AND role IN ('Administrador', 'Funcionario')
  );

CREATE POLICY "profiles_admin_update_org_members" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id())
  WITH CHECK (public.is_admin() AND org_id = public.get_my_org_id());

-- organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select_own" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.get_my_org_id());

CREATE POLICY "organizations_insert_authenticated" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "organizations_update_owner" ON public.organizations
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_org" ON public.leads
  FOR SELECT TO authenticated
  USING (org_id = public.get_my_org_id());

CREATE POLICY "leads_admin_insert_org" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND org_id = public.get_my_org_id());

CREATE POLICY "leads_admin_update_org" ON public.leads
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id())
  WITH CHECK (public.is_admin() AND org_id = public.get_my_org_id());

CREATE POLICY "leads_admin_delete_org" ON public.leads
  FOR DELETE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id());

-- interesses_funcionarios
ALTER TABLE public.interesses_funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interesses_select_org" ON public.interesses_funcionarios
  FOR SELECT TO authenticated
  USING (org_id = public.get_my_org_id());

CREATE POLICY "interesses_insert_self_or_admin" ON public.interesses_funcionarios
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.get_my_org_id()
    AND public.lead_in_my_org(lead_id)
    AND (user_id = auth.uid() OR public.is_admin())
  );

CREATE POLICY "interesses_update_admin_only" ON public.interesses_funcionarios
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id())
  WITH CHECK (public.is_admin() AND org_id = public.get_my_org_id());

CREATE POLICY "interesses_delete_admin_or_own_pending" ON public.interesses_funcionarios
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND org_id = public.get_my_org_id())
    OR (user_id = auth.uid() AND org_id = public.get_my_org_id() AND status = 'pendente')
  );

-- receita_despesa
ALTER TABLE public.receita_despesa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receita_select_org" ON public.receita_despesa
  FOR SELECT TO authenticated
  USING (org_id = public.get_my_org_id());

CREATE POLICY "receita_admin_insert_org" ON public.receita_despesa
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    AND org_id = public.get_my_org_id()
    AND (lead_id IS NULL OR public.lead_in_my_org(lead_id))
  );

CREATE POLICY "receita_admin_update_org" ON public.receita_despesa
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id())
  WITH CHECK (
    public.is_admin()
    AND org_id = public.get_my_org_id()
    AND (lead_id IS NULL OR public.lead_in_my_org(lead_id))
  );

CREATE POLICY "receita_admin_delete_org" ON public.receita_despesa
  FOR DELETE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id());

-- payment_alerts
ALTER TABLE public.payment_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_org" ON public.payment_alerts
  FOR SELECT TO authenticated
  USING (org_id = public.get_my_org_id());

CREATE POLICY "alerts_admin_insert_org" ON public.payment_alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    AND org_id = public.get_my_org_id()
    AND public.lead_in_my_org(lead_id)
  );

CREATE POLICY "alerts_admin_update_org" ON public.payment_alerts
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id())
  WITH CHECK (
    public.is_admin()
    AND org_id = public.get_my_org_id()
    AND public.lead_in_my_org(lead_id)
  );

CREATE POLICY "alerts_admin_delete_org" ON public.payment_alerts
  FOR DELETE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id());

-- documentos_negocio
ALTER TABLE public.documentos_negocio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_select_org" ON public.documentos_negocio
  FOR SELECT TO authenticated
  USING (org_id = public.get_my_org_id());

CREATE POLICY "docs_admin_insert_org" ON public.documentos_negocio
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    AND org_id = public.get_my_org_id()
    AND public.lead_in_my_org(lead_id)
  );

CREATE POLICY "docs_admin_update_org" ON public.documentos_negocio
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id())
  WITH CHECK (
    public.is_admin()
    AND org_id = public.get_my_org_id()
    AND public.lead_in_my_org(lead_id)
  );

CREATE POLICY "docs_admin_delete_org" ON public.documentos_negocio
  FOR DELETE TO authenticated
  USING (public.is_admin() AND org_id = public.get_my_org_id());

-- Harden SECURITY DEFINER functions with explicit authorization.
CREATE OR REPLACE FUNCTION public.create_organization(
  p_name TEXT,
  p_slug TEXT
) RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID := auth.uid();
  v_existing_org_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Login necessario para criar organizacao.';
  END IF;

  SELECT org_id INTO v_existing_org_id
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_existing_org_id IS NOT NULL THEN
    RAISE EXCEPTION 'Usuario ja possui organizacao.';
  END IF;

  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (trim(p_name), lower(trim(p_slug)), v_user_id)
  RETURNING id INTO v_org_id;

  UPDATE public.profiles
  SET org_id = v_org_id,
      role = 'Administrador'
  WHERE id = v_user_id;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_organization(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.create_profile_for_user(UUID, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  p_user_id UUID,
  p_email TEXT,
  p_nome TEXT,
  p_role TEXT,
  p_org_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_org_id UUID := public.get_my_org_id();
  v_existing_org_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem criar perfis.';
  END IF;

  IF p_org_id IS NULL OR p_org_id <> v_org_id THEN
    RAISE EXCEPTION 'Organizacao invalida para o perfil.';
  END IF;

  IF p_role NOT IN ('Administrador', 'Funcionario') THEN
    RAISE EXCEPTION 'Perfil invalido.';
  END IF;

  SELECT org_id INTO v_existing_org_id
  FROM public.profiles
  WHERE id = p_user_id;

  IF FOUND AND v_existing_org_id IS DISTINCT FROM v_org_id THEN
    RAISE EXCEPTION 'Perfil ja existe fora desta organizacao.';
  END IF;

  INSERT INTO public.profiles (id, email, nome, role, status, org_id)
  VALUES (p_user_id, p_email, p_nome, p_role::public.user_role, 'ACTIVE', p_org_id)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    status = 'ACTIVE',
    org_id = EXCLUDED.org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_profile_for_user(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- Public lead capture resolves the organization by slug inside a controlled RPC.
CREATE OR REPLACE FUNCTION public.create_public_lead(
  p_org_slug TEXT,
  p_nome_cliente TEXT,
  p_email TEXT,
  p_telefone TEXT,
  p_data_evento DATE,
  p_horario_inicio TIME DEFAULT NULL,
  p_horario_fim TIME DEFAULT NULL,
  p_tipo_evento TEXT DEFAULT NULL,
  p_qtd_convidados INTEGER DEFAULT 0,
  p_servicos_solicitados TEXT DEFAULT NULL,
  p_local_evento TEXT DEFAULT NULL,
  p_tipo_espaco TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_lead_id UUID;
BEGIN
  IF trim(coalesce(p_org_slug, '')) = '' THEN
    RAISE EXCEPTION 'Organizacao nao informada.';
  END IF;

  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE slug = lower(trim(p_org_slug));

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organizacao nao encontrada.';
  END IF;

  IF trim(coalesce(p_nome_cliente, '')) = ''
    OR trim(coalesce(p_email, '')) = ''
    OR p_data_evento IS NULL
    OR coalesce(p_qtd_convidados, 0) <= 0 THEN
    RAISE EXCEPTION 'Dados obrigatorios invalidos.';
  END IF;

  INSERT INTO public.leads (
    nome_cliente,
    email,
    telefone,
    data_evento,
    horario_inicio,
    horario_fim,
    tipo_evento,
    qtd_convidados,
    servicos_solicitados,
    local_evento,
    tipo_espaco,
    status,
    org_id
  ) VALUES (
    trim(p_nome_cliente),
    trim(p_email),
    coalesce(p_telefone, ''),
    p_data_evento,
    coalesce(p_horario_inicio, '00:00'::time),
    coalesce(p_horario_fim, '00:00'::time),
    p_tipo_evento,
    p_qtd_convidados,
    p_servicos_solicitados,
    p_local_evento,
    p_tipo_espaco,
    'Lead',
    v_org_id
  )
  RETURNING id INTO v_lead_id;

  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_public_lead(
  TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, INTEGER, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_lead(
  TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, INTEGER, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- Employees may only respond to their own invitation through this guarded transition.
CREATE OR REPLACE FUNCTION public.respond_to_assignment_invitation(
  p_lead_id UUID,
  p_status TEXT,
  p_withdrawal_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_current_status TEXT;
  v_org_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Login necessario.';
  END IF;

  SELECT i.status, coalesce(i.org_id, l.org_id)
  INTO v_current_status, v_org_id
  FROM public.interesses_funcionarios i
  JOIN public.leads l ON l.id = i.lead_id
  WHERE i.lead_id = p_lead_id
    AND i.user_id = auth.uid();

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Convite nao encontrado.';
  END IF;

  IF v_org_id IS DISTINCT FROM public.get_my_org_id() THEN
    RAISE EXCEPTION 'Convite fora da organizacao.';
  END IF;

  IF p_status IN ('aprovado', 'rejeitado') THEN
    IF v_current_status <> 'convidado' THEN
      RAISE EXCEPTION 'Apenas convites pendentes podem ser respondidos.';
    END IF;
  ELSIF p_status = 'desistente' THEN
    IF v_current_status <> 'aprovado' THEN
      RAISE EXCEPTION 'Apenas escalas aprovadas podem ser marcadas como desistentes.';
    END IF;
    IF trim(coalesce(p_withdrawal_reason, '')) = '' THEN
      RAISE EXCEPTION 'Motivo da desistencia e obrigatorio.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Status de resposta invalido.';
  END IF;

  UPDATE public.interesses_funcionarios
  SET status = p_status::public.interesse_status,
      withdrawal_reason = CASE WHEN p_status = 'desistente' THEN p_withdrawal_reason ELSE NULL END,
      org_id = v_org_id
  WHERE lead_id = p_lead_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.respond_to_assignment_invitation(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_assignment_invitation(UUID, TEXT, TEXT) TO authenticated;

-- Make alert generation idempotent and server-side.
WITH ranked AS (
  SELECT
    ctid,
    row_number() OVER (
      PARTITION BY lead_id, task_id, type
      ORDER BY created_at DESC NULLS LAST, ctid DESC
    ) AS rn
  FROM public.payment_alerts
  WHERE lead_id IS NOT NULL
    AND task_id IS NOT NULL
    AND type IS NOT NULL
)
DELETE FROM public.payment_alerts p
USING ranked r
WHERE p.ctid = r.ctid
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS payment_alerts_unique_lead_task_type
  ON public.payment_alerts (lead_id, task_id, type)
  WHERE lead_id IS NOT NULL
    AND task_id IS NOT NULL
    AND type IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_payment_alerts(
  p_today DATE DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date)
) RETURNS INTEGER AS $$
DECLARE
  v_inserted INTEGER := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem gerar alertas.';
  END IF;

  WITH task_rows AS (
    SELECT
      l.id AS lead_id,
      l.org_id,
      task.value AS task,
      CASE
        WHEN task.value ->> 'dueDate' ~ '^\d{4}-\d{2}-\d{2}$'
          THEN (task.value ->> 'dueDate')::date
        ELSE NULL
      END AS due_date
    FROM public.leads l
    CROSS JOIN LATERAL jsonb_array_elements(coalesce(l.payment_tasks::jsonb, '[]'::jsonb)) AS task(value)
    WHERE l.org_id = public.get_my_org_id()
      AND l.payment_tasks IS NOT NULL
      AND coalesce(lower(task.value ->> 'isCompleted') = 'true', false) = false
  ),
  alert_rows AS (
    SELECT
      lead_id,
      org_id,
      task ->> 'id' AS task_id,
      CASE
        WHEN task ->> 'amount' ~ '^-?\d+(\.\d+)?$'
          THEN (task ->> 'amount')::numeric
        ELSE 0
      END AS amount,
      due_date,
      CASE
        WHEN due_date = p_today + 7 THEN 'UPCOMING_7'
        WHEN due_date = p_today + 3 THEN 'UPCOMING_3'
        WHEN due_date = p_today THEN 'DUE_TODAY'
        WHEN due_date < p_today THEN 'OVERDUE'
        ELSE NULL
      END AS alert_type
    FROM task_rows
  )
  INSERT INTO public.payment_alerts (
    lead_id,
    task_id,
    type,
    amount,
    due_date,
    org_id
  )
  SELECT
    lead_id,
    task_id,
    alert_type,
    amount,
    due_date,
    org_id
  FROM alert_rows
  WHERE alert_type IS NOT NULL
    AND coalesce(task_id, '') <> ''
    AND due_date IS NOT NULL
  ON CONFLICT (lead_id, task_id, type)
    WHERE lead_id IS NOT NULL
      AND task_id IS NOT NULL
      AND type IS NOT NULL
    DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.generate_payment_alerts(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_payment_alerts(DATE) TO authenticated;
