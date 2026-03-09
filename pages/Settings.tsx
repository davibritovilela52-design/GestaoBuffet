import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';
import { Organization, PLAN_LIMITS, PlanTier } from '../types';

export default function Settings() {
    const { user, refreshUser } = useAuth();
    const [org, setOrg] = useState<Organization | null>(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [memberCount, setMemberCount] = useState(0);
    const [leadCount, setLeadCount] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const loadOrg = useCallback(async () => {
        if (!user?.orgId) return;
        try {
            const orgData = await organizationService.getOrganization(user.orgId);
            if (orgData) {
                setOrg(orgData);
                setName(orgData.name);
                setSlug(orgData.slug);
            }
            const [members, leads] = await Promise.all([
                organizationService.getMemberCount(user.orgId),
                organizationService.getLeadCount(user.orgId),
            ]);
            setMemberCount(members);
            setLeadCount(leads);
        } catch (err) {
            console.error('Error loading org:', err);
        }
    }, [user?.orgId]);

    useEffect(() => {
        loadOrg();
    }, [loadOrg]);

    const handleSave = async () => {
        if (!org) return;
        setIsSaving(true);
        setError('');
        setSuccess('');
        try {
            await organizationService.updateOrganization(org.id, { name, slug });
            await refreshUser();
            await loadOrg();
            setSuccess('Configurações salvas com sucesso!');
            setIsEditing(false);
        } catch (err: any) {
            setError(err?.message || 'Erro ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!org) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const limits = PLAN_LIMITS[org.plan];
    const planColors: Record<PlanTier, string> = {
        free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        pro: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };

    return (
        <div className="max-w-3xl space-y-8">
            {/* Org Info */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Informações da Organização</h3>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Editar
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Nome</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border-gray-300 p-3 text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            />
                        ) : (
                            <p className="text-sm text-gray-900 dark:text-white font-medium">{org.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Slug (URL)</label>
                        {isEditing ? (
                            <div className="flex items-center gap-0 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden">
                                <span className="text-sm text-gray-400 pl-3 select-none">app.gestaobuffet.com/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                                    className="flex-1 border-0 p-3 text-sm bg-transparent dark:text-white focus:ring-0"
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">app.gestaobuffet.com/<span className="font-semibold text-gray-900 dark:text-white">{org.slug}</span></p>
                        )}
                    </div>

                    {isEditing && (
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                                onClick={() => { setIsEditing(false); setName(org.name); setSlug(org.slug); }}
                                className="text-gray-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            {success}
                        </div>
                    )}
                </div>
            </div>

            {/* Plan & Usage */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Plano & Uso</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${planColors[org.plan]}`}>
                        {org.plan}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Leads */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary text-lg">campaign</span>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Leads</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {leadCount}
                            <span className="text-sm font-normal text-gray-400"> / {limits.maxLeads === Infinity ? '∞' : limits.maxLeads}</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${limits.maxLeads === Infinity ? 10 : Math.min(100, (leadCount / limits.maxLeads) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Members */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-blue-500 text-lg">group</span>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Membros</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {memberCount}
                            <span className="text-sm font-normal text-gray-400"> / {limits.maxMembers === Infinity ? '∞' : limits.maxMembers}</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${limits.maxMembers === Infinity ? 10 : Math.min(100, (memberCount / limits.maxMembers) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Storage */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-amber-500 text-lg">cloud</span>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Storage</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {limits.maxStorageMb >= 1024 ? `${limits.maxStorageMb / 1024}GB` : `${limits.maxStorageMb}MB`}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Limite disponível</p>
                    </div>
                </div>

                {org.plan === 'free' && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-xl border border-primary/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Precisa de mais recursos?</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Faça upgrade para Pro e gerencie até 500 leads</p>
                            </div>
                            <button
                                onClick={() => navigate('/pricing')}
                                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-sm">upgrade</span>
                                Upgrade
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
