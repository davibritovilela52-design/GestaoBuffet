import { supabase } from './supabaseClient';
import { Deal, DealDocument, DealStatus, EventType, FinancialEntry, KPI, PaymentAlert, AlertType, PaymentTask, TransactionType, User, UserRole, UserStatus } from '../types';
import { getPaymentAlertType } from '../utils/paymentAlerts';

const leadStatusToDealStatus: Record<string, DealStatus> = {
  'Lead': DealStatus.LEAD,
  'Em negociacao': DealStatus.NEGOTIATION,
  'Fechado': DealStatus.CLOSED,
  'Realizado': DealStatus.REALIZED,
  'Realizados': DealStatus.REALIZED,
  'Perdido': DealStatus.LOST
};

const dealStatusToLeadStatus: Record<DealStatus, string> = {
  [DealStatus.LEAD]: 'Lead',
  [DealStatus.NEGOTIATION]: 'Em negociacao',
  [DealStatus.CLOSED]: 'Fechado',
  [DealStatus.REALIZED]: 'Realizado',
  [DealStatus.LOST]: 'Perdido'
};

const interestStatusToAssignmentStatus: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVITED' | 'WITHDRAWN'> = {
  'pendente': 'PENDING',
  'aprovado': 'APPROVED',
  'rejeitado': 'REJECTED',
  'convidado': 'INVITED',
  'desistente': 'WITHDRAWN'
};

const assignmentStatusToInterestStatus: Record<'PENDING' | 'APPROVED' | 'REJECTED' | 'INVITED' | 'WITHDRAWN', string> = {
  'PENDING': 'pendente',
  'APPROVED': 'aprovado',
  'REJECTED': 'rejeitado',
  'INVITED': 'convidado',
  'WITHDRAWN': 'desistente'
};

const financeTypeToTransactionType: Record<string, TransactionType> = {
  'receita': TransactionType.INCOME,
  'despesa': TransactionType.EXPENSE
};

const transactionTypeToFinanceType: Record<TransactionType, string> = {
  [TransactionType.INCOME]: 'receita',
  [TransactionType.EXPENSE]: 'despesa'
};

const DOCUMENTS_BUCKET = 'deal-documents';

const normalizeEventType = (type: string | undefined | null): EventType | string => {
  if (!type) return EventType.OTHER;
  
  const values = Object.values(EventType) as string[];
  if (values.includes(type)) return type;
  
  const upperType = type.toUpperCase();
  if (upperType.includes('WEDDING')) return EventType.WEDDING;
  if (upperType.includes('CORPORATE')) return EventType.CORPORATE;
  if (upperType.includes('PRIVATE')) return EventType.PRIVATE_PARTY;
  if (upperType.includes('GALA')) return EventType.GALA;
  
  return EventType.OTHER;
};

const mapLeadToDeal = (lead: any, interests: any[], financials: any[]): Deal => {
  const dealFinancials = financials.filter(entry => entry.lead_id === lead.id);
  const totalIncome = dealFinancials
    .filter(entry => entry.tipo === 'receita')
    .reduce((sum, entry) => sum + Number(entry.valor || 0), 0);
  const totalExpense = dealFinancials
    .filter(entry => entry.tipo === 'despesa')
    .reduce((sum, entry) => sum + Number(entry.valor || 0), 0);

  const normalizedEventType = normalizeEventType(lead.tipo_evento);

  return {
    id: lead.id,
    clientName: lead.nome_cliente,
    clientEmail: lead.email,
    clientPhone: lead.telefone,
    eventName: lead.tipo_evento ? `${normalizedEventType} - ${lead.nome_cliente}` : `Evento de ${lead.nome_cliente}`,
    eventDate: lead.data_evento,
    startTime: lead.horario_inicio,
    endTime: lead.horario_fim,
    eventType: normalizedEventType as EventType,
    guestCount: toPositiveInt(lead.qtd_convidados),
    status: leadStatusToDealStatus[lead.status] || DealStatus.LEAD,
    value: totalIncome - totalExpense,
    location: lead.local_evento || lead.localizacao || '',
    spaceType: lead.tipo_espaco || '',
    requirements: [],
    assignments: interests
      .filter(item => item.lead_id === lead.id)
      .map(item => ({
        userId: item.user_id,
        role: item.role || 'Equipe',
        status: interestStatusToAssignmentStatus[item.status] || 'PENDING',
        appliedAt: item.created_at ? String(item.created_at).split('T')[0] : '',
        withdrawalReason: item.withdrawal_reason || undefined
      })),
    paymentTasks: lead.payment_tasks || [],
    notes: lead.servicos_solicitados,
    createdAt: lead.created_at
  };
};

