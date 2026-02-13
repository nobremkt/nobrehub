export type DealStatus = 'open' | 'won' | 'lost';
export type ConversationContext = 'sales' | 'post_sales';

/** WhatsApp API template component (body, header, button) with parameters */
export interface TemplateComponent {
    type: 'body' | 'header' | 'button';
    parameters: { type: string; text?: string; image?: { link: string } }[];
    sub_type?: string;
    index?: number;
}

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
    assignedTo?: string; // userId (vendedor ou pós-vendedor)
    channel: 'whatsapp' | 'internal';
    status: 'open' | 'closed';
    // Context (sales or post_sales)
    context?: ConversationContext;
    postSalesId?: string; // userId do pós-vendedor atribuído
    // Deal/Negócio fields
    pipeline?: string;
    stage?: string;
    dealStatus?: DealStatus;
    lossReason?: string;
    // Quick actions
    isFavorite?: boolean;
    isPinned?: boolean;
    isBlocked?: boolean;
    isArchived?: boolean;
    // Campos de Contato — synced via updateConversationDetails → leads table
    // NOTE: These fields are NOT stored in the `conversations` table.
    // They come from the `leads` table via JOIN or are used only in the ProfilePanel UI.
    birthday?: string;
    position?: string;
    instagram?: string;
    utmSource?: string;
    // Campos de Empresa — synced via updateConversationDetails → leads table
    segment?: string;
    employees?: string;
    revenue?: string;
    website?: string;
    profilePicUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    conversationId: string;
    content: string;
    type: 'text' | 'audio' | 'image' | 'document' | 'video' | 'system';
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
    status: 'all' | 'mine' | 'unassigned';
    query: string;
}
