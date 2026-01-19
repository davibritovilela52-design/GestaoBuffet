import React from 'react';
import { PaymentAlert, AlertType } from '../types';

interface AlertsPanelProps {
    alerts: any[];
    onResolve: (alertId: string) => void;
    onAcceptInvitation?: (alert: any) => void;
    onRejectInvitation?: (alert: any) => void;
    onClose: () => void;
    userRole: string;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onResolve, onAcceptInvitation, onRejectInvitation, onClose, userRole }) => {
    const getAlertStyle = (type: string) => {
        if (type === 'OVERDUE') return 'bg-red-50 border-red-200 text-red-800';
        if (type === 'DUE_TODAY') return 'bg-amber-50 border-amber-200 text-amber-800';
        if (type === 'STAFF_INVITATION') return 'bg-primary/5 border-primary/20 text-primary';
        return 'bg-blue-50 border-blue-200 text-blue-800';
    };

    const getAlertTitle = (type: string) => {
        if (type === 'OVERDUE') return 'Pagamento em Atraso';
        if (type === 'DUE_TODAY') return 'Vence Hoje';
        if (type === 'UPCOMING_7') return 'Vence em 7 dias';
        if (type === 'UPCOMING_3') return 'Vence em 3 dias';
        if (type === 'STAFF_INVITATION') return 'Convite de Trabalho';
        return 'Alerta';
    };

    return (
        <div className="fixed top-20 right-6 w-96 bg-white dark:bg-[#1a2632] shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-800 z-[100] flex flex-col max-h-[70vh] overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">notifications_active</span>
                    <h3 className="font-bold text-gray-800 dark:text-white">{userRole === 'ADMIN' ? 'Alertas de Pagamento' : 'Minhas Notificações'}</h3>
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alerts.length}</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {alerts.length === 0 && (
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-5xl mb-2">check_circle</span>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum alerta pendente!</p>
                    </div>
                )}
                {alerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-xl border ${getAlertStyle(alert.type)} flex flex-col gap-2 relative group`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <span className={`text-[10px] font-black uppercase tracking-wider opacity-70 ${alert.type === 'STAFF_INVITATION' ? 'text-primary' : ''}`}>{getAlertTitle(alert.type)}</span>
                                <h4 className="font-bold text-sm leading-tight">{alert.clientName}</h4>
                                <p className="text-xs opacity-80">{alert.eventName}</p>
                                {alert.type === 'STAFF_INVITATION' && (
                                    <p className="text-[10px] font-bold mt-1 bg-primary/10 inline-block px-1.5 py-0.5 rounded">Cargo: {alert.role}</p>
                                )}
                            </div>
                            <div className="text-right">
                                {alert.type !== 'STAFF_INVITATION' && (
                                    <p className="font-black text-sm">R$ {alert.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                )}
                                <p className="text-[10px] opacity-70">{alert.type === 'STAFF_INVITATION' ? 'Data:' : 'Vencimento:'} {new Date(alert.dueDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex justify-end mt-1 gap-2">
                            {alert.type === 'STAFF_INVITATION' ? (
                                <>
                                    <button
                                        onClick={() => onRejectInvitation?.(alert)}
                                        className="flex items-center gap-1 text-[10px] font-bold bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white px-2 py-1 rounded transition-all border border-red-500/20"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                        RECUSAR
                                    </button>
                                    <button
                                        onClick={() => onAcceptInvitation?.(alert)}
                                        className="flex items-center gap-1 text-[10px] font-bold bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white px-2 py-1 rounded transition-all border border-green-500/20"
                                    >
                                        <span className="material-symbols-outlined text-sm">check</span>
                                        ACEITAR
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => onResolve(alert.id)}
                                    className="flex items-center gap-1 text-[10px] font-bold bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 px-2 py-1 rounded transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">done_all</span>
                                    MARCAR COMO RESOLVIDO
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
