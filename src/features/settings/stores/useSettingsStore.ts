import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IntegrationsState {
    whatsapp: {
        provider: 'evolution' | '360dialog' | null;
        baseUrl: string;
        apiKey: string;
    };
    setWhatsappConfig: (config: Partial<IntegrationsState['whatsapp']>) => void;
}

export const useSettingsStore = create<IntegrationsState>()(
    persist(
        (set) => ({
            whatsapp: {
                provider: 'evolution',
                baseUrl: '',
                apiKey: ''
            },
            setWhatsappConfig: (config) => set((state) => ({
                whatsapp: { ...state.whatsapp, ...config }
            }))
        }),
        {
            name: 'nobrehub-settings-storage'
        }
    )
);
