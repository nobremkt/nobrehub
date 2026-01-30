import { create } from 'zustand';
import { Permission } from '../types';
import { PermissionService } from '../services/PermissionService';

interface PermissionState {
    permissions: Permission[];
    isLoading: boolean;
    error: string | null;

    fetchPermissions: () => Promise<void>;
    addPermission: (permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updatePermission: (id: string, updates: Partial<Permission>) => Promise<void>;
    deletePermission: (id: string) => Promise<void>;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
    permissions: [],
    isLoading: false,
    error: null,

    fetchPermissions: async () => {
        set({ isLoading: true, error: null });
        try {
            const permissions = await PermissionService.getPermissions();
            set({ permissions });
        } catch (error) {
            console.error('Error fetching permissions:', error);
            set({ error: 'Erro ao carregar permissões.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addPermission: async (newPermission) => {
        set({ isLoading: true, error: null });
        try {
            await PermissionService.createPermission(newPermission);
            await get().fetchPermissions(); // Refresh list
        } catch (error) {
            console.error('Error adding permission:', error);
            set({ error: 'Erro ao criar permissão.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updatePermission: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await PermissionService.updatePermission(id, updates);
            // Otimista: atualiza localmente
            set(state => ({
                permissions: state.permissions.map(p =>
                    p.id === id ? { ...p, ...updates } : p
                )
            }));
        } catch (error) {
            console.error('Error updating permission:', error);
            set({ error: 'Erro ao atualizar permissão.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deletePermission: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await PermissionService.deletePermission(id);
            set(state => ({
                permissions: state.permissions.filter(p => p.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting permission:', error);
            set({ error: 'Erro ao excluir permissão.' });
        } finally {
            set({ isLoading: false });
        }
    }
}));
