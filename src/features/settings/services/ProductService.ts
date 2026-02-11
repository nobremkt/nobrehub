/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - PRODUCT SERVICE (Supabase)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/config/supabase';
import { Product } from '../types';

export const ProductService = {
    /**
     * Lista todos os produtos
     */
    getProducts: async (): Promise<Product[]> => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data ?? []).map(row => ({
            id: row.id,
            name: row.name,
            category: (row as any).category || '',
            points: row.base_points ?? 0,
            active: row.active ?? true,
            createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            updatedAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        })) as Product[];
    },

    /**
     * Cria um novo produto
     */
    createProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        const { data, error } = await supabase
            .from('products')
            .insert({
                name: product.name,
                base_points: product.points ?? 0,
                active: product.active ?? true,
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    },

    /**
     * Atualiza um produto existente
     */
    updateProduct: async (id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> => {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.active !== undefined) dbUpdates.active = updates.active;
        if (updates.points !== undefined) dbUpdates.base_points = updates.points;
        if ((updates as any).basePoints !== undefined) dbUpdates.base_points = (updates as any).basePoints;

        const { error } = await supabase
            .from('products')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Remove (ou arquiva) um produto
     */
    deleteProduct: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
