import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    needsOnboarding: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const mapProfileToUser = (
        profile: { id: string; nome: string; role: string; status?: string; email?: string; org_id?: string },
        email?: string | null,
        org?: { name: string } | null
    ): User => {
        const role = profile.role === 'Administrador' ? UserRole.ADMIN : UserRole.EMPLOYEE;
        return {
            id: profile.id,
            name: profile.nome,
            email: profile.email || email || '',
            role,
            status: profile.status === 'INACTIVE' ? UserStatus.INACTIVE : UserStatus.ACTIVE,
            orgId: profile.org_id || undefined,
            orgName: org?.name || undefined,
        };
    };

    const ensureProfile = useCallback(async (authUser: { id: string; email?: string | null; user_metadata?: { nome?: string; role?: string } }) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, nome, role, status, email, org_id')
            .eq('id', authUser.id)
            .maybeSingle();

        if (error) throw error;
        if (data) return data;

        const fallbackName = authUser.user_metadata?.nome || authUser.email?.split('@')[0] || 'Usuario';
        const fallbackRole = authUser.user_metadata?.role === 'Administrador' ? 'Administrador' : 'Funcionario';
        const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert({
                id: authUser.id,
                nome: fallbackName,
                role: fallbackRole,
                status: 'ACTIVE',
                email: authUser.email || ''
            })
            .select('id, nome, role, status, email, org_id')
            .single();

        if (insertError) throw insertError;
        return inserted;
    }, []);

    const loadOrganization = useCallback(async (orgId: string | null | undefined) => {
        if (!orgId) return null;
        const { data, error } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', orgId)
            .maybeSingle();
        if (error) {
            console.error('Error loading organization:', error);
            return null;
        }
        return data;
    }, []);

    const loadUserFromSession = useCallback(async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const authUser = data.session?.user;
        if (!authUser) {
            setUser(null);
            return;
        }

        const profile = await ensureProfile({
            id: authUser.id,
            email: authUser.email,
            user_metadata: authUser.user_metadata as { nome?: string; role?: string }
        });

        const org = await loadOrganization(profile.org_id);
        setUser(mapProfileToUser(profile, authUser.email, org));
    }, [ensureProfile, loadOrganization]);

    useEffect(() => {
        const validateSession = async () => {
            try {
                await loadUserFromSession();
            } catch (error) {
                console.error('Session validation error:', error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        validateSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(() => {
            loadUserFromSession().catch((error) => {
                console.error('Session update error:', error);
                setUser(null);
            });
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [loadUserFromSession]);

    const login = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await loadUserFromSession();
    }, [loadUserFromSession]);

    const register = useCallback(async (name: string, email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome: name,
                    role: 'Administrador' // New signups are always org admins
                }
            }
        });
        if (error) throw error;
        if (!data.user) throw new Error('Erro ao criar usuário');
    }, []);

    const logout = useCallback(() => {
        supabase.auth.signOut().finally(() => setUser(null));
    }, []);

    const refreshUser = useCallback(async () => {
        await loadUserFromSession();
    }, [loadUserFromSession]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
                isAdmin: user?.role === UserRole.ADMIN,
                needsOnboarding: !!user && !user.orgId,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context;
};
