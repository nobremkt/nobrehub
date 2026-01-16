import { PrismaClient, PipelineType, QueueStatus, ConversationStatus } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { emitConversationAssigned, emitQueueUpdate, emitConversationUpdated, emitLeadUpdated } from './socketService.js';


/**
 * Queue Manager Service
 * Handles the distribution of conversations to agents using Round Robin by pipeline
 */

// Add a new lead to the queue
export async function addToQueue(leadId: string, pipeline: PipelineType): Promise<any> {
    // Check if lead already has an active conversation
    const existingConversation = await prisma.conversation.findFirst({
        where: { leadId, status: { not: 'closed' } }
    });

    if (existingConversation) {
        console.log(`Lead ${leadId} already has an active conversation`);
        return existingConversation;
    }

    // Check if lead already has a waiting queue entry
    const existingQueue = await prisma.queue.findFirst({
        where: { leadId, status: 'waiting' },
        include: { lead: true }
    });

    if (existingQueue) {
        console.log(`Lead ${leadId} already in queue`);
        return existingQueue;
    }

    // Create queue entry
    const queueEntry = await prisma.queue.create({
        data: {
            leadId,
            pipeline,
            status: 'waiting'
        },
        include: { lead: true }
    });

    console.log(`📥 Lead ${leadId} added to ${pipeline} queue`);
    emitQueueUpdate(queueEntry);

    // Try to assign immediately
    await tryAssignNext(pipeline);

    return queueEntry;
}

// Try to assign the next queued item to an available agent
export async function tryAssignNext(pipeline: PipelineType): Promise<boolean> {
    // Get next waiting item in queue (FIFO)
    const nextInQueue = await prisma.queue.findFirst({
        where: { pipeline, status: 'waiting' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: { lead: true }
    });

    if (!nextInQueue) {
        console.log(`No items in ${pipeline} queue`);
        return false;
    }

    // Find available agent in this pipeline
    const availableAgent = await prisma.user.findFirst({
        where: {
            pipelineType: pipeline,
            isOnline: true,
            isActive: true,
            currentChatCount: { lt: prisma.user.fields.maxConcurrentChats }
        },
        orderBy: { currentChatCount: 'asc' } // Least loaded first
    });

    if (!availableAgent) {
        console.log(`No available agents for ${pipeline}`);
        return false;
    }

    // Create conversation and assign
    const conversation = await prisma.conversation.create({
        data: {
            leadId: nextInQueue.leadId,
            assignedAgentId: availableAgent.id,
            channel: 'whatsapp',
            status: 'active',
            pipeline,
            lastMessageAt: new Date()
        },
        include: {
            lead: { select: { id: true, name: true, phone: true, company: true } },
            assignedAgent: { select: { id: true, name: true } }
        }
    });

    // Update queue entry
    await prisma.queue.update({
        where: { id: nextInQueue.id },
        data: { status: 'assigned', assignedAt: new Date() }
    });

    // Increment agent's chat count
    await prisma.user.update({
        where: { id: availableAgent.id },
        data: { currentChatCount: { increment: 1 } }
    });

    console.log(`✅ Assigned conversation to ${availableAgent.name}`);
    emitConversationAssigned(availableAgent.id, conversation);

    return true;
}

// Close a conversation and free up agent capacity
export async function closeConversation(
    conversationId: string,
    reason: 'payment' | 'no_interest' | 'transferred' | 'resolved' | 'timeout'
): Promise<any> {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
    });

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    // Update conversation
    const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            status: 'closed',
            closedReason: reason,
            closedAt: new Date()
        }
    });

    // Decrement agent's chat count if assigned
    if (conversation.assignedAgentId) {
        await prisma.user.update({
            where: { id: conversation.assignedAgentId },
            data: { currentChatCount: { decrement: 1 } }
        });

        // Try to assign next in queue to this agent's pipeline
        await tryAssignNext(conversation.pipeline);
    }

    // If closed with payment, update lead status
    if (reason === 'payment') {
        const updatedLead = await prisma.lead.update({
            where: { id: conversation.leadId },
            data: {
                pipeline: 'post_sales',
                statusPostSales: 'novo',
                statusHT: null,
                statusLT: null
            }
        });
        emitLeadUpdated(updatedLead);
    }

    emitConversationUpdated(updated);

    return updated;
}

// Transfer conversation to another agent
export async function transferConversation(
    conversationId: string,
    newAgentId: string
): Promise<any> {
    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
    });

    if (!conversation) {
        throw new Error('Conversation not found');
    }

    const newAgent = await prisma.user.findUnique({
        where: { id: newAgentId }
    });

    if (!newAgent) {
        throw new Error('New agent not found');
    }

    const oldAgentId = conversation.assignedAgentId;
    let newPipeline = conversation.pipeline;

    // Determine new pipeline based on agent's pipelineType or role
    if (newAgent.pipelineType) {
        newPipeline = newAgent.pipelineType;
    } else if (newAgent.role === 'post_sales') {
        newPipeline = 'post_sales';
    } else if (newAgent.role === 'production' || newAgent.role === 'manager_production') {
        newPipeline = 'production';
    } else if (newAgent.role === 'closer_ht') {
        newPipeline = 'high_ticket';
    } else if (newAgent.role === 'closer_lt') {
        newPipeline = 'low_ticket';
    }

    // Update conversation with new agent and potentially new pipeline
    const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            assignedAgentId: newAgentId,
            pipeline: newPipeline
        },
        include: {
            lead: { select: { id: true, name: true, phone: true, company: true } },
            assignedAgent: { select: { id: true, name: true } }
        }
    });

    // Update Lead pipeline if it changed
    if (newPipeline !== conversation.pipeline) {
        const leadUpdateData: any = { pipeline: newPipeline };

        // Set initial status for the new pipeline
        if (newPipeline === 'post_sales') {
            leadUpdateData.statusPostSales = 'novo';
            // Optional: clear other statuses if needed, or keep them as history
            leadUpdateData.statusHT = null;
            leadUpdateData.statusLT = null;
        } else if (newPipeline === 'production') {
            leadUpdateData.statusProduction = 'backlog';
        } else if (newPipeline === 'high_ticket') {
            leadUpdateData.statusHT = 'novo';
        } else if (newPipeline === 'low_ticket') {
            leadUpdateData.statusLT = 'novo';
        }

        await prisma.lead.update({
            where: { id: conversation.leadId },
            data: leadUpdateData
        });

        // Emit lead update to frontend
        const fullLead = await prisma.lead.findUnique({ where: { id: conversation.leadId } });
        if (fullLead) emitLeadUpdated(fullLead);
    }

    // Update chat counts
    if (oldAgentId) {
        await prisma.user.update({
            where: { id: oldAgentId },
            data: { currentChatCount: { decrement: 1 } }
        });
    }

    await prisma.user.update({
        where: { id: newAgentId },
        data: { currentChatCount: { increment: 1 } }
    });

    emitConversationAssigned(newAgentId, updated);
    emitConversationUpdated(updated);

    return updated;
}

// Get queue status for a pipeline
export async function getQueueStatus(pipeline: PipelineType) {
    const waiting = await prisma.queue.count({
        where: { pipeline, status: 'waiting' }
    });

    const onlineAgents = await prisma.user.findMany({
        where: { pipelineType: pipeline, isOnline: true, isActive: true },
        select: { id: true, name: true, currentChatCount: true, maxConcurrentChats: true }
    });

    return { waiting, onlineAgents };
}
