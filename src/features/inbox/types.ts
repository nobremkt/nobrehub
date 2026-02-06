export type DealStatus = 'open' | 'won' | 'lost';
export type ConversationContext = 'sales' | 'post_sales';

export interface Conversation {
    id: string;
    leadId: string;
    leadName: string;
    leadPhone: string;
    leadEmail?: string;
    leadCompany?: string;
    instagram?: string;
    leadAvatar?: string;
    tags?: string[];
    notes?: string;
    lastMessage?: Message;
    unreadCount: number;
    assignedTo?: string; // userId (vendedor ou pós-vendedor)
    channel: 'whatsapp' | 'internal';
    status: 'open' | 'closed';
    // Context (sales or post_sales)
    context?: ConversationContext;
    postSalesId?: string; // userId do pós-vendedor atribuído
    transferredToPostSalesAt?: Date;
    // Deal/Negócio fields
    pipeline?: string;
    stage?: string;
    dealStatus?: DealStatus;
    lossReason?: string;
    // Quick actions
    isFavorite?: boolean;
    isPinned?: boolean;
    isArchived?: boolean;
    // Campos de Contato (sincronizados com Modal360)
    birthday?: string;
    position?: string;
    utmSource?: string;
    // Campos de Empresa (sincronizados com Modal360)
    segment?: string;
    employees?: string;
    revenue?: string;
    website?: string;
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
    viewOnce?: boolean; // View once media (image/video)
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
