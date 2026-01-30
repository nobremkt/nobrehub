export type ChatType = 'private' | 'group';

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface ChatParticipant {
    id: string; // Auth UID
    name: string;
    photoUrl?: string;
    email: string;
}

export interface TeamMessage {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'system';
    createdAt: number;
    readBy?: Record<string, number>; // uid -> timestamp
    attachments?: {
        url: string;
        name: string;
        type: string;
    }[];
}

export interface TeamChat {
    id: string;
    type: ChatType;
    participants: string[]; // List of UIDs
    participantDetails?: Record<string, ChatParticipant>; // Cache or eager loaded details
    name?: string; // For groups
    photoUrl?: string; // For groups
    lastMessage?: {
        content: string;
        senderId: string;
        createdAt: number;
        type: 'text' | 'image' | 'file' | 'system';
    };
    unreadCount?: number; // Calculated client-side usually
    updatedAt: number;
    createdBy?: string;
    admins?: string[];
}
