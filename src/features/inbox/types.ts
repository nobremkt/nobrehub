export interface Conversation {
    id: string;
    leadId: string;
    leadName: string;
    leadPhone: string;
    leadEmail?: string;
    leadCompany?: string;
    leadAvatar?: string;
    tags?: string[];
    notes?: string;
    lastMessage?: Message;
    unreadCount: number;
    assignedTo?: string; // userId
    channel: 'whatsapp' | 'internal';
    status: 'open' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    type: 'text' | 'audio' | 'image' | 'document' | 'video';
    direction: 'in' | 'out';
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    senderId?: string; // userId if direction is out
    mediaUrl?: string;
    mediaName?: string;
    scheduledFor?: Date;
    createdAt: Date;
}

export interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string; // 'saudacao', 'followup', 'fechamento', etc.
    isActive: boolean;
}

export interface SearchFilters {
    status: 'all' | 'unread' | 'mine';
    query: string;
}
