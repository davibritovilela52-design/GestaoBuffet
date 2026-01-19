import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, role: 'Administrador' | 'Funcionario') => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const mapProfileToUser = (profile: { id: string; nome: string; role: string; status?: string; email?: string }, email?: string | null): User => {
        const role = profile.role === 'Administrador' ? UserRole.ADMIN : UserRole.EMPLOYEE;
        return {
            id: profile.id,
            name: profile.nome,
            email: profile.email || email || '',
            role,
            status: profile.status === 'INACTIVE' ? UserStatus.INACTIVE : UserStatus.ACTIVE
        };
    };

    const ensureProfile = useCallback(async (authUser: { id: string; email?: string | null; user_metadata?: { nome?: string; role?: string } }) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, nome, role, status, email')
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
            .select('id, nome, role, status, email')
            .single();

        if (insertError) throw insertError;
        return inserted;
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
        setUser(mapProfileToUser(profile, authUser.email));
    }, [ensureProfile]);

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

    const register = useCallback(async (name: string, email: string, password: string, role: 'Administrador' | 'Funcionario') => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome: name,
                    role: role
                }
            }
        });
        if (error) throw error;
        if (!data.user) throw new Error('Erro ao criar usuário');
    }, []);

    const logout = useCallback(() => {
        supabase.auth.signOut().finally(() => setUser(null));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
                isAdmin: user?.role === UserRole.ADMIN
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
