import { FinancialEntry, KPI, User, UserRole } from '../types';
import {
  mapFinancialEntry,
  transactionTypeToFinanceType,
} from './supabaseMappers';
import { supabase } from './supabaseClient';

export class FinancialsService {
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
    const closedCount = leadList.filter((d: any) => ['Fechado', 'Realizado'].includes(d.status)).length;
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
}

export const financialsService = new FinancialsService();
