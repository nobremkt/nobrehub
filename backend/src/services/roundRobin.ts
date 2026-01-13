import prisma from '../lib/prisma.js';

interface AssignmentResult {
    leadId: string;
    assignedTo: string;
    assignedUserName: string;
    pipeline: string;
}

/**
 * Round Robin Lead Distribution
 * 
 * Balances leads among closers based on:
 * 1. Pipeline type (high_ticket → closer_ht, low_ticket → closer_lt)
 * 2. Number of leads assigned TODAY (less = priority)
 * 3. User is active
 */
export async function assignLeadRoundRobin(leadId: string): Promise<AssignmentResult | null> {
    // Get the lead
    const lead = await prisma.lead.findUnique({
        where: { id: leadId }
    });

    if (!lead) {
        throw new Error('Lead não encontrado');
    }

    if (lead.assignedTo) {
        throw new Error('Lead já está atribuído');
    }

    // Determine which role to assign based on pipeline
    const targetRole = lead.pipeline === 'high_ticket' ? 'closer_ht' : 'closer_lt';

    // Get start of today for counting
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the closer with the fewest leads assigned today
    const closers = await prisma.user.findMany({
        where: {
            role: targetRole,
            isActive: true
        },
        include: {
            assignedLeads: {
                where: {
                    assignedAt: {
                        gte: today
                    }
                },
                select: { id: true }
            }
        }
    });

    if (closers.length === 0) {
        throw new Error(`Nenhum ${targetRole} ativo encontrado`);
    }

    // Sort by number of assignments today (ascending)
    closers.sort((a, b) => a.assignedLeads.length - b.assignedLeads.length);

    // Get the first one (least assigned)
    const selectedCloser = closers[0];

    // Assign the lead
    const updatedLead = await prisma.lead.update({
        where: { id: leadId },
        data: {
            assignedTo: selectedCloser.id,
            assignedAt: new Date(),
            // Also update status to next step
            ...(lead.pipeline === 'high_ticket'
                ? { statusHT: 'qualificado' }
                : { statusLT: 'atribuido' }
            )
        }
    });

    // Log the assignment interaction
    await prisma.interaction.create({
        data: {
            leadId: leadId,
            type: 'assignment',
            content: `Lead atribuído automaticamente (Round Robin) para ${selectedCloser.name}`,
            metadata: {
                method: 'round_robin',
                closerId: selectedCloser.id,
                closerName: selectedCloser.name,
                leadsAssignedToday: selectedCloser.assignedLeads.length + 1
            }
        }
    });

    return {
        leadId: updatedLead.id,
        assignedTo: selectedCloser.id,
        assignedUserName: selectedCloser.name,
        pipeline: lead.pipeline
    };
}

/**
 * Get Round Robin Stats
 * Shows distribution of leads among closers today
 */
export async function getRoundRobinStats(pipeline: 'high_ticket' | 'low_ticket') {
    const targetRole = pipeline === 'high_ticket' ? 'closer_ht' : 'closer_lt';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closers = await prisma.user.findMany({
        where: {
            role: targetRole,
            isActive: true
        },
        select: {
            id: true,
            name: true,
            assignedLeads: {
                where: {
                    assignedAt: {
                        gte: today
                    }
                },
                select: { id: true }
            }
        }
    });

    return closers.map(c => ({
        id: c.id,
        name: c.name,
        leadsToday: c.assignedLeads.length
    })).sort((a, b) => b.leadsToday - a.leadsToday);
}

/**
 * Auto-assign all unassigned leads in a pipeline
 * Useful for batch processing
 */
export async function autoAssignAllUnassigned(pipeline: 'high_ticket' | 'low_ticket') {
    const statusField = pipeline === 'high_ticket' ? 'statusHT' : 'statusLT';
    const newStatus = pipeline === 'high_ticket' ? 'novo' : 'novo';

    // Find all unassigned leads
    const unassignedLeads = await prisma.lead.findMany({
        where: {
            pipeline,
            assignedTo: null,
            [statusField]: newStatus
        },
        orderBy: { createdAt: 'asc' }
    });

    const results = [];
    for (const lead of unassignedLeads) {
        try {
            const result = await assignLeadRoundRobin(lead.id);
            if (result) {
                results.push(result);
            }
        } catch (error: any) {
            console.error(`Failed to assign lead ${lead.id}:`, error.message);
        }
    }

    return {
        total: unassignedLeads.length,
        assigned: results.length,
        results
    };
}
