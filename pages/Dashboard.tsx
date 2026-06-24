import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { KPI, Deal, User, UserRole, DealStatus } from '../types';
import { formatDateOnly } from '../utils/date';

export default function Dashboard() {
    const [kpi, setKpi] = useState<KPI | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useOutletContext<{ user: User }>();

    useEffect(() => {
        // Se não for admin, não carrega dados sensíveis
        if (user.role !== UserRole.ADMIN) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const stats = await dataService.getKPIs();
                const deals = await dataService.getDeals();

                // Filtrar e ordenar próximos eventos:
                // 1. Data deve ser maior ou igual a hoje (Futuro)
                // 2. Status deve ser estritamente CLOSED (Fechado) para aparecer na tabela de "Próximos"
                // Ajuste para pegar a data local correta (YYYY-MM-DD)
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const today = `${year}-${month}-${day}`;
                const futureDeals = deals
                    .filter(d => d.eventDate >= today && d.status === DealStatus.CLOSED)
                    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

                setKpi(stats);
                setUpcomingEvents(futureDeals);
            } catch (error) {
                console.error("Erro ao carregar dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // 1. Bloqueio de Acesso para Funcionários
    if (user.role !== UserRole.ADMIN) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
                <div className="bg-blue-50 p-6 rounded-full">
                    <span className="material-symbols-outlined text-6xl text-primary">badge</span>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Olá, {user.name}!</h1>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                        Esta é a área administrativa. Você pode acessar suas tarefas e eventos no menu lateral.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link to="/events" className="px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                        Ver Meus Eventos
                    </Link>
                </div>
            </div>
        );
    }

    // 2. Estado de Carregamento (Skeletons)
    if (loading) {
        return <DashboardSkeleton />;
    }

    // 3. Renderização Principal (Admin)
    return (
        <div className="space-y-8 pb-12">
            <div className="operational-hero rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 overflow-hidden">
                <div>
                    <p className="section-eyebrow mb-2">Visao operacional</p>
                    <h1 className="page-title">Dashboard Gerencial</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-2xl">
                        Performance comercial, agenda confirmada e resultado financeiro em uma leitura unica.
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-3 md:min-w-[320px]">
                    <div className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 p-3">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Leads</p>
                        <p className="text-2xl font-black text-primary">{kpi?.totalLeads || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 p-3">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Ganhos</p>
                        <p className="text-2xl font-black text-emerald-600">{kpi?.closedCount || 0}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10 p-3">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Agenda</p>
                        <p className="text-2xl font-black text-blue-600">{upcomingEvents.length}</p>
                    </div>
                </div>
            </div>

            <div className="hidden">
                <h1 className="text-3xl font-black text-[#111418] dark:text-white">Dashboard Gerencial</h1>
                <p className="text-gray-500 text-sm mt-1">Visão geral do desempenho do BuffetNoCapricho</p>
            </div>

            {/* Seção Comercial */}
            <section>
                <h3 className="section-eyebrow mb-4">Performance Comercial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total de Leads"
                        value={kpi?.totalLeads || 0}
                        icon="groups"
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Em Negociação"
                        value={kpi?.negotiationCount || 0}
                        icon="handshake"
                        color="bg-amber-500"
                    />
                    <StatCard
                        title="Ganhos"
                        value={kpi?.closedCount || 0}
                        icon="check_circle"
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Perdidos"
                        value={kpi?.lostCount || 0}
                        icon="cancel"
                        color="bg-red-500"
                    />
                </div>
            </section>

            {/* Seção Financeira */}
            <section>
                <h3 className="section-eyebrow mb-4">Indicadores Financeiros</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Receita Total"
                        value={kpi?.monthlyRevenue || 0}
                        isMoney
                        icon="payments"
                        color="bg-emerald-600"
                        bgColor="bg-white dark:bg-[#1a2632]"
                    />
                    <StatCard
                        title="Despesas Totais"
                        value={kpi?.monthlyExpenses || 0}
                        isMoney
                        icon="shopping_cart_checkout"
                        color="bg-rose-500"
                        bgColor="bg-white dark:bg-[#1a2632]"
                    />
                    <StatCard
                        title="Resultado Financeiro"
                        value={kpi?.netProfit || 0}
                        isMoney
                        icon="account_balance_wallet"
                        color="bg-primary"
                        bgColor="bg-primary/5 dark:bg-primary/10 border-primary/20"
                    />
                </div>
            </section>

            {/* Próximos Eventos */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[#111418] dark:text-white text-xl font-bold">Próximos Eventos Confirmados</h2>
                    <Link to="/deals/closed" className="text-sm font-bold text-primary hover:underline">Ver Agenda Completa</Link>
                </div>

                <div className="data-table-card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/50 dark:bg-white/5">
                                <th className="px-6 py-4 text-xs font-bold text-[#617589] dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#617589] dark:text-gray-400 uppercase tracking-wider">Data do Evento</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#617589] dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#617589] dark:text-gray-400 uppercase tracking-wider text-center">Convidados</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#617589] dark:text-gray-400 uppercase tracking-wider">Local</th>
                                <th className="px-6 py-4 text-xs font-bold text-[#617589] dark:text-gray-400 uppercase tracking-wider">Tipo de Espaço</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-800">
                            {upcomingEvents.length > 0 ? upcomingEvents.slice(0, 5).map(deal => (
                                <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-[18px]">business</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#111418] dark:text-white">{deal.clientName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{formatDateOnly(deal.eventDate)}</span>
                                            <span className="text-xs text-[#617589]">{deal.startTime || 'A definir'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                                            {deal.eventType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5 font-bold text-gray-700 dark:text-gray-200">
                                            <span className="material-symbols-outlined text-[16px] opacity-60">groups</span>
                                            <span className="text-sm">{deal.guestCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-gray-400">location_on</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{deal.location || 'Não informado'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px] text-gray-400">home_work</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{deal.spaceType || 'Padrão'}</span>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-300 text-3xl">event_busy</span>
                                            <p className="text-gray-500 text-sm">Nenhum evento fechado próximo encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {upcomingEvents.length > 5 && (
                        <div className="px-6 py-4 bg-[#f8fafc] dark:bg-gray-800/20 text-center">
                            <button className="text-sm font-bold text-[#617589] dark:text-gray-400 hover:text-primary">Carregar Mais</button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

// --- Componentes Auxiliares ---

function StatCard({ title, value, icon, color, isMoney = false, bgColor = "bg-white dark:bg-[#1a2632]" }: any) {
    return (
        <div className={`metric-card relative ${bgColor} p-6 flex items-center justify-between gap-4 transition-all hover:-translate-y-1 duration-200`}>
            <div className="flex flex-col gap-1">
                <p className="text-[#617589] dark:text-gray-400 text-xs font-black uppercase">{title}</p>
                <h3 className="font-display text-2xl md:text-3xl font-black text-[#111418] dark:text-white">
                    {isMoney ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
                </h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-gray-200 dark:shadow-none`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-10 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/3 rounded"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
            </div>

            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
    );
}
