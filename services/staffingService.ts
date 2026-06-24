import { Deal, User, UserRole } from '../types';
import { assignmentStatusToInterestStatus } from './supabaseMappers';
import { supabase } from './supabaseClient';

type AssignmentUpdate = Partial<{
  role: string;
  status: Deal['assignments'][number]['status'];
}>;

export class StaffingService {
  async applyForDeal(dealId: string, userId: string, role: string): Promise<void> {
    const { data: existing, error: existingError } = await supabase
      .from('interesses_funcionarios')
      .select('id, status')
      .eq('lead_id', dealId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      if (existing.status === 'rejeitado') {
        throw new Error('Solicitacao rejeitada anteriormente.');
      }
      throw new Error('Voce ja manifestou interesse.');
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', userId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('interesses_funcionarios')
      .insert({
        lead_id: dealId,
        user_id: userId,
        status: 'pendente',
        role,
        org_id: userProfile?.org_id || null
      })
      .select('id')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Nao foi possivel registrar o interesse.');
  }

  async approveStaffAssignment(dealId: string, targetUserId: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem aprovar equipe.');
    }

    const { error } = await supabase
      .from('interesses_funcionarios')
      .update({ status: 'aprovado' })
      .eq('lead_id', dealId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  }

  async rejectStaffAssignment(dealId: string, targetUserId: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem rejeitar equipe.');
    }

    const { error } = await supabase
      .from('interesses_funcionarios')
      .update({ status: 'rejeitado' })
      .eq('lead_id', dealId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  }

  async assignStaff(dealId: string, targetUserId: string, role: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem atribuir equipe.');
    }

    const { error } = await supabase
      .from('interesses_funcionarios')
      .upsert({
        lead_id: dealId,
        user_id: targetUserId,
        status: 'convidado',
        role,
        org_id: requestingUser.orgId || null
      }, { onConflict: 'lead_id,user_id' });

    if (error) throw error;
  }

  async updateDealAssignment(
    dealId: string,
    targetUserId: string,
    data: AssignmentUpdate,
    requestingUser: User
  ): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem atualizar equipe.');
    }

    const payload: any = {};
    if (data.role !== undefined) payload.role = data.role;
    if (data.status !== undefined) payload.status = assignmentStatusToInterestStatus[data.status];

    const { error } = await supabase
      .from('interesses_funcionarios')
      .update(payload)
      .eq('lead_id', dealId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  }

  async withdrawApplication(dealId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('interesses_funcionarios')
      .delete()
      .eq('lead_id', dealId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async withdrawApprovedAssignment(dealId: string, _userId: string, reason: string): Promise<void> {
    const { error } = await supabase.rpc('respond_to_assignment_invitation', {
      p_lead_id: dealId,
      p_status: 'desistente',
      p_withdrawal_reason: reason
    });

    if (error) throw error;
  }

  async acceptAssignment(dealId: string, _userId: string): Promise<void> {
    const { error } = await supabase.rpc('respond_to_assignment_invitation', {
      p_lead_id: dealId,
      p_status: 'aprovado',
      p_withdrawal_reason: null
    });

    if (error) throw error;
  }

  async rejectAssignment(dealId: string, _userId: string): Promise<void> {
    const { error } = await supabase.rpc('respond_to_assignment_invitation', {
      p_lead_id: dealId,
      p_status: 'rejeitado',
      p_withdrawal_reason: null
    });

    if (error) throw error;
  }
}

export const staffingService = new StaffingService();
