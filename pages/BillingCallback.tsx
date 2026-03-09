import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';
import { PlanTier } from '../types';

export default function BillingCallback() {
    const [searchParams] = useSearchParams();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processCallback = async () => {
            const result = searchParams.get('result');
            const plan = searchParams.get('plan') as PlanTier;

            if (result !== 'success' || !plan) {
                setError('Parametros invalidos no retorno do pagamento.');
                return;
            }

            if (!user?.orgId) {
                setError('Usuario sem organizacao.');
                return;
            }

            try {
                console.log(`Processing billing callback for org ${user.orgId} -> ${plan}`);
                // MOCK: Update the plan directly in DB
                await organizationService.updatePlan(user.orgId, plan);

                // Refresh user context to get new plan limits
                await refreshUser();

                // Redirect to settings with success message
                // setTimeout to ensure user sees the success state if we want, 
                // but immediate redirect is usually better for UX if we show a toast on destination.
                // Let's redirect to Dashboard or Settings
                navigate('/settings', { state: { message: `Plano atualizado com sucesso para ${plan.toUpperCase()}!` } });
            } catch (err: any) {
                console.error('Billing callback error:', err);
                setError(err.message || 'Erro ao processar atualizacao do plano.');
            }
        };

        if (user) {
            processCallback();
        }
    }, [user, searchParams, navigate, refreshUser]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/10 p-4">
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">error</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erro no Processamento</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/settings')}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Voltar para Configurações
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0f172a]">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Processando pagamento...</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Por favor, aguarde um momento.</p>
            </div>
        </div>
    );
}
