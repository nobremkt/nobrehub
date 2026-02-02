import { MessageTemplate } from '../types';
import { useSettingsStore } from '../stores/useSettingsStore';

export const TemplateService = {
    getTemplates: async (): Promise<MessageTemplate[]> => {
        try {
            const { whatsapp } = useSettingsStore.getState();

            // Check if 360Dialog is configured
            if (whatsapp.provider !== '360dialog' || !whatsapp.apiKey || !whatsapp.baseUrl) {
                console.warn('360Dialog not configured, returning empty templates');
                return [];
            }

            const response = await fetch('/api/get-templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: whatsapp.apiKey,
                    baseUrl: whatsapp.baseUrl
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch templates from 360Dialog');
            }

            const data = await response.json();
            const wabaTemplates = data.waba_templates || [];

            // Filter for approved templates
            const approvedTemplates = wabaTemplates.filter((t: any) => t.status === 'approved');

            // Map to MessageTemplate
            return approvedTemplates.map((t: any) => {
                // Extract body text
                const bodyComponent = t.components.find((c: any) => c.type === 'BODY');
                const content = bodyComponent ? bodyComponent.text : '';

                return {
                    id: t.name, // WhatsApp templates use name as ID equivalent (unique per language)
                    name: t.name,
                    content: content,
                    category: t.category,
                    language: t.language,
                    components: t.components, // Keep full components for sending logic
                    createdAt: Date.now(), // 360 doesn't always return dates in list, use now
                    updatedAt: Date.now()
                } as MessageTemplate;
            });

        } catch (error) {
            console.error('Error fetching templates:', error);
            throw error;
        }
    },

    // Write methods disabled as we are sourcing from 360Dialog
    createTemplate: async () => { throw new Error('Cannot create templates locally. Use 360Dialog dashboard.'); },
    updateTemplate: async () => { throw new Error('Cannot update templates locally. Use 360Dialog dashboard.'); },
    deleteTemplate: async () => { throw new Error('Cannot delete templates locally. Use 360Dialog dashboard.'); }
};
