/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - TYPING SERVICE (Supabase Realtime Broadcast)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Serviço de indicador de digitação em tempo real usando Supabase Broadcast.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';

/** Entries older than this (ms) are considered stale and filtered out */
const STALE_THRESHOLD = 5000;

const typingChannels = new Map<string, RealtimeChannel>();
const typingChannelReady = new Map<string, Promise<void>>();

function getTypingChannel(chatId: string): { channel: RealtimeChannel; ready: Promise<void> } {
    const channelName = `typing:${chatId}`;

    const cachedChannel = typingChannels.get(channelName);
    const cachedReady = typingChannelReady.get(channelName);
    if (cachedChannel && cachedReady) {
        return { channel: cachedChannel, ready: cachedReady };
    }

    const channel = supabase.channel(channelName);
    const ready = new Promise<void>((resolve, reject) => {
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') resolve();
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                reject(new Error(`Typing channel failed: ${status}`));
            }
        });
    });

    typingChannels.set(channelName, channel);
    typingChannelReady.set(channelName, ready);

    return { channel, ready };
}

export interface TypingUser {
    userId: string;
    name: string;
    timestamp: number;
}

export const TypingService = {
    /**
     * Mark current user as typing in a chat.
     */
    async startTyping(chatId: string, userId: string, displayName: string): Promise<void> {
        const { channel, ready } = getTypingChannel(chatId);
        await ready;

        const status = await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
                userId,
                name: displayName,
                timestamp: Date.now(),
            },
        });
        if (status !== 'ok') throw new Error(`Failed to broadcast typing: ${status}`);
    },

    /**
     * Remove current user's typing indicator.
     */
    async stopTyping(chatId: string, userId: string): Promise<void> {
        const { channel, ready } = getTypingChannel(chatId);
        await ready;

        const status = await channel.send({
            type: 'broadcast',
            event: 'stop_typing',
            payload: { userId },
        });
        if (status !== 'ok') throw new Error(`Failed to broadcast stop_typing: ${status}`);
    },

    /**
     * Subscribe to typing users in a chat.
     * Filters out the current user and stale entries.
     * Returns unsubscribe function.
     */
    subscribeToTyping(
        chatId: string,
        currentUserId: string,
        callback: (typingUsers: TypingUser[]) => void
    ): () => void {
        const usersById = new Map<string, TypingUser>();
        callback([]);

        const emit = () => {
            const now = Date.now();
            const activeUsers = Array.from(usersById.values()).filter((user) => {
                if (user.userId === currentUserId) return false;
                return now - user.timestamp <= STALE_THRESHOLD;
            });
            callback(activeUsers);
        };

        const channel = supabase
            .channel(`typing-listener:${chatId}:${currentUserId}:${Date.now()}`)
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                const entry = payload as Partial<TypingUser>;
                if (!entry.userId || !entry.name || typeof entry.timestamp !== 'number') {
                    return;
                }

                usersById.set(entry.userId, {
                    userId: entry.userId,
                    name: entry.name,
                    timestamp: entry.timestamp,
                });
                emit();
            })
            .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
                const data = payload as { userId?: string };
                if (!data.userId) return;

                usersById.delete(data.userId);
                emit();
            });

        channel.subscribe();

        const staleSweepTimer = setInterval(() => {
            const now = Date.now();
            let changed = false;

            for (const [userId, user] of usersById.entries()) {
                if (now - user.timestamp > STALE_THRESHOLD) {
                    usersById.delete(userId);
                    changed = true;
                }
            }

            if (changed) {
                emit();
            }
        }, 1000);

        return () => {
            clearInterval(staleSweepTimer);
            supabase.removeChannel(channel);
        };
    },
};
