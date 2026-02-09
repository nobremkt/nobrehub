/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - USE GOAL PROGRESS HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 * Reusable React hook that fetches goal progress for a collaborator.
 * Any component can import this to show goal bars, percentages, etc.
 */

import { useState, useEffect, useCallback } from 'react';
import { GoalTrackingService, type SectorGoalProgress } from '../services/goalTrackingService';

interface UseGoalProgressResult {
    progress: SectorGoalProgress | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export function useGoalProgress(
    collaboratorId: string | undefined,
    sectorId: string | undefined,
    isActive = true,
): UseGoalProgressResult {
    const [progress, setProgress] = useState<SectorGoalProgress | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!collaboratorId || !sectorId || !isActive) return;
        setLoading(true);
        setError(null);
        try {
            const result = await GoalTrackingService.getCollaboratorProgress(collaboratorId, sectorId);
            setProgress(result.progress);
        } catch (err) {
            console.error('Erro ao buscar progresso de metas:', err);
            setError('Erro ao carregar progresso de metas');
        } finally {
            setLoading(false);
        }
    }, [collaboratorId, sectorId, isActive]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { progress, loading, error, refresh: fetch };
}
