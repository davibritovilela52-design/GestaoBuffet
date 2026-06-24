import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';

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

    const loadUserFromSession = useCallback(async () => {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
    }, []);

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

        const subscription = authService.onAuthStateChange(() => {
            loadUserFromSession().catch((error) => {
                console.error('Session update error:', error);
                setUser(null);
            });
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadUserFromSession]);

    const login = useCallback(async (email: string, password: string) => {
        const currentUser = await authService.login(email, password);
        setUser(currentUser);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        await authService.register(name, email, password);
    }, []);

    const logout = useCallback(() => {
        authService.logout().finally(() => setUser(null));
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
