/**
 * Shared lead/conversation distribution helper.
 * Uses settings.key = 'leadDistribution' with shape:
 * { enabled: boolean, mode: 'auto' | 'manual', participants: string[] }
 */

async function getDistributionSettings(supabase) {
    const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'leadDistribution')
        .maybeSingle();

    const raw = data?.value;
    if (!raw) return { enabled: false, mode: 'manual', participants: [] };

    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return { enabled: false, mode: 'manual', participants: [] };
        }
    }

    return raw;
}

async function getActiveSalesRoleIds(supabase) {
    const { data } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'Vendedor(a)');

    return (data || []).map((r) => r.id);
}

async function getCandidateUsers(supabase, participants = []) {
    // If participants were configured, prioritize them.
    if (Array.isArray(participants) && participants.length > 0) {
        const { data } = await supabase
            .from('users')
            .select('id, name')
            .in('id', participants)
            .eq('active', true);

        return (data || []).map((u) => ({ id: u.id, name: u.name || '' }));
    }

    // Fallback: auto-discover active users in "Vendedor(a)" role.
    const roleIds = await getActiveSalesRoleIds(supabase);
    if (roleIds.length === 0) return [];

    const { data } = await supabase
        .from('users')
        .select('id, name')
        .in('role_id', roleIds)
        .eq('active', true);

    return (data || []).map((u) => ({ id: u.id, name: u.name || '' }));
}

/**
 * Returns the least-loaded assignee id or null.
 * Load metric: number of open conversations (status != 'closed').
 */
export async function getLeastLoadedAssignee(supabase, logPrefix = '[Distribution]') {
    const settings = await getDistributionSettings(supabase);
    if (!settings?.enabled) {
        console.log(`${logPrefix} Distribution disabled, skipping auto-assign`);
        return null;
    }

    const candidates = await getCandidateUsers(supabase, settings.participants);
    if (!candidates.length) {
        console.log(`${logPrefix} No active candidates found for distribution`);
        return null;
    }

    const candidateIds = candidates.map((c) => c.id);

    const { data: openConvs } = await supabase
        .from('conversations')
        .select('assigned_to')
        .neq('status', 'closed')
        .in('assigned_to', candidateIds);

    const counts = {};
    for (const c of candidates) counts[c.id] = 0;

    (openConvs || []).forEach((row) => {
        if (row.assigned_to && counts[row.assigned_to] !== undefined) {
            counts[row.assigned_to] += 1;
        }
    });

    const ranked = candidates
        .map((u) => ({ id: u.id, name: u.name, count: counts[u.id] || 0 }))
        .sort((a, b) => a.count - b.count || a.id.localeCompare(b.id));

    const chosen = ranked[0];
    console.log(`${logPrefix} assigning to ${chosen.name || chosen.id} (${chosen.count} open)`);
    return chosen.id;
}

