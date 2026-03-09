import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlanTier, PLAN_LIMITS } from '../types';
import { stripeService } from '../services/stripeService';
import { organizationService } from '../services/organizationService';

interface PricingProps { }

const plans: { id: PlanTier; name: string; price: string; features: string[] }[] = [
    {
        id: 'free',
        name: 'Free',
        price: 'R$ 0/mês',
        features: [
            `${PLAN_LIMITS.free.maxLeads} Leads`,
            `${PLAN_LIMITS.free.maxMembers} Membros`,
            '500MB Armazenamento',
            'Gestão Básica',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 'R$ 97/mês',
        features: [
            `${PLAN_LIMITS.pro.maxLeads} Leads`,
            `${PLAN_LIMITS.pro.maxMembers} Membros`,
            '5GB Armazenamento',
            'Relatórios Avançados',
            'Fila de Negócios',
            'Suporte Prioritário',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Sob Consulta',
        features: [
            'Leads Ilimitados',
            'Membros Ilimitados',
            '50GB Armazenamento',
            'API de Integração',
            'Gerente de Conta',
            'Backup Diário',
        ],
    },
];

export default function Pricing() {
    const { user, refreshUser } = useAuth();
    const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);

    const handleSelectPlan = async (plan: PlanTier) => {
        if (!user?.orgId) return;

        // Don't do anything if already on plan? Or maybe allow "Manage Subscription"?
        if (user.orgPlan === plan) return;

        setLoadingPlan(plan);
        try {
            if (plan === 'free') {
                // Downgrade immediately
                if (window.confirm('Tem certeza que deseja voltar para o plano Gratuito? Alguns recursos podem ficar indisponíveis.')) {
                    await organizationService.updatePlan(user.orgId, 'free');
                    await refreshUser();
                    alert('Plano atualizado com sucesso!');
                }
            } else {
                // Upgrade flow (Mock Stripe)
                const { url } = await stripeService.createCheckoutSession(user.orgId, plan);
                window.location.href = url;
            }
        } catch (error: any) {
            alert('Erro ao processar: ' + error.message);
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                    Escolha o plano ideal para seu Buffet
                </h2>
                <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                    Flexibilidade para crescer com seu negócio. Cancele a qualquer momento.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">
                {plans.map((plan) => {
                    const isCurrent = user?.orgPlan === plan.id;
                    return (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col p-8 bg-white dark:bg-[#1e293b] rounded-2xl border transition-all ${isCurrent
                                    ? 'border-primary ring-2 ring-primary shadow-xl scale-105 z-10'
                                    : 'border-gray-200 dark:border-gray-800 hover:border-primary/50 hover:shadow-lg'
                                }`}
                        >
                            {isCurrent && (
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wide">
                                    Atual
                                </div>
                            )}

                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">{plan.price}</p>
                            </div>

                            <ul className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                        <span className="material-symbols-outlined text-green-500 text-lg mr-2">check_circle</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={isCurrent || loadingPlan !== null}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${isCurrent
                                        ? 'bg-gray-100 text-gray-500 cursor-default dark:bg-gray-800 dark:text-gray-500'
                                        : plan.id === 'enterprise'
                                            ? 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                                            : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                                    }`}
                            >
                                {loadingPlan === plan.id ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Processando...
                                    </span>
                                ) : isCurrent ? (
                                    'Seu Plano Atual'
                                ) : plan.id === 'free' ? (
                                    'Downgrade'
                                ) : (
                                    'Fazer Upgrade'
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Precisa de um plano customizado? Entre em contato com nosso time de vendas.</p>
            </div>
        </div>
    );
}
