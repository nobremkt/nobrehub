import { supabase } from '@/config/supabase';

export interface OrganizationSettings {
    companyName: string;
    logoUrl: string | null;
    primaryColor: string;
}

export const OrganizationService = {
    /**
     * Busca as configurações da organização no Supabase.
     */
    getSettings: async (): Promise<OrganizationSettings | null> => {
        try {
            const { data, error } = await supabase
                .from('organization_settings')
                .select('*')
                .limit(1)
                .single();

            if (error) {
                // PGRST116 = no rows found
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return {
                companyName: data.company_name,
                logoUrl: data.logo_url,
                primaryColor: data.primary_color
            };
        } catch (error) {
            console.error('Erro ao buscar configurações da organização:', error);
            throw error;
        }
    },

    /**
     * Salva as configurações da organização no Supabase.
     * Usa upsert para criar se não existir ou atualizar se já existir.
     */
    saveSettings: async (settings: Partial<OrganizationSettings>) => {
        try {
            // First try to get the existing row
            const { data: existing } = await supabase
                .from('organization_settings')
                .select('id')
                .limit(1)
                .single();

            const payload: Record<string, unknown> = {
                updated_at: new Date().toISOString()
            };
            if (settings.companyName !== undefined) payload.company_name = settings.companyName;
            if (settings.logoUrl !== undefined) payload.logo_url = settings.logoUrl;
            if (settings.primaryColor !== undefined) payload.primary_color = settings.primaryColor;

            if (existing) {
                // Update existing row
                const { error } = await supabase
                    .from('organization_settings')
                    .update(payload)
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                // Insert new row
                const { error } = await supabase
                    .from('organization_settings')
                    .insert({
                        company_name: settings.companyName || '',
                        logo_url: settings.logoUrl || null,
                        primary_color: settings.primaryColor || '#dc2626',
                        ...payload
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Erro ao salvar configurações da organização:', error);
            throw error;
        }
    }
};
