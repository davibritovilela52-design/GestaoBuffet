-- =============================================
-- Migration 006: Restrict internal SECURITY DEFINER function grants
-- =============================================

REVOKE ALL ON FUNCTION public.get_my_org_id() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.lead_in_my_org(UUID) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.create_organization(TEXT, TEXT) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.create_profile_for_user(UUID, TEXT, TEXT, TEXT, UUID) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_assignment_invitation(UUID, TEXT, TEXT) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.generate_payment_alerts(DATE) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.lead_in_my_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_for_user(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_assignment_invitation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_payment_alerts(DATE) TO authenticated;

REVOKE ALL ON FUNCTION public.create_public_lead(
  TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, INTEGER, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_lead(
  TEXT, TEXT, TEXT, TEXT, DATE, TIME, TIME, TEXT, INTEGER, TEXT, TEXT, TEXT
) TO anon, authenticated;