const toPositiveInt = (value: any) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed < 0 ? 0 : parsed;
};

const mapFinancialEntry = (entry: any): FinancialEntry => ({
  id: entry.id,
  dealId: entry.lead_id,
  date: entry.data,
  type: financeTypeToTransactionType[entry.tipo] || TransactionType.EXPENSE,
  category: entry.categoria || 'Geral',
  description: entry.descricao || '',
  amount: Number(entry.valor || 0)
});

const sanitizeFileName = (name: string) => name.replace(/[^\w.-]+/g, '_');

const mapDealDocument = (row: any): DealDocument => {
  const publicUrl = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(row.arquivo_path).data.publicUrl;
  return {
    id: row.id,
    dealId: row.lead_id,
    name: row.nome_documento,
    documentDate: row.data_documento,
    filePath: row.arquivo_path,
    fileName: row.arquivo_nome || '',
    fileType: row.arquivo_tipo || '',
    fileSize: Number(row.arquivo_tamanho || 0),
    fileUrl: publicUrl,
    createdAt: row.created_at,
    uploadedBy: row.uploaded_by || undefined
  };
};

export class DataService {
  // Users
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

    if (!data.user) {
      throw new Error('Nao foi possivel criar o usuario.');
    }

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

  // Deals
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
      .select('id, lead_id, user_id, status, created_at, role')
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
      .select('id, lead_id, user_id, status, created_at, role')
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

    // Get org_id from current user's profile for tenant isolation
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
      .maybeSingle();

    const payload = {
      nome_cliente: lead.clientName,
      email: lead.clientEmail,
      telefone: lead.clientPhone || '',
      data_evento: lead.eventDate,
      horario_inicio: lead.startTime || '00:00',
      horario_fim: lead.endTime || '00:00',
      tipo_evento: lead.eventType || null,
      qtd_convidados: guestCount,
      servicos_solicitados: lead.notes || lead.eventName || null,
      local_evento: lead.location || null,
      tipo_espaco: lead.spaceType || null,
      status: dealStatusToLeadStatus[lead.status || DealStatus.LEAD],
      org_id: profile?.org_id || null
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    return mapLeadToDeal(data, [], []);
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

    // Get org_id from user's profile
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
    data: Partial<{ role: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVITED' | 'WITHDRAWN' }>,
    requestingUser: User
  ): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem atualizar equipe.');
    }

