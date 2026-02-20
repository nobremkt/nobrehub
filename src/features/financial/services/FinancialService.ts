/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FINANCIAL SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * CRUD operations for financial_transactions and financial_categories.
 */

import { supabase } from '@/config/supabase';

// ─── Types ───────────────────────────────────────────────────────────

export interface FinancialCategory {
    id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string | null;
    created_at: string;
}

export interface FinancialTransaction {
    id: string;
    date: string;
    type: 'income' | 'expense';
    category_id: string | null;
    description: string | null;
    amount: number;
    payment_method: string | null;
    notes: string | null;
    is_historical: boolean;
    source_file: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    category?: FinancialCategory;
}

export interface TransactionFilters {
    type?: 'income' | 'expense';
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

// ─── Service ─────────────────────────────────────────────────────────

// Helper: Supabase generated types don't include these new tables yet.
// Use `any` cast to bypass strict table name checking until types are regenerated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string) => (supabase as any).from(table);

export const FinancialService = {
    // ── Categories ───────────────────────────────────────────────────

    async getCategories(): Promise<FinancialCategory[]> {
        const { data, error } = await from('financial_categories')
            .select('*')
            .order('type')
            .order('name');

        if (error) throw error;
        return (data || []) as FinancialCategory[];
    },

    async createCategory(category: Omit<FinancialCategory, 'id' | 'created_at'>): Promise<FinancialCategory> {
        const { data, error } = await from('financial_categories')
            .insert(category)
            .select()
            .single();

        if (error) throw error;
        return data as FinancialCategory;
    },

    async updateCategory(id: string, updates: Partial<FinancialCategory>): Promise<FinancialCategory> {
        const { data, error } = await from('financial_categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as FinancialCategory;
    },

    async deleteCategory(id: string): Promise<void> {
        const { error } = await from('financial_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ── Transactions ─────────────────────────────────────────────────

    async getTransactions(filters?: TransactionFilters): Promise<FinancialTransaction[]> {
        let query = from('financial_transactions')
            .select('*, category:financial_categories(*)')
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

        if (filters?.type) {
            query = query.eq('type', filters.type);
        }
        if (filters?.categoryId) {
            query = query.eq('category_id', filters.categoryId);
        }
        if (filters?.startDate) {
            query = query.gte('date', filters.startDate);
        }
        if (filters?.endDate) {
            query = query.lte('date', filters.endDate);
        }
        if (filters?.search) {
            query = query.ilike('description', `%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as FinancialTransaction[];
    },

    async createTransaction(transaction: {
        date: string;
        type: 'income' | 'expense';
        category_id?: string | null;
        description?: string;
        amount: number;
        payment_method?: string;
        notes?: string;
    }): Promise<FinancialTransaction> {
        const { data, error } = await from('financial_transactions')
            .insert(transaction)
            .select('*, category:financial_categories(*)')
            .single();

        if (error) throw error;
        return data as FinancialTransaction;
    },

    async updateTransaction(id: string, updates: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
        const { updated_at: _u, created_at: _c, category: _cat, ...cleanUpdates } = updates;
        const { data, error } = await from('financial_transactions')
            .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('*, category:financial_categories(*)')
            .single();

        if (error) throw error;
        return data as FinancialTransaction;
    },

    async deleteTransaction(id: string): Promise<void> {
        const { error } = await from('financial_transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ── Aggregations ─────────────────────────────────────────────────

    async getMonthlySummary(year: number, month: number): Promise<{
        totalIncome: number;
        totalExpense: number;
        balance: number;
        dailyData: { date: string; income: number; expense: number }[];
    }> {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day

        const { data, error } = await from('financial_transactions')
            .select('date, type, amount')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date');

        if (error) throw error;

        const dailyMap: Record<string, { income: number; expense: number }> = {};
        let totalIncome = 0;
        let totalExpense = 0;

        (data || []).forEach((row: { date: string; type: string; amount: number }) => {
            if (!dailyMap[row.date]) dailyMap[row.date] = { income: 0, expense: 0 };
            const amount = Number(row.amount) || 0;
            if (row.type === 'income') {
                dailyMap[row.date].income += amount;
                totalIncome += amount;
            } else {
                dailyMap[row.date].expense += amount;
                totalExpense += amount;
            }
        });

        const dailyData = Object.entries(dailyMap)
            .map(([date, vals]) => ({ date, ...vals }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            dailyData,
        };
    },
};
