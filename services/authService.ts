import { User, UserRole, UserStatus } from '../types';
import { supabase } from './supabaseClient';

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: { nome?: string; role?: string };
};

type ProfileRow = {
  id: string;
  nome: string;
  role: string;
  status?: string;
  email?: string;
  org_id?: string | null;
};

type OrganizationSummary = {
  name: string;
  slug: string;
};

const mapProfileToUser = (
  profile: ProfileRow,
  email?: string | null,
  org?: OrganizationSummary | null
): User => {
  const role = profile.role === 'Administrador' ? UserRole.ADMIN : UserRole.EMPLOYEE;

  return {
    id: profile.id,
    name: profile.nome,
    email: profile.email || email || '',
    role,
    status: profile.status === 'INACTIVE' ? UserStatus.INACTIVE : UserStatus.ACTIVE,
    orgId: profile.org_id || undefined,
    orgName: org?.name || undefined,
    orgSlug: org?.slug || undefined,
  };
};

export class AuthService {
  private async ensureProfile(authUser: AuthUser): Promise<ProfileRow> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, role, status, email, org_id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;

    const fallbackName = authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuario';
    const fallbackRole = authUser.user_metadata?.role === 'Administrador' ? 'Administrador' : 'Funcionario';
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        nome: fallbackName,
        role: fallbackRole,
        status: 'ACTIVE',
        email: authUser.email || ''
      })
      .select('id, nome, role, status, email, org_id')
      .single();

    if (insertError) throw insertError;
    return inserted;
  }

  private async loadOrganization(orgId: string | null | undefined): Promise<OrganizationSummary | null> {
    if (!orgId) return null;

    const { data, error } = await supabase
      .from('organizations')
      .select('name, slug')
      .eq('id', orgId)
      .maybeSingle();

    if (error) {
      console.error('Error loading organization:', error);
      return null;
    }

    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const authUser = data.session?.user;
    if (!authUser) return null;

    const profile = await this.ensureProfile({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata as { nome?: string; role?: string }
    });

    const org = await this.loadOrganization(profile.org_id);
    return mapProfileToUser(profile, authUser.email, org);
  }

  async login(email: string, password: string): Promise<User | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return this.getCurrentUser();
  }

  async register(name: string, email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: name,
          role: 'Administrador'
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Erro ao criar usuario');
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  onAuthStateChange(callback: () => void) {
    const { data } = supabase.auth.onAuthStateChange(() => callback());
    return data.subscription;
  }
}

export const authService = new AuthService();
