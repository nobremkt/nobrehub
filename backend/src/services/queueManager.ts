import { PrismaClient, PipelineType, QueueStatus, ConversationStatus } from '@prisma/client';
import { emitConversationAssigned, emitQueueUpdate } from './socketService';

const prisma = new PrismaClient();

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
        await prisma.lead.update({
            where: { id: conversation.leadId },
            data: {
                pipeline: 'post_sales',
                statusPostSales: 'novo',
                statusHT: null,
                statusLT: null
            }
        });
    }

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

    const oldAgentId = conversation.assignedAgentId;

    // Update conversation with new agent
    const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: { assignedAgentId: newAgentId },
        include: {
            lead: { select: { id: true, name: true, phone: true, company: true } },
            assignedAgent: { select: { id: true, name: true } }
        }
    });

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
