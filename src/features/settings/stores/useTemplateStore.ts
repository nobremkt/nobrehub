import { create } from 'zustand';
import { MessageTemplate } from '../types';
import { TemplateService } from '../services/TemplateService';

interface TemplateState {
    templates: MessageTemplate[];
    isLoading: boolean;
    error: string | null;
    fetchTemplates: () => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set) => ({
    templates: [],
    isLoading: false,
    error: null,

    fetchTemplates: async () => {
        set({ isLoading: true, error: null });
        try {
            const templates = await TemplateService.getTemplates();
            set({ templates, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            set({ error: 'Failed to sync templates', isLoading: false });
        }
    }
}));
