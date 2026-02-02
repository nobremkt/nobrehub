import { useEffect } from 'react';
import { useTeamChatStore } from '../stores/useTeamChatStore';
import { useAuthStore } from '@/stores/useAuthStore';

import { useCollaboratorStore } from '@/features/settings/stores/useCollaboratorStore';

export const TeamChatListener = () => {
    const { user } = useAuthStore();
    const { init, cleanup } = useTeamChatStore();
    const { fetchCollaborators } = useCollaboratorStore();

    useEffect(() => {
        // Request permission on mount


        // Also fetch collaborators globally as they are needed for chat names/details
        fetchCollaborators();
    }, [fetchCollaborators]);

    useEffect(() => {
        const userId = user?.authUid || user?.id;
        if (userId) {
            init(userId);
        } else {
            cleanup();
        }
    }, [user, init, cleanup]);

    return null;
};
