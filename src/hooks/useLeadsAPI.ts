import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

// Normalized Lead type for frontend compatibility
export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    source: string;
    pipeline: 'high_ticket' | 'low_ticket';
    status: string; // Normalized status field
    assignedTo: string;
    value: number; // Normalized from estimatedValue
    tags: string[];
    notes: string;
    createdAt: string;
    updatedAt: string;
}

// Adapter function to normalize API Lead to frontend Lead
function normalizeApiLead(apiLead: api.Lead): Lead {
    const status = apiLead.pipeline === 'high_ticket'
        ? (apiLead.statusHT || 'novo')
        : (apiLead.statusLT || 'novo');

    return {
        id: apiLead.id,
        name: apiLead.name,
        email: apiLead.email || '',
        phone: apiLead.phone,
        company: apiLead.company || '',
        source: apiLead.source,
        pipeline: apiLead.pipeline,
        status,
        assignedTo: apiLead.assignedUser?.name || apiLead.assignedTo || '',
        value: apiLead.estimatedValue,
        tags: apiLead.tags,
        notes: apiLead.notes || '',
        createdAt: apiLead.createdAt,
        updatedAt: apiLead.updatedAt,
    };
}

interface UseLeadsReturn {
    leads: Lead[];
    loading: boolean;
    error: string | null;
    addLead: (data: api.CreateLeadData) => Promise<Lead>;
    updateLead: (id: string, data: Partial<api.CreateLeadData>) => Promise<Lead>;
    deleteLead: (id: string) => Promise<void>;
    updateLeadStatus: (id: string, status: string) => Promise<Lead>;
    assignLead: (id: string, userId: string) => Promise<Lead>;
    refetch: () => Promise<void>;
}

export function useLeadsAPI(filters?: { pipeline?: string; status?: string }): UseLeadsReturn {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.getLeads(filters);
            setLeads(data.map(normalizeApiLead));
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar leads');
        } finally {
            setLoading(false);
        }
    }, [filters?.pipeline, filters?.status]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const addLead = useCallback(async (data: api.CreateLeadData): Promise<Lead> => {
        const newLead = await api.createLead(data);
        const normalized = normalizeApiLead(newLead);
        setLeads(prev => [normalized, ...prev]);
        return normalized;
    }, []);

    const updateLead = useCallback(async (id: string, data: Partial<api.CreateLeadData>): Promise<Lead> => {
        const updated = await api.updateLead(id, data);
        const normalized = normalizeApiLead(updated);
        setLeads(prev => prev.map(l => l.id === id ? normalized : l));
        return normalized;
    }, []);

    const deleteLead = useCallback(async (id: string): Promise<void> => {
        await api.deleteLead(id);
        setLeads(prev => prev.filter(l => l.id !== id));
    }, []);

    const updateLeadStatus = useCallback(async (id: string, status: string): Promise<Lead> => {
        const updated = await api.updateLeadStatus(id, status);
        const normalized = normalizeApiLead(updated);
        setLeads(prev => prev.map(l => l.id === id ? normalized : l));
        return normalized;
    }, []);

    const assignLead = useCallback(async (id: string, userId: string): Promise<Lead> => {
        const updated = await api.assignLead(id, userId);
        const normalized = normalizeApiLead(updated);
        setLeads(prev => prev.map(l => l.id === id ? normalized : l));
        return normalized;
    }, []);

    return {
        leads,
        loading,
        error,
        addLead,
        updateLead,
        deleteLead,
        updateLeadStatus,
        assignLead,
        refetch: fetchLeads,
    };
}

// Alias for backward compatibility
export const useLeads = useLeadsAPI;
