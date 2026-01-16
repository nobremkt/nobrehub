import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { Dialog360Service } from './dialog360.js';

const dialog360 = new Dialog360Service();

let io: Server | null = null;

// Global type definition for io
declare global {
    var ioInstance: Server | null;
}

// Connected agents mapped by their user ID
const connectedAgents = new Map<string, Socket>();

const INSTANCE_ID = Math.random().toString(36).substring(7);
console.log(`🔌 [socketService] Module Loaded. Instance ID: ${INSTANCE_ID}`);

export function initializeSocketService(httpServer: HttpServer): Server {
    console.log(`🔌 [socketService] Initializing on Instance: ${INSTANCE_ID}`);
    const newIo = new Server(httpServer, {
        cors: {
            origin: "*", // DEBUG: Allow all origins to rule out CORS issues
            methods: ['GET', 'POST'],
            credentials: true
        },
        // Stability settings to reduce connection flapping
        pingTimeout: 60000,      // Wait 60s for pong before marking disconnected
        pingInterval: 25000,     // Send ping every 25s
        transports: ['websocket', 'polling'],
        allowUpgrades: true,
        perMessageDeflate: false // Disable compression for faster processing
    });

    global.ioInstance = newIo; // Store in global
    io = newIo; // Keep local ref for compatibility

    newIo.on('connection', (socket: Socket) => {
        console.log('🔌 Socket connected:', socket.id);

        // Agent joins with their user ID
        socket.on('agent:join', async (userId: string) => {
            try {
                // Update user as online
                await prisma.user.update({
                    where: { id: userId },
                    data: { isOnline: true }
                });

                connectedAgents.set(userId, socket);
                socket.data.userId = userId;

                console.log(`✅ Agent ${userId} is now online`);

                // Notify others that agent is online
                getIo()?.emit('agent:status', { userId, isOnline: true });
            } catch (error) {
                console.error('Error joining agent:', error);
            }
        });

        // Agent requests their conversations
        socket.on('conversations:list', async (userId: string) => {
            try {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (!user) return;

                const conversations = await prisma.conversation.findMany({
                    where: user.role === 'admin'
                        ? { status: { not: 'closed' } }
                        : {
                            OR: [
                                { assignedAgentId: userId },
                                { assignedAgentId: null }
                            ],
                            status: { not: 'closed' }
                        },
                    include: {
                        lead: { select: { id: true, name: true, phone: true, company: true } },
                        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                    },
                    orderBy: { lastMessageAt: 'desc' }
                });

                socket.emit('conversations:data', conversations);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        });

        // Listen for new messages from agents
        socket.on('message:send', async (data: { conversationId: string; text: string; userId: string }) => {
            try {
                const { conversationId, text, userId } = data;

                // Get conversation to find the phone number
                const conversation = await prisma.conversation.findUnique({
                    where: { id: conversationId },
                    include: { lead: true }
                });

                if (!conversation) return;

                // Create message in database
                const message = await prisma.message.create({
                    data: {
                        conversationId,
                        leadId: conversation.leadId,
                        phone: conversation.lead.phone,
                        direction: 'out',
                        type: 'text',
                        text,
                        status: 'pending',
                        sentByUserId: userId
                    }
                });

                // Update conversation last message time AND auto-assign if needed
                const updateData: any = { lastMessageAt: new Date() };

                // Auto-assign if currently unassigned
                if (!conversation.assignedAgentId) {
                    updateData.assignedAgentId = userId;
                    updateData.status = 'active';
                }

                const updatedConversation = await prisma.conversation.update({
                    where: { id: conversationId },
                    data: updateData,
                    include: {
                        lead: { select: { id: true, name: true, phone: true, company: true } },
                        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
                    }
                });

                // Notify about assignment change if it happened
                if (!conversation.assignedAgentId) {
                    emitConversationUpdated(updatedConversation);
                    // Also emit specific assignment event
                    const agentSocket = connectedAgents.get(userId);
                    if (agentSocket) {
                        agentSocket.emit('conversation:assigned', updatedConversation);
                    }
                }

                // Broadcast to conversation participants
                getIo()?.emit(`conversation:${conversationId}:message`, message);

                // Send via WhatsApp API
                try {
                    const waResponse = await dialog360.sendMessage({
                        to: conversation.lead.phone,
                        text
                    });
                    console.log('📤 Sent to WhatsApp:', waResponse.messages?.[0]?.id);

                    // Update message status to sent
                    await prisma.message.update({
                        where: { id: message.id },
                        data: {
                            status: 'sent',
                            waMessageId: waResponse.messages?.[0]?.id
                        }
                    });
                } catch (waError) {
                    console.error('❌ Failed to send to WhatsApp:', waError);
                    await prisma.message.update({
                        where: { id: message.id },
                        data: { status: 'failed' }
                    });
                }

            } catch (error) {
                console.error('Error sending message:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            const userId = socket.data.userId;
            if (userId) {
                try {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { isOnline: false }
                    });
                    connectedAgents.delete(userId);
                    getIo()?.emit('agent:status', { userId, isOnline: false });
                    console.log(`❌ Agent ${userId} disconnected`);
                } catch (error) {
                    console.error('Error on disconnect:', error);
                }
            }
        });
    });

    return newIo;
}

// Helper getter - Critical for Singleton
function getIo(): Server | null {
    return global.ioInstance || io;
}

// Emit a new message event to all connected clients in a conversation
export function emitNewMessage(conversationId: string, message: any) {
    const serverVar = getIo();
    if (!serverVar) {
        console.error(`❌ [socketService ${INSTANCE_ID}] Socket IO is not initialized during emitNewMessage`);
    } else {
        console.log(`📣 [socketService ${INSTANCE_ID}] Emitting message to conversation:${conversationId}:message`);
        serverVar.emit(`conversation:${conversationId}:message`, message);
    }
}

// Emit conversation assignment to the agent
export function emitConversationAssigned(agentId: string, conversation: any) {
    const agentSocket = connectedAgents.get(agentId);
    if (agentSocket) {
        agentSocket.emit('conversation:assigned', conversation);
    }
}

// Emitting conversation updated event
export function emitConversationUpdated(conversation: any) {
    console.log('📣 Emitting conversation:updated event');
    getIo()?.emit('conversation:updated', conversation);
}

// Emit to all admins about new queued conversation
export function emitQueueUpdate(queueItem: any) {
    getIo()?.emit('queue:update', queueItem);
}

// Emit when a new lead is created
export function emitNewLead(lead: any) {
    console.log('📣 Emitting lead:new event for:', lead.name);
    getIo()?.emit('lead:new', lead);
}

// Emit when a lead is updated
export function emitLeadUpdated(lead: any) {
    console.log('📣 Emitting lead:updated event for:', lead.name);
    getIo()?.emit('lead:updated', lead);
}

// Emit when a new conversation is created
export function emitNewConversation(conversation: any) {
    console.log('📣 Emitting conversation:new event');
    getIo()?.emit('conversation:new', conversation);
}

// Get the Socket.io server instance
export function getSocketServer(): Server | null {
    return getIo();
}
