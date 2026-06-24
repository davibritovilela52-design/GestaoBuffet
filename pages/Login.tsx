import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const getLoginErrorMessage = (err: any) => {
        const rawMessage = String(err?.message || '').toLowerCase();
        if (rawMessage.includes('invalid login credentials')) {
            return 'Email ou senha inválidos.';
        }
        return 'Erro ao entrar. Verifique seu email e senha.';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Informe seu email.');
            return;
        }

        if (!password) {
            setError('Informe sua senha.');
            return;
        }

        setIsSubmitting(true);

        try {
            await login(email.trim(), password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(getLoginErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-shell min-h-screen flex items-center justify-center p-6 text-[#111418] dark:text-white">
            <div className="w-full max-w-6xl grid lg:grid-cols-[1fr_440px] gap-6 items-stretch">
                <section className="hidden lg:flex surface-card rounded-[28px] p-8 min-h-[620px] flex-col justify-between overflow-hidden">
                    <div>
                        <div className="inline-flex items-center gap-3 rounded-2xl bg-white/70 dark:bg-white/10 border border-white/70 dark:border-white/10 px-4 py-3">
                            <div className="brand-mark rounded-xl p-2 text-white">
                                <span className="material-symbols-outlined">restaurant</span>
                            </div>
                            <div>
                                <p className="font-display text-xl font-black leading-none">BuffetNoCapricho</p>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Command center</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="section-eyebrow mb-3">Operação em tempo real</p>
                            <h1 className="font-display text-5xl font-black leading-tight max-w-xl">
                                Eventos, equipe e financeiro no mesmo ritmo.
                            </h1>
                        </div>
                        <div className="grid grid-cols-3 gap-3 max-w-xl">
                            {[
                                ['Leads', '47', 'groups'],
                                ['Eventos', '18', 'event_available'],
                                ['Resultado', '53k', 'payments'],
                            ].map(([label, value, icon]) => (
                                <div key={label} className="rounded-2xl bg-white/70 dark:bg-white/10 border border-white/70 dark:border-white/10 p-4">
                                    <span className="material-symbols-outlined text-primary">{icon}</span>
                                    <p className="mt-3 text-xs font-bold text-gray-500 dark:text-gray-400">{label}</p>
                                    <p className="font-display text-3xl font-black">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="auth-panel rounded-[28px] p-8 sm:p-10 flex flex-col justify-center">
                    <div className="mb-8">
                        <div className="inline-flex p-3 brand-mark rounded-2xl mb-5 text-white">
                            <span className="material-symbols-outlined text-3xl">restaurant</span>
                        </div>
                        <p className="section-eyebrow mb-2">Acesso seguro</p>
                        <h1 className="font-display text-4xl font-black text-gray-900 dark:text-white">Bem-vindo</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Entre para gerenciar a operação do buffet.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label htmlFor="login-email" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input
                                id="login-email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3.5 text-sm"
                                autoComplete="email"
                                required
                                aria-invalid={!!error}
                                aria-describedby={error ? 'login-error' : undefined}
                            />
                        </div>
                        <div>
                            <label htmlFor="login-password" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                            <input
                                id="login-password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3.5 text-sm"
                                autoComplete="current-password"
                                required
                                aria-invalid={!!error}
                                aria-describedby={error ? 'login-error' : undefined}
                            />
                        </div>

                        {error && (
                            <div id="login-error" role="alert" className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 text-xs font-bold rounded-2xl flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isSubmitting ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="mt-7 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Não tem uma conta?{' '}
                            <Link to="/register" className="text-primary font-bold hover:underline">
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
