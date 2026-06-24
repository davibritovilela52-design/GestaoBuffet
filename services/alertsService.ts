import { AlertType, PaymentAlert, User, UserRole } from '../types';
import { normalizeEventType } from './supabaseMappers';
import { supabase } from './supabaseClient';

export type AlertNotification = PaymentAlert & {
  role?: string;
};

export class AlertsService {
  async getAlerts(requestingUser: User): Promise<AlertNotification[]> {
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
    }

    const { data, error } = await supabase
      .from('interesses_funcionarios')
      .select('*, leads(*)')
      .eq('user_id', requestingUser.id)
      .eq('status', 'convidado');

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      leadId: row.lead_id,
      taskId: row.id,
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
    const { error } = await supabase.rpc('generate_payment_alerts');
    if (error) throw error;
  }
}

export const alertsService = new AlertsService();
