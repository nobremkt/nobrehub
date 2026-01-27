import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseLogin, supabaseGetCurrentUser, supabaseLogout, AuthUser } from '../services/supabaseAuth';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            supabaseGetCurrentUser(token)
                .then((user) => {
                    if (user) setUser(user);
                })
                .catch(() => {
                    supabaseLogout();
                    setUser(null);
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await supabaseLogin(email, password);
        localStorage.setItem('token', response.token);
        setUser(response.user);
    }, []);

    const logout = useCallback(() => {
        supabaseLogout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
