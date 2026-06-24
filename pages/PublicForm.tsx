import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { DealStatus, EventType } from '../types';

export default function PublicForm() {
    const { orgSlug } = useParams<{ orgSlug?: string }>();
    const { user, isLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const targetOrgSlug = orgSlug || user?.orgSlug;

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        date: '',
        startTime: '',
        endTime: '',
        type: '',
        guests: '',
        location: '',
        spaceType: '',
        notes: ''
    });

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validação: Horário
            if (formData.startTime && formData.endTime) {
                if (formData.endTime <= formData.startTime) {
                    throw new Error("O horário de fim deve ser posterior ao horário de início.");
                }
            }

            // Validação: Convidados
            if (Number(formData.guests) <= 0) {
                throw new Error("A quantidade de convidados deve ser maior que zero.");
            }

            const leadPayload = {
                clientName: formData.fullName,
                clientEmail: formData.email,
                clientPhone: formData.phone,
                eventDate: formData.date,
                startTime: formData.startTime,
                endTime: formData.endTime,
                eventType: formData.type as EventType,
                guestCount: Number(formData.guests),
                eventName: `Evento de ${formData.fullName.split(' ')[0]}`,
                location: formData.location,
                spaceType: formData.spaceType,
                notes: formData.notes,
                status: DealStatus.LEAD
            };

            if (targetOrgSlug) {
                await dataService.createPublicLead(targetOrgSlug, leadPayload);
            } else if (user) {
                await dataService.createLead(leadPayload);
            } else {
                throw new Error("Link de solicitação inválido. Peça um novo link ao buffet.");
            }

            showToast("✅ Solicitação enviada com sucesso! Em breve entraremos em contato.", "success");

            // Limpar formulário
            setFormData({
                fullName: '', email: '', phone: '', date: '',
                startTime: '', endTime: '', type: '', guests: '', location: '', spaceType: '', notes: ''
            });

        } catch (error: any) {
            showToast(`❌ ${error.message || "Erro ao enviar solicitação. Tente novamente."}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (isLoading && !orgSlug) {
        return (
            <div className="min-h-screen bg-gray-50 text-[#111418] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!targetOrgSlug && !user) {
        return (
            <div className="min-h-screen bg-gray-50 text-[#111418] flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center">
                    <div className="mx-auto mb-4 size-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">link_off</span>
                    </div>
                    <h1 className="text-xl font-black text-gray-900 mb-2">Link de solicitacao invalido</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        Peca ao buffet um novo link de orcamento para enviar sua solicitacao.
                    </p>
                    <Link to="/" className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90">
                        Voltar
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-[#111418] relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl border flex items-center gap-3 animate-bounce-in ${toast.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'
                    }`}>
                    <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
                    <span className="font-bold text-sm">{toast.message}</span>
                </div>
            )}

            <header className="bg-white border-b border-gray-200 px-6 py-4 md:px-10 sticky top-0 z-40 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary font-black text-xl tracking-tight">
                    <span className="material-symbols-outlined filled">restaurant_menu</span>
                    BuffetNoCapricho
                </div>

            </header>

            <main className="max-w-3xl mx-auto px-4 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Solicite um Orçamento para seu Evento</h1>
                    <p className="text-lg text-gray-500 mb-6">Serviço de buffet premium para tornar seu evento inesquecível</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="h-2 bg-primary w-full"></div>
                    <div className="p-8 md:p-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Seção Pessoal */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">person</span>
                                    Dados Pessoais
                                </h3>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                                    <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Seu nome completo" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                        <input required name="email" type="email" value={formData.email} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="seu@email.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Telefone <span className="text-red-500">*</span></label>
                                        <input required name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="(00) 00000-0000" />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Seção Evento */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">event</span>
                                    Detalhes do Evento
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Data <span className="text-red-500">*</span></label>
                                        <input required name="date" type="date" value={formData.date} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Início <span className="text-red-500">*</span></label>
                                        <input required name="startTime" type="time" value={formData.startTime} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Fim <span className="text-red-500">*</span></label>
                                        <input required name="endTime" type="time" value={formData.endTime} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Evento <span className="text-red-500">*</span></label>
                                        <select required name="type" value={formData.type} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                            <option value="">Selecione...</option>
                                            {Object.values(EventType).map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Nº Convidados <span className="text-red-500">*</span></label>
                                        <input required name="guests" type="number" min="1" value={formData.guests} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Ex: 150" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Local do Evento <span className="text-red-500">*</span></label>
                                        <input required name="location" value={formData.location} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Endereço ou local do evento" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo do Espaço <span className="text-red-500">*</span></label>
                                        <input required name="spaceType" value={formData.spaceType} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Ex: Salão, Sítio, Espaço aberto" />
                                    </div>

                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Serviços Solicitados / Observações <span className="text-red-500">*</span></label>
                                    <textarea required name="notes" rows={4} value={formData.notes} onChange={handleChange} className="w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Descreva o que você precisa: Equipe de cozinha, garçons, cardápio específico..."></textarea>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90 hover:-translate-y-1 active:translate-y-0'}`}
                                >
                                    {loading ? (
                                        <>
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Enviando Solicitação...
                                        </>
                                    ) : (
                                        <>
                                            Enviar Solicitação
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-4">
                                    Ao enviar, você concorda que nossa equipe entre em contato para apresentar uma proposta.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <footer className="bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-400 mt-12">
                © 2024 BuffetNoCapricho. Todos os direitos reservados.
            </footer>
        </div>
    );
}
