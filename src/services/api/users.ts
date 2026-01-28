// Users API
import { supabase, toCamelCase } from './utils';
import type { User } from '../../types/models';
import { SECTORS } from '../../config/permissions';

export interface UserWithLeadCount extends User {
    leadCount: number;
}

export interface SectorUsers {
    sectorId: string;
    sectorLabel: string;
    totalLeads: number;
    users: UserWithLeadCount[];
}

export async function supabaseGetUsers(): Promise<User[]> {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active, avatar, max_concurrent_chats, current_chat_count')
        .order('name');

    if (error) throw new Error(error.message);
    return (data || []).map(toCamelCase);
}

export async function supabaseGetUser(id: string): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active, avatar')
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return toCamelCase(data);
}

export async function supabaseGetAvailableAgents(pipeline?: string): Promise<User[]> {
    let query = supabase
        .from('users')
        .select('id, name, avatar, role, current_chat_count, max_concurrent_chats')
        .eq('is_active', true);

    if (pipeline) {
        query = query.eq('pipeline_type', pipeline);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data || [])
        .filter((u: any) => (u.current_chat_count || 0) < (u.max_concurrent_chats || 5))
        .map(toCamelCase);
}

// Get users grouped by sector with lead counts
export async function getUsersBySector(): Promise<SectorUsers[]> {
    // Fetch all active users
    const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, role, pipeline_type, is_active, avatar')
        .eq('is_active', true)
        .order('name');

    if (usersError) throw new Error(usersError.message);
    const users = (usersData || []).map(toCamelCase) as User[];

    // Fetch lead counts per user (assigned_to)
    const { data: leadCounts, error: leadError } = await supabase
        .from('leads')
        .select('assigned_to')
        .not('assigned_to', 'is', null);

    if (leadError) throw new Error(leadError.message);

    // Count leads per user
    const countMap: Record<string, number> = {};
    (leadCounts || []).forEach((l: any) => {
        countMap[l.assigned_to] = (countMap[l.assigned_to] || 0) + 1;
    });

    // Group users by sector
    const result: SectorUsers[] = SECTORS.map(sector => {
        const sectorUsers = users.filter(u => sector.roles.includes(u.role || ''));
        const usersWithCount: UserWithLeadCount[] = sectorUsers.map(u => ({
            ...u,
            leadCount: countMap[u.id] || 0
        }));
        const totalLeads = usersWithCount.reduce((sum, u) => sum + u.leadCount, 0);

        return {
            sectorId: sector.id,
            sectorLabel: sector.label,
            totalLeads,
            users: usersWithCount
        };
    });

    return result;
}
