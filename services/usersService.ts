import { User, UserRole, UserStatus } from '../types';
import { supabase } from './supabaseClient';

export class UsersService {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, role, status, email, org_id');

    if (error) throw error;

    return (data || []).map((profile: any) => ({
      id: profile.id,
      name: profile.nome,
      email: profile.email || '',
      role: profile.role === 'Administrador' ? UserRole.ADMIN : UserRole.EMPLOYEE,
      status: profile.status === 'INACTIVE' ? UserStatus.INACTIVE : UserStatus.ACTIVE,
      orgId: profile.org_id || undefined,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nome || 'Usuario')}&background=random&color=fff`
    }));
  }

  async addUser(newUser: Partial<User>, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem criar usuarios.');
    }

    if (!newUser.email || !newUser.password || !newUser.name) {
      throw new Error('Nome, email e senha sao obrigatorios.');
    }

    const { data: currentSession } = await supabase.auth.getSession();
    const role = newUser.role === UserRole.ADMIN ? 'Administrador' : 'Funcionario';

    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: {
          nome: newUser.name,
          role
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Nao foi possivel criar o usuario.');

    if (currentSession?.session) {
      await supabase.auth.setSession({
        access_token: currentSession.session.access_token,
        refresh_token: currentSession.session.refresh_token
      });
    }

    const { error: profileError } = await supabase.rpc('create_profile_for_user', {
      p_user_id: data.user.id,
      p_email: newUser.email,
      p_nome: newUser.name,
      p_role: role,
      p_org_id: requestingUser.orgId || null
    });

    if (profileError) throw profileError;

    if (currentSession?.session && data.session) {
      await supabase.auth.setSession({
        access_token: currentSession.session.access_token,
        refresh_token: currentSession.session.refresh_token
      });
    }
  }

  async toggleUserStatus(id: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem alterar status.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', id)
      .single();

    if (error) throw error;

    const currentStatus = data?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('id', id);

    if (updateError) throw updateError;
  }
}

export const usersService = new UsersService();
