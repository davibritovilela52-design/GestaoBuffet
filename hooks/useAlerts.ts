import { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { PaymentAlert, User, UserRole } from '../types';

export type AppAlert = PaymentAlert & {
  role?: string;
};

const ALERT_REFRESH_MS = 10 * 60 * 1000;

export const useAlerts = (user: User | null) => {
  const [alerts, setAlerts] = useState<AppAlert[]>([]);

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      return;
    }

    const refreshAlerts = async () => {
      try {
        if (user.role === UserRole.ADMIN) {
          await dataService.checkAndGenerateAlerts();
        }

        const activeAlerts = await dataService.getAlerts(user);
        setAlerts(activeAlerts);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };

    refreshAlerts();

    const interval = setInterval(refreshAlerts, ALERT_REFRESH_MS);
    return () => clearInterval(interval);
  }, [user]);

  const resolveAlert = async (id: string) => {
    if (!user) return;

    await dataService.resolveAlert(id, user);
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const acceptInvitation = async (alert: AppAlert) => {
    if (!user) return;

    await dataService.acceptAssignment(alert.leadId, user.id);
    setAlerts(prev => prev.filter(item => item.id !== alert.id));
  };

  const rejectInvitation = async (alert: AppAlert) => {
    if (!user) return;

    await dataService.rejectAssignment(alert.leadId, user.id);
    setAlerts(prev => prev.filter(item => item.id !== alert.id));
  };

  return {
    alerts,
    resolveAlert,
    acceptInvitation,
    rejectInvitation,
  };
};
