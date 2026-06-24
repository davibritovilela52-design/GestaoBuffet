import {
  Deal,
  DealStatus,
  EventType,
  FinancialEntry,
  TransactionType,
} from '../types';

export const leadStatusToDealStatus: Record<string, DealStatus> = {
  Lead: DealStatus.LEAD,
  'Em negociacao': DealStatus.NEGOTIATION,
  Fechado: DealStatus.CLOSED,
  Realizado: DealStatus.REALIZED,
  Realizados: DealStatus.REALIZED,
  Perdido: DealStatus.LOST,
};

export const dealStatusToLeadStatus: Record<DealStatus, string> = {
  [DealStatus.LEAD]: 'Lead',
  [DealStatus.NEGOTIATION]: 'Em negociacao',
  [DealStatus.CLOSED]: 'Fechado',
  [DealStatus.REALIZED]: 'Realizado',
  [DealStatus.LOST]: 'Perdido',
};

export const interestStatusToAssignmentStatus: Record<string, Deal['assignments'][number]['status']> = {
  pendente: 'PENDING',
  aprovado: 'APPROVED',
  rejeitado: 'REJECTED',
  convidado: 'INVITED',
  desistente: 'WITHDRAWN',
};

export const assignmentStatusToInterestStatus: Record<Deal['assignments'][number]['status'], string> = {
  PENDING: 'pendente',
  APPROVED: 'aprovado',
  REJECTED: 'rejeitado',
  INVITED: 'convidado',
  WITHDRAWN: 'desistente',
};

export const financeTypeToTransactionType: Record<string, TransactionType> = {
  receita: TransactionType.INCOME,
  despesa: TransactionType.EXPENSE,
};

export const transactionTypeToFinanceType: Record<TransactionType, string> = {
  [TransactionType.INCOME]: 'receita',
  [TransactionType.EXPENSE]: 'despesa',
};

export const normalizeEventType = (type: string | undefined | null): EventType | string => {
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

export const toPositiveInt = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed < 0 ? 0 : parsed;
};

export const mapLeadToDeal = (lead: any, interests: any[], financials: any[]): Deal => {
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

export const mapFinancialEntry = (entry: any): FinancialEntry => ({
  id: entry.id,
  dealId: entry.lead_id,
  date: entry.data,
  type: financeTypeToTransactionType[entry.tipo] || TransactionType.EXPENSE,
  category: entry.categoria || 'Geral',
  description: entry.descricao || '',
  amount: Number(entry.valor || 0)
});

export const buildLeadPayload = (lead: Partial<Deal>, orgId: string | null) => ({
  nome_cliente: lead.clientName,
  email: lead.clientEmail,
  telefone: lead.clientPhone || '',
  data_evento: lead.eventDate,
  horario_inicio: lead.startTime || '00:00',
  horario_fim: lead.endTime || '00:00',
  tipo_evento: lead.eventType || null,
  qtd_convidados: Number(lead.guestCount || 0),
  servicos_solicitados: lead.notes || lead.eventName || null,
  local_evento: lead.location || null,
  tipo_espaco: lead.spaceType || null,
  status: dealStatusToLeadStatus[lead.status || DealStatus.LEAD],
  org_id: orgId
});
