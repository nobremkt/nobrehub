import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Dialog360Service } from './dialog360.js';

const prisma = new PrismaClient();
const dialog360 = new Dialog360Service();

let io: Server | null = null;

// Connected agents mapped by their user ID
const connectedAgents = new Map<string, Socket>();

export function initializeSocketService(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket: Socket) => {
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
                io?.emit('agent:status', { userId, isOnline: true });
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
                        : { assignedAgentId: userId, status: { not: 'closed' } },
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

                // Update conversation last message time
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { lastMessageAt: new Date() }
                });

                // Broadcast to conversation participants
                io?.emit(`conversation:${conversationId}:message`, message);

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
                    io?.emit('agent:status', { userId, isOnline: false });
                    console.log(`❌ Agent ${userId} disconnected`);
                } catch (error) {
                    console.error('Error on disconnect:', error);
                }
            }
        });
    });

    return io;
}

// Emit a new message event to all connected clients in a conversation
export function emitNewMessage(conversationId: string, message: any) {
    io?.emit(`conversation:${conversationId}:message`, message);
}

// Emit conversation assignment to the agent
export function emitConversationAssigned(agentId: string, conversation: any) {
    const agentSocket = connectedAgents.get(agentId);
    if (agentSocket) {
        agentSocket.emit('conversation:assigned', conversation);
    }
}

// Emit to all admins about new queued conversation
export function emitQueueUpdate(queueItem: any) {
    io?.emit('queue:update', queueItem);
}

// NEW: Emit when a new lead is created (for real-time lead list updates)
export function emitNewLead(lead: any) {
    console.log('📣 Emitting lead:new event for:', lead.name);
    io?.emit('lead:new', lead);
}

// NEW: Emit when a lead is updated (status change, pipeline move, etc.)
export function emitLeadUpdated(lead: any) {
    console.log('📣 Emitting lead:updated event for:', lead.name);
    io?.emit('lead:updated', lead);
}

// NEW: Emit when a new conversation is created (for real-time inbox updates)
export function emitNewConversation(conversation: any) {
    console.log('📣 Emitting conversation:new event');
    io?.emit('conversation:new', conversation);
}

// Get the Socket.io server instance
export function getSocketServer(): Server | null {
    return io;
}
