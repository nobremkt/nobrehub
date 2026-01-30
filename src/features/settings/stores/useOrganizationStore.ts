import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrganizationService, OrganizationSettings } from '../services/OrganizationService';

interface OrganizationState {
    companyName: string;
    logoUrl: string | null;
    primaryColor: string; // Hex color
    isLoading: boolean;
    error: string | null;

    // Actions
    init: () => Promise<void>;
    setOrganizationConfig: (config: Partial<OrganizationSettings>) => Promise<void>;
    resetToDefaults: () => void;
}

const DEFAULT_PRIMARY_COLOR = '#ef1136'; // Vermelho Nobre

export const useOrganizationStore = create<OrganizationState>()(
    persist(
        (set) => ({
            companyName: 'Minha Empresa',
            logoUrl: null,
            primaryColor: DEFAULT_PRIMARY_COLOR,
            isLoading: false,
            error: null,

            init: async () => {
                set({ isLoading: true, error: null });
                try {
                    const settings = await OrganizationService.getSettings();
                    if (settings) {
                        set({
                            companyName: settings.companyName,
                            logoUrl: settings.logoUrl || null,
                            primaryColor: settings.primaryColor || DEFAULT_PRIMARY_COLOR
                        });
                    }
                } catch (error) {
                    console.error('Falha ao carregar configurações da organização', error);
                    // Não quebramos a UI, mantemos o cache local se houver erro
                } finally {
                    set({ isLoading: false });
                }
            },

            setOrganizationConfig: async (config) => {
                // Atualização otimista (Optimistic Update)
                set((state) => ({ ...state, ...config }));

                try {
                    // Salva no Firestore
                    await OrganizationService.saveSettings(config);
                } catch (error) {
                    console.error('Erro ao salvar no Firebase:', error);
                    set({ error: 'Erro ao salvar alterações na nuvem.' });
                    // Opcional: Reverter estado em caso de erro crítico
                }
            },

            resetToDefaults: () => {
                const defaults = {
                    companyName: 'Minha Empresa',
                    logoUrl: null,
                    primaryColor: DEFAULT_PRIMARY_COLOR
                };
                set(defaults);
                OrganizationService.saveSettings(defaults).catch(console.error);
            }
        }),
        {
            name: 'nobrehub-organization-storage',
            partialize: (state) => ({
                // Persist apenas os dados, não o estado de loading/erro
                companyName: state.companyName,
                logoUrl: state.logoUrl,
                primaryColor: state.primaryColor
            }),
        }
    )
);
