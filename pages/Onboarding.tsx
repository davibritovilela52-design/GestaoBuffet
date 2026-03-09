import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';

export default function Onboarding() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        // If user already has org, redirect to dashboard
        if (user?.orgId) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!slugManuallyEdited && name) {
            setSlug(organizationService.generateSlug(name));
        }
    }, [name, slugManuallyEdited]);

    const handleSlugChange = (value: string) => {
        setSlugManuallyEdited(true);
        setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await organizationService.createOrganization(name, slug);
            await refreshUser();
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err?.message || 'Erro ao criar organização.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[480px]">
                {/* Progress indicator */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">✓</div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Conta criada</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-primary"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Sua empresa</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
                        <span className="text-sm text-gray-400">Pronto!</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] shadow-2xl rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-8">
                        <div className="inline-flex p-4 bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-2xl mb-4">
                            <span className="material-symbols-outlined text-primary text-4xl">business</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configure sua empresa</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                            Crie o espaço de trabalho para o seu buffet
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                Nome da empresa
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Buffet No Capricho"
                                className="w-full rounded-xl border-gray-300 p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                URL do seu espaço
                            </label>
                            <div className="flex items-center gap-0 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                <span className="text-sm text-gray-400 pl-3.5 select-none whitespace-nowrap">app.gestaobuffet.com/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    placeholder="meu-buffet"
                                    className="flex-1 border-0 p-3.5 text-sm bg-transparent dark:text-white focus:ring-0"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                                Use apenas letras minúsculas, números e hífens
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !name.trim() || !slug.trim()}
                            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                                    Criar minha empresa
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-lg mt-0.5">info</span>
                            <div>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Plano Gratuito</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Você começa com até 50 leads e 3 membros. Faça upgrade a qualquer momento.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
