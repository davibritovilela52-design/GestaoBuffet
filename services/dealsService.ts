import { Deal, DealStatus, User, UserRole } from '../types';
import {
  buildLeadPayload,
  dealStatusToLeadStatus,
  mapLeadToDeal,
} from './supabaseMappers';
import { supabase } from './supabaseClient';

export class DealsService {
  async getDeals(): Promise<Deal[]> {
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsError) throw leadsError;
    if (!leads || leads.length === 0) return [];

    const leadIds = leads.map((lead: any) => lead.id);

    const { data: interests, error: interestError } = await supabase
      .from('interesses_funcionarios')
      .select('id, lead_id, user_id, status, created_at, role, withdrawal_reason')
      .in('lead_id', leadIds);

    if (interestError) throw interestError;

    const { data: financials, error: financialsError } = await supabase
      .from('receita_despesa')
      .select('*')
      .in('lead_id', leadIds);

    if (financialsError) throw financialsError;

    return leads.map((lead: any) => mapLeadToDeal(lead, interests || [], financials || []));
  }

  async getDealById(id: string): Promise<Deal | undefined> {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!lead) return undefined;

    const { data: interests, error: interestError } = await supabase
      .from('interesses_funcionarios')
      .select('id, lead_id, user_id, status, created_at, role, withdrawal_reason')
      .eq('lead_id', id);

    if (interestError) throw interestError;

    const { data: financials, error: financialsError } = await supabase
      .from('receita_despesa')
      .select('*')
      .eq('lead_id', id);

    if (financialsError) throw financialsError;

    return mapLeadToDeal(lead, interests || [], financials || []);
  }

  async createLead(lead: Partial<Deal>): Promise<Deal> {
    if (!lead.clientName || !lead.clientEmail || !lead.eventDate) {
      throw new Error('Nome, email e data do evento sao obrigatorios.');
    }

    const guestCount = Number(lead.guestCount || 0);
    if (!Number.isFinite(guestCount) || guestCount < 0) {
      throw new Error('Quantidade de convidados invalida.');
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error('Login necessario para criar lead interno.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!profile?.org_id) {
      throw new Error('Usuario sem organizacao vinculada.');
    }

    const payload = buildLeadPayload(lead, profile.org_id);

    const { data, error } = await supabase
      .from('leads')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    return mapLeadToDeal(data, [], []);
  }

  async createPublicLead(orgSlug: string, lead: Partial<Deal>): Promise<void> {
    if (!orgSlug?.trim()) {
      throw new Error('Link de solicitacao invalido.');
    }

    if (!lead.clientName || !lead.clientEmail || !lead.eventDate) {
      throw new Error('Nome, email e data do evento sao obrigatorios.');
    }

    const guestCount = Number(lead.guestCount || 0);
    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      throw new Error('Quantidade de convidados invalida.');
    }

    const { error } = await supabase.rpc('create_public_lead', {
      p_org_slug: orgSlug.trim().toLowerCase(),
      p_nome_cliente: lead.clientName,
      p_email: lead.clientEmail,
      p_telefone: lead.clientPhone || '',
      p_data_evento: lead.eventDate,
      p_horario_inicio: lead.startTime || '00:00',
      p_horario_fim: lead.endTime || '00:00',
      p_tipo_evento: lead.eventType || null,
      p_qtd_convidados: guestCount,
      p_servicos_solicitados: lead.notes || lead.eventName || null,
      p_local_evento: lead.location || null,
      p_tipo_espaco: lead.spaceType || null
    });

    if (error) throw error;
  }

  async updateDealStatus(id: string, status: DealStatus, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem atualizar status.');
    }

    const { error } = await supabase
      .from('leads')
      .update({ status: dealStatusToLeadStatus[status] })
      .eq('id', id);

    if (error) throw error;
  }

  async updateDeal(id: string, data: Partial<Deal>, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem atualizar o negocio.');
    }

    const payload: any = {};

    if (data.clientName !== undefined) payload.nome_cliente = data.clientName;
    if (data.clientEmail !== undefined) payload.email = data.clientEmail;
    if (data.clientPhone !== undefined) payload.telefone = data.clientPhone;
    if (data.eventDate !== undefined) payload.data_evento = data.eventDate;
    if (data.startTime !== undefined) payload.horario_inicio = data.startTime;
    if (data.endTime !== undefined) payload.horario_fim = data.endTime;
    if (data.eventType !== undefined) payload.tipo_evento = data.eventType;
    if (data.guestCount !== undefined) {
      const updatedCount = Number(data.guestCount);
      if (!Number.isFinite(updatedCount) || updatedCount < 0) {
        throw new Error('Quantidade de convidados invalida.');
      }
      payload.qtd_convidados = updatedCount;
    }
    if (data.notes !== undefined) payload.servicos_solicitados = data.notes;
    if (data.status !== undefined) payload.status = dealStatusToLeadStatus[data.status];
    if (data.paymentTasks !== undefined) payload.payment_tasks = data.paymentTasks;

    const { error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }
}

export const dealsService = new DealsService();
