import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] font-sans text-slate-900 dark:text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl">restaurant</span>
                            </div>
                            <span className="font-bold text-xl tracking-tight">GestãoBuffet</span>
                        </div>
                        <div className="flex items-center gap-4 hidden sm:flex">
                            <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                                {user ? 'Acessar Painel' : 'Entrar'}
                            </Link>
                            {!user && (
                                <Link to="/register" className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/25 hover:shadow-primary/40">
                                    Criar Conta
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-24">
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,118,110,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(47,111,237,0.06)_1px,transparent_1px)] bg-[size:42px_42px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/80 dark:from-[#0f172a]/80 dark:to-[#0f172a]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 border border-blue-100 dark:border-blue-800">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Ambiente pessoal para gestão do buffet
                    </div>
                    <h1 className="font-display text-4xl sm:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                        A plataforma completa para <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">gerenciar seu Buffet</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Deixe as planilhas para trás. Controle leads, eventos, equipe e financeiro em um único lugar. Simples, rápido e direto para sua rotina.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to={user ? "/dashboard" : "/register"} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base font-bold px-8 py-4 rounded-xl transition-all active:scale-95 shadow-xl shadow-primary/30 hover:shadow-primary/50 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">rocket_launch</span>
                            {user ? 'Ir para Dashboard' : 'Criar Conta'}
                        </Link>
                        <a href="#features" className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-base font-bold px-8 py-4 rounded-xl transition-all active:scale-95 text-center">
                            Conhecer Recursos
                        </a>
                    </div>

                    {/* Mockup Preview */}
                    <div className="mt-20 relative mx-auto max-w-5xl">
                        <div className="bg-slate-900 rounded-2xl p-2 shadow-2xl ring-1 ring-white/10">
                            <div className="bg-[#111827] rounded-xl overflow-hidden border border-slate-700/50">
                                {/* Mock Top Bar */}
                                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/50 bg-[#0f172a]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                                        <span className="material-symbols-outlined text-xs">restaurant</span>
                                        <span className="font-semibold">GestãoBuffet — Painel de Controle</span>
                                    </div>
                                    <div className="w-16"></div>
                                </div>

                                <div className="flex">
                                    {/* Mock Sidebar */}
                                    <div className="w-14 bg-[#0f172a] border-r border-slate-700/50 py-4 flex flex-col items-center gap-4 shrink-0">
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-sm">dashboard</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center opacity-40">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">view_kanban</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center opacity-40">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">group</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center opacity-40">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">payments</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center opacity-40">
                                            <span className="material-symbols-outlined text-slate-400 text-sm">settings</span>
                                        </div>
                                    </div>

                                    {/* Mock Main Content */}
                                    <div className="flex-1 p-5 space-y-5 min-h-[340px] sm:min-h-[380px]">
                                        {/* Header */}
                                        <div>
                                            <h3 className="text-white text-sm font-bold">Dashboard Gerencial</h3>
                                            <p className="text-slate-500 text-[10px]">Visão geral do desempenho</p>
                                        </div>

                                        {/* Mock Stat Cards Row */}
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Performance Comercial</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <MockStatCard label="Total de Leads" value="47" icon="groups" color="bg-blue-500" />
                                                <MockStatCard label="Em Negociação" value="12" icon="handshake" color="bg-amber-500" />
                                                <MockStatCard label="Fechados" value="28" icon="check_circle" color="bg-green-500" />
                                                <MockStatCard label="Perdidos" value="7" icon="cancel" color="bg-red-500" />
                                            </div>
                                        </div>

                                        {/* Mock Financial Cards */}
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Indicadores Financeiros</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <MockStatCard label="Receita Total" value="R$ 84.500" icon="payments" color="bg-emerald-600" />
                                                <MockStatCard label="Despesas" value="R$ 31.200" icon="shopping_cart_checkout" color="bg-rose-500" />
                                                <MockStatCard label="Resultado" value="R$ 53.300" icon="account_balance_wallet" color="bg-primary" highlight />
                                            </div>
                                        </div>

                                        {/* Mock Upcoming Events Table */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-bold text-white">Próximos Eventos Confirmados</p>
                                                <span className="text-[9px] text-primary font-semibold">Ver Agenda →</span>
                                            </div>
                                            <div className="bg-[#0f172a] rounded-lg border border-slate-700/50 overflow-hidden">
                                                <table className="w-full text-[10px]">
                                                    <thead>
                                                        <tr className="bg-slate-800/50">
                                                            <th className="text-left px-3 py-1.5 text-slate-500 font-bold text-[9px] uppercase">Cliente</th>
                                                            <th className="text-left px-3 py-1.5 text-slate-500 font-bold text-[9px] uppercase hidden sm:table-cell">Data</th>
                                                            <th className="text-left px-3 py-1.5 text-slate-500 font-bold text-[9px] uppercase">Tipo</th>
                                                            <th className="text-center px-3 py-1.5 text-slate-500 font-bold text-[9px] uppercase hidden sm:table-cell">Convidados</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800">
                                                        <MockTableRow name="Maria Silva" date="15 Mar" type="Casamento" guests="180" />
                                                        <MockTableRow name="João Oliveira" date="22 Mar" type="Aniversário" guests="60" />
                                                        <MockTableRow name="Ana Costa" date="05 Abr" type="Corporativo" guests="120" />
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Glow effect behind the mockup */}
                        <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-primary/20 via-blue-500/10 to-purple-500/20 blur-3xl rounded-3xl opacity-60"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white dark:bg-[#0f172a] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Tudo o que você precisa</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Ferramentas integradas para otimizar cada etapa do seu negócio, da prospecção ao pós-evento.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="person_add"
                            title="Gestão de Leads"
                            desc="Pipeline visual (Kanban) para acompanhar suas negociações e nunca perder uma venda."
                        />
                        <FeatureCard
                            icon="group"
                            title="Equipe & Escala"
                            desc="Convide colaboradores, distribua tarefas e organize a escala de staff para cada evento."
                        />
                        <FeatureCard
                            icon="monitor_heart"
                            title="Financeiro e Métricas"
                            desc="Acompanhe receitas, despesas e lucratividade em tempo real com relatórios detalhados."
                        />
                        <FeatureCard
                            icon="security"
                            title="Segurança Total"
                            desc="Acesso controlado para manter os dados do seu buffet organizados e protegidos."
                        />
                        <FeatureCard
                            icon="verified"
                            title="Contratos & Docs"
                            desc="Gerador automático de contratos e armazenamento seguro de documentos por evento."
                        />
                        <FeatureCard
                            icon="calendar_month"
                            title="Agenda Inteligente"
                            desc="Visualize seus eventos futuros e disponibilidade para evitar conflitos de data."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-2xl text-primary">restaurant</span>
                            <span className="font-bold text-white text-lg">GestãoBuffet</span>
                        </div>
                        <div className="flex gap-8 text-sm font-medium">
                            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
                            <a href="#" className="hover:text-white transition-colors">Contato</a>
                        </div>
                        <div className="text-sm">
                            © 2024 GestãoBuffet. Todos os direitos reservados.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: any) {
    return (
        <div className="p-6 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function MockStatCard({ label, value, icon, color, highlight = false }: any) {
    return (
        <div className={`${highlight ? 'bg-primary/10 border-primary/30' : 'bg-[#1e293b]'} rounded-lg p-2.5 border border-slate-700/50 flex items-center justify-between gap-2`}>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider truncate">{label}</span>
                <span className={`${highlight ? 'text-primary' : 'text-white'} text-sm font-black tracking-tight`}>{value}</span>
            </div>
            <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                <span className="material-symbols-outlined text-[14px]">{icon}</span>
            </div>
        </div>
    );
}

function MockTableRow({ name, date, type, guests }: any) {
    return (
        <tr className="hover:bg-slate-800/30 transition-colors">
            <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[10px]">person</span>
                    </div>
                    <span className="text-white font-semibold text-[10px]">{name}</span>
                </div>
            </td>
            <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">{date}</td>
            <td className="px-3 py-2">
                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-blue-900/40 text-blue-300 uppercase">{type}</span>
            </td>
            <td className="px-3 py-2 text-center text-slate-300 hidden sm:table-cell">
                <div className="flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[10px] opacity-50">groups</span>
                    {guests}
                </div>
            </td>
        </tr>
    );
}
