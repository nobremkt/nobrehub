// Dashboard Stats API
import { supabase } from './utils';
import type { DashboardStats } from '../../types/models';

export async function supabaseGetDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, name, pipeline, status_ht, status_lt, status_production, status_post_sales, estimated_value, created_at, updated_at');

    if (error) throw new Error(error.message);

    const allLeads = leads || [];
    const totalLeads = allLeads.length;
    const leadsToday = allLeads.filter(l => new Date(l.created_at) >= today).length;

    const closedLeadsList = allLeads.filter(l =>
        l.status_ht === 'fechado' || l.status_lt === 'pago' ||
        l.status_production === 'entregue' || l.status_post_sales === 'concluido'
    );

    const closedLeads = closedLeadsList.length;

    const totalValue = allLeads.reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0);

    const htLeads = allLeads.filter(l => l.pipeline === 'high_ticket');
    const ltLeads = allLeads.filter(l => l.pipeline === 'low_ticket');

    const htStatusMap = new Map<string, { count: number; value: number }>();
    htLeads.forEach(l => {
        const status = l.status_ht || 'novo';
        const current = htStatusMap.get(status) || { count: 0, value: 0 };
        htStatusMap.set(status, {
            count: current.count + 1,
            value: current.value + (Number(l.estimated_value) || 0)
        });
    });

    const ltStatusMap = new Map<string, { count: number; value: number }>();
    ltLeads.forEach(l => {
        const status = l.status_lt || 'lead';
        const current = ltStatusMap.get(status) || { count: 0, value: 0 };
        ltStatusMap.set(status, {
            count: current.count + 1,
            value: current.value + (Number(l.estimated_value) || 0)
        });
    });

    // Recent Sales Logic: Sort closed leads by updated_at descending
    const recentSales = closedLeadsList
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10)
        .map(l => ({
            id: l.id,
            name: l.name,
            value: Number(l.estimated_value) || 0,
            status: l.status_ht === 'fechado' ? 'High Ticket' :
                l.status_lt === 'pago' ? 'Low Ticket' :
                    l.status_production === 'entregue' ? 'Produção' : 'Pós-Venda',
            date: l.updated_at,
            pipeline: l.pipeline
        }));

    return {
        totalLeads,
        leadsToday,
        closedLeads,
        totalValue,
        highTicket: Array.from(htStatusMap.entries()).map(([status, data]) => ({ status, ...data })),
        lowTicket: Array.from(ltStatusMap.entries()).map(([status, data]) => ({ status, ...data })),
        recentSales
    };
}

