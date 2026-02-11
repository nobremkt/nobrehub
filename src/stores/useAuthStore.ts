/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - STORE: AUTH
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Gerencia estado de autenticação e usuário logado.
 * Usa Firebase Auth para autenticação.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_CONFIG } from '@/config/constants';
import { loginWithEmail, logoutUser, subscribeToAuthState, getUserData } from '@/features/auth/services';
import type { User, AuthStatus } from '@/types/user.types';

interface AuthState {
    user: User | null;
    status: AuthStatus;
    error: string | null;
    initialized: boolean;
}

interface AuthActions {
    setUser: (user: User | null) => void;
    setStatus: (status: AuthStatus) => void;
    setError: (error: string | null) => void;
    setInitialized: (initialized: boolean) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    resetError: () => void;
    initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set) => ({
            // Initial state
            user: null,
            status: 'idle',
            error: null,
            initialized: false,

            // Actions
            setUser: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
            setStatus: (status) => set({ status }),
            setError: (error) => set({ error }),
            setInitialized: (initialized) => set({ initialized }),
            resetError: () => set({ error: null }),

            login: async (email: string, password: string) => {
                set({ status: 'loading', error: null });

                try {
                    const user = await loginWithEmail(email, password);
                    set({ user, status: 'authenticated' });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Erro ao fazer login';

                    // Traduzir mensagens do Firebase
                    let translatedMessage = message;
                    if (message.includes('invalid-credential') || message.includes('user-not-found') || message.includes('wrong-password')) {
                        translatedMessage = 'Email ou senha incorretos';
                    } else if (message.includes('too-many-requests')) {
                        translatedMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
                    } else if (message.includes('network-request-failed') || message.includes('offline')) {
                        translatedMessage = 'Erro de conexão. Verifique sua internet';
                    }

                    set({ status: 'unauthenticated', error: translatedMessage });
                    throw new Error(translatedMessage);
                }
            },

            logout: async () => {
                set({ status: 'loading' });

                try {
                    await logoutUser();
                    set({ user: null, status: 'unauthenticated', error: null });
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Erro ao fazer logout';
                    set({ error: message });
                    throw error;
                }
            },

            initAuthListener: () => {
                // Set initialized immediately to avoid blocking UI
                set({ initialized: true });

                const unsubscribe = subscribeToAuthState((firebaseUser) => {
                    if (!firebaseUser) {
                        // Não logado - imediatamente define o estado
                        set({ user: null, status: 'unauthenticated' });
                    } else {
                        // Usuário autenticado no Firebase, buscar dados completos
                        getUserData((firebaseUser as any).uid, (firebaseUser as any).email || undefined)
                            .then((userData) => {
                                if (userData) {
                                    set({ user: userData, status: 'authenticated' });
                                } else {
                                    // Fallback apenas se não achar dados (ex: usuário novo sem cadastro)
                                    // Mantém comportamento anterior de user básico
                                    const basicUser: User = {
                                        id: (firebaseUser as any).uid,
                                        email: (firebaseUser as any).email || '',
                                        name: (firebaseUser as any).displayName || 'Usuário',
                                        role: 'viewer',
                                        isActive: true,
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                    };
                                    set({ user: basicUser, status: 'authenticated' });
                                }
                            })
                            .catch((err) => {
                                console.error("Error fetching user data in auth listener:", err);
                                // Em caso de erro, definir como não autenticado ou manter básico?
                                // Melhor manter básico para não travar app app
                                set({ status: 'unauthenticated', error: 'Erro ao carregar perfil do usuário.' });
                            });
                    }
                });

                return unsubscribe;
            },
        }),
        {
            name: APP_CONFIG.storage.user,
            partialize: (state) => ({ user: state.user }),
        }
    )
);
