import { MessageTemplate } from '../types';

export const TemplateService = {
    getTemplates: async (): Promise<MessageTemplate[]> => {
        try {
            const response = await fetch('/api/get-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                console.error('[TemplateService] Failed to fetch templates:', response.status);
                return [];
            }

            const data = await response.json();

            if (data.waba_templates) {
                return data.waba_templates.map((t: any) => ({
                    id: t.id || t.name,
                    name: t.name,
                    language: t.language,
                    category: t.category,
                    components: t.components || [],
                    status: t.status,
                }));
            }

            return [];
        } catch (error) {
            console.error('[TemplateService] Error fetching templates:', error);
            return [];
        }
    },

    // Write methods disabled — templates are managed via 360Dialog dashboard
    createTemplate: async () => { throw new Error('Cannot create templates locally. Use 360Dialog dashboard.'); },
    updateTemplate: async () => { throw new Error('Cannot update templates locally. Use 360Dialog dashboard.'); },
    deleteTemplate: async () => { throw new Error('Cannot delete templates locally. Use 360Dialog dashboard.'); }
};
