/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - useTypingIndicator Hook
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Hook que expõe:
 *   - typingUsers: string[] (nomes dos usuários digitando)
 *   - handleTyping(): void (chamar no onChange do input)
 *   - stopTyping(): void (chamar no envio da mensagem)
 *
 * Lógica: keystroke + debounce de 2s.
 * Quando o usuário digita, marca typing=true no RTDB.
 * Após 2s sem digitar, marca typing=false.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { TypingService, TypingUser } from '../services/TypingService';
import { useAuthStore } from '@/stores';

const TYPING_DEBOUNCE_MS = 2000;

interface UseTypingIndicatorReturn {
    /** Names of users currently typing (excludes current user) */
    typingUsers: string[];
    /** Call this on every keystroke in the chat input */
    handleTyping: () => void;
    /** Call this when the message is sent to immediately clear typing */
    stopTyping: () => void;
}

export function useTypingIndicator(chatId: string | null): UseTypingIndicatorReturn {
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);
    const user = useAuthStore((s) => s.user);

    // Subscribe to typing users from other people in this chat
    useEffect(() => {
        if (!chatId || !user?.id) {
            setTypingUsers([]);
            return;
        }

        const unsubscribe = TypingService.subscribeToTyping(
            chatId,
            user.id,
            (users: TypingUser[]) => {
                setTypingUsers(users.map((u) => u.name));
            }
        );

        return () => {
            unsubscribe();
            setTypingUsers([]);
        };
    }, [chatId, user?.id]);

    // Cleanup on unmount: stop typing and clear timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (chatId && user?.id && isTypingRef.current) {
                TypingService.stopTyping(chatId, user.id).catch(() => { });
                isTypingRef.current = false;
            }
        };
    }, [chatId, user?.id]);

    const handleTyping = useCallback(() => {
        if (!chatId || !user?.id || !user?.name) return;

        // Start typing if not already
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            TypingService.startTyping(chatId, user.id, user.name).catch(console.error);
        } else {
            // Refresh timestamp so entry doesn't go stale
            TypingService.startTyping(chatId, user.id, user.name).catch(console.error);
        }

        // Reset the debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            if (chatId && user?.id) {
                TypingService.stopTyping(chatId, user.id).catch(console.error);
                isTypingRef.current = false;
            }
        }, TYPING_DEBOUNCE_MS);
    }, [chatId, user?.id, user?.name]);

    const stopTyping = useCallback(() => {
        if (!chatId || !user?.id) return;

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        if (isTypingRef.current) {
            TypingService.stopTyping(chatId, user.id).catch(console.error);
            isTypingRef.current = false;
        }
    }, [chatId, user?.id]);

    return { typingUsers, handleTyping, stopTyping };
}