    const payload: any = {};
    if (data.role !== undefined) payload.role = data.role;
    if (data.status !== undefined) payload.status = assignmentStatusToInterestStatus[data.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVITED' | 'WITHDRAWN'];

    const { error } = await supabase
      .from('interesses_funcionarios')
      .update(payload)
      .eq('lead_id', dealId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  }

  async withdrawApplication(deal_id: string, user_id: string): Promise<void> {
    const { error } = await supabase
      .from('interesses_funcionarios')
      .delete()
      .eq('lead_id', deal_id)
      .eq('user_id', user_id);

    if (error) throw error;
  }

  async withdrawApprovedAssignment(dealId: string, userId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('interesses_funcionarios')
      .update({
        status: 'desistente',
        withdrawal_reason: reason
      })
      .eq('lead_id', dealId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async acceptAssignment(dealId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('interesses_funcionarios')
      .update({ status: 'aprovado' })
      .eq('lead_id', dealId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async rejectAssignment(dealId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('interesses_funcionarios')
      .update({ status: 'rejeitado' })
      .eq('lead_id', dealId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Documents
  async getDealDocuments(dealId: string): Promise<DealDocument[]> {
    const { data, error } = await supabase
      .from('documentos_negocio')
      .select('*')
      .eq('lead_id', dealId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDealDocument);
  }

  async uploadDealDocument(
    dealId: string,
    payload: { name: string; documentDate: string; file: File },
    requestingUser: User
  ): Promise<DealDocument> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem enviar documentos.');
    }

    const safeFileName = sanitizeFileName(payload.file.name);
    const filePath = `${dealId}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, payload.file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('documentos_negocio')
      .insert({
        lead_id: dealId,
        nome_documento: payload.name,
        data_documento: payload.documentDate,
        arquivo_path: filePath,
        arquivo_nome: payload.file.name,
        arquivo_tipo: payload.file.type,
        arquivo_tamanho: payload.file.size,
        uploaded_by: requestingUser.id,
        org_id: requestingUser.orgId || null
      })
      .select('*')
      .single();

    if (error) throw error;

    return mapDealDocument(data);
  }

  async updateDealDocument(
    documentId: string,
    payload: { name: string; documentDate: string },
    requestingUser: User
  ): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem editar documentos.');
    }

    const { error } = await supabase
      .from('documentos_negocio')
      .update({
        nome_documento: payload.name,
        data_documento: payload.documentDate
      })
      .eq('id', documentId);

    if (error) throw error;
  }

  async deleteDealDocument(documentId: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem excluir documentos.');
    }

    const { data, error } = await supabase
      .from('documentos_negocio')
      .select('arquivo_path')
      .eq('id', documentId)
      .single();

    if (error) throw error;

    if (data?.arquivo_path) {
      const { error: storageError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .remove([data.arquivo_path]);

      if (storageError) throw storageError;
    }

    const { error: deleteError } = await supabase
      .from('documentos_negocio')
      .delete()
      .eq('id', documentId);

    if (deleteError) throw deleteError;
  }

  // Financials
  async getFinancials(): Promise<FinancialEntry[]> {
    const { data, error } = await supabase
      .from('receita_despesa')
      .select('*')
      .order('data', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapFinancialEntry);
  }

  async getFinancialsByDealId(dealId: string): Promise<FinancialEntry[]> {
    const { data, error } = await supabase
      .from('receita_despesa')
      .select('*')
      .eq('lead_id', dealId)
      .order('data', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapFinancialEntry);
  }

  async addFinancialEntry(entry: Omit<FinancialEntry, 'id'>, requestingUser: User): Promise<FinancialEntry> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem gerenciar financeiro.');
    }

    const payload = {
      lead_id: entry.dealId,
      tipo: transactionTypeToFinanceType[entry.type],
      valor: entry.amount,
      descricao: entry.description,
      categoria: entry.category,
      data: entry.date,
      org_id: requestingUser.orgId || null
    };

    const { data, error } = await supabase
      .from('receita_despesa')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    return mapFinancialEntry(data);
  }

  async updateFinancialEntry(id: string, data: Partial<FinancialEntry>, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem atualizar financeiro.');
    }

    const payload: any = {};
    if (data.type !== undefined) payload.tipo = transactionTypeToFinanceType[data.type];
    if (data.amount !== undefined) payload.valor = data.amount;
    if (data.description !== undefined) payload.descricao = data.description;
    if (data.category !== undefined) payload.categoria = data.category;
    if (data.date !== undefined) payload.data = data.date;

    const { error } = await supabase
      .from('receita_despesa')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  }

  async getKPIs(): Promise<KPI> {
    const [{ data: leads, error: leadsError }, { data: financials, error: finError }] = await Promise.all([
      supabase.from('leads').select('status'),
      supabase.from('receita_despesa').select('tipo, valor')
    ]);

    if (leadsError) throw leadsError;
    if (finError) throw finError;

    const leadList = leads || [];
    const financialList = financials || [];

    const totalLeads = leadList.length;
    const negotiationCount = leadList.filter((d: any) => d.status === 'Em negociacao').length;
    const closedCount = leadList.filter((d: any) => d.status === 'Fechado').length;
    const lostCount = leadList.filter((d: any) => d.status === 'Perdido').length;

    const income = financialList
      .filter((f: any) => f.tipo === 'receita')
      .reduce((sum: number, f: any) => sum + Number(f.valor || 0), 0);
    const expenses = financialList
      .filter((f: any) => f.tipo === 'despesa')
      .reduce((sum: number, f: any) => sum + Number(f.valor || 0), 0);

    return {
      totalLeads,
      negotiationCount,
      closedCount,
      lostCount,
      monthlyRevenue: income,
      monthlyExpenses: expenses,
      netProfit: income - expenses
    };
  }

  // Alerts
  async getAlerts(requestingUser: User): Promise<any[]> {
    if (requestingUser.role === UserRole.ADMIN) {
      const { data, error } = await supabase
        .from('payment_alerts')
        .select('*, leads(nome_cliente, tipo_evento)')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        leadId: row.lead_id,
        taskId: row.task_id,
        clientName: row.leads?.nome_cliente || 'Desconhecido',
        eventName: row.leads?.tipo_evento ? normalizeEventType(row.leads.tipo_evento) as string : 'Evento',
        amount: Number(row.amount || 0),
        dueDate: row.due_date,
        type: row.type as AlertType,
        resolved: row.resolved,
        createdAt: row.created_at
      }));
    } else {
      // Employee: Fetch staff invitations
      const { data, error } = await supabase
        .from('interesses_funcionarios')
        .select('*, leads(*)')
        .eq('user_id', requestingUser.id)
        .eq('status', 'convidado');

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        leadId: row.lead_id,
        clientName: row.leads?.nome_cliente || 'Buffet',
        eventName: row.leads?.tipo_evento ? normalizeEventType(row.leads.tipo_evento) as string : 'Evento',
        amount: 0,
        dueDate: row.leads?.data_evento || '',
        type: AlertType.STAFF_INVITATION,
        resolved: false,
        createdAt: row.created_at,
        role: row.role
      }));
    }
  }

  async resolveAlert(alertId: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new Error('Apenas administradores podem resolver alertas.');
    }

    const { error } = await supabase
      .from('payment_alerts')
      .update({ resolved: true })
      .eq('id', alertId);

    if (error) throw error;
  }

  async checkAndGenerateAlerts(): Promise<void> {
    // 1. Fetch all leads with payment tasks
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, nome_cliente, tipo_evento, payment_tasks, org_id')
      .not('payment_tasks', 'is', null);

    if (leadsError) throw leadsError;
    if (!leads) return;

    // 2. Fetch existing alerts to avoid re-creating resolved ones
    const { data: existingAlerts, error: existingError } = await supabase
      .from('payment_alerts')
      .select('lead_id, task_id, type, resolved');

    if (existingError) throw existingError;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertsToInsert: any[] = [];

    for (const lead of leads) {
      const tasks = (lead.payment_tasks as PaymentTask[]) || [];
      for (const task of tasks) {
        if (task.isCompleted) continue;

        const alertType = getPaymentAlertType(task.dueDate, today);

        if (alertType) {
          // Check if this specific alert already exists
          const alreadyExists = existingAlerts?.some(a =>
            a.lead_id === lead.id &&
            a.task_id === task.id &&
            a.type === alertType
          );

          if (!alreadyExists) {
            alertsToInsert.push({
              lead_id: lead.id,
              task_id: task.id,
              type: alertType,
              amount: task.amount || 0,
              due_date: task.dueDate,
              org_id: lead.org_id || null
            });
          }
        }
      }
    }

    if (alertsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('payment_alerts')
        .insert(alertsToInsert);

      if (insertError) console.error("Error inserting alerts:", insertError);
    }
  }
}

export const dataService = new DataService();
