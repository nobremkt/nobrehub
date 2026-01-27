// Firebase Realtime Hooks - Index file
// Export all Firebase-based realtime hooks for easy import

export { useRealtimeMessages, useRealtimeConversations } from '../useRealtimeMessages';
export { useTypingIndicator } from '../useTypingIndicator';
export { usePresence, useUserPresence, useTeamPresence } from '../usePresence';
export { useRealtimeNotifications } from '../useRealtimeNotifications';
export { useRealtimeKanban, useRealtimeLeads, useRealtimeConversationUpdates } from '../useRealtimeKanban';

// Re-export types
export type { RealtimeMessage } from '../useRealtimeMessages';
export type { UserPresence } from '../usePresence';
export type { RealtimeNotification } from '../useRealtimeNotifications';
export type { KanbanCardUpdate, LeadUpdate } from '../useRealtimeKanban';
