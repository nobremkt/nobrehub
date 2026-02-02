// Sound file path
const MESSAGE_SOUND_URL = '/sounds/ui/mensagem.mp3';

export const playMessageSound = () => {
    try {
        const audio = new Audio(MESSAGE_SOUND_URL);
        audio.volume = 0.5; // Default to 50% volume to not startle
        audio.play().catch(e => {
            console.warn("Could not play notification sound (autoplaying blocked?):", e);
        });
    } catch (e) {
        console.error("Error initializing audio:", e);
    }
};

// Deprecated/No-op functions to keep compatibility during refactor if needed,
// or strictly remove them. I'll remove the permission request to avoid unused code,
// but if the user wants strictly NO push notification, I should remove that logic.
