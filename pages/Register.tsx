import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) {
            setError('Nome é obrigatório.');
            return;
        }

        if (!email.trim()) {
            setError('Email é obrigatório.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsSubmitting(true);

        try {
            await register(name, email, password);
            setSuccess('Cadastro realizado! Verifique seu email para confirmar a conta e depois faça login.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            const message = err?.message || 'Erro ao cadastrar. Tente novamente.';
            setError(message);
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[400px] bg-white dark:bg-[#1e293b] shadow-2xl rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">person_add</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Conta</h1>
                    <p className="text-gray-500 text-sm mt-1">Comece a gerenciar seu buffet hoje</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome completo"
                            className="w-full rounded-lg border-gray-300 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full rounded-lg border-gray-300 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full rounded-lg border-gray-300 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a senha"
                            className="w-full rounded-lg border-gray-300 p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Faça login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
