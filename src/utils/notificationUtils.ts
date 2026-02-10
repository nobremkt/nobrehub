// Sound file paths
const MESSAGE_SOUND_URL = '/sounds/ui/mensagem.mp3';
const NOTIFICATION_SOUND_URL = '/sounds/ui/notification.mp3';

/**
 * Toca o som de mensagem (para TeamChat).
 */
export const playMessageSound = () => {
    try {
        const audio = new Audio(MESSAGE_SOUND_URL);
        audio.volume = 0.5;
        audio.play().catch(e => {
            console.warn("Could not play message sound (autoplay blocked?):", e);
        });
    } catch (e) {
        console.error("Error initializing message audio:", e);
    }
};

/**
 * Toca o som de notificação (para projetos, leads, metas, etc).
 * NÃO usar para mensagens de chat — essas já têm playMessageSound().
 */
export const playNotificationSound = () => {
    try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = 0.6;
        audio.play().catch(e => {
            console.warn("Could not play notification sound (autoplay blocked?):", e);
        });
    } catch (e) {
        console.error("Error initializing notification audio:", e);
    }
};
