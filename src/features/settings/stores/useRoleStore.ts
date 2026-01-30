import { create } from 'zustand';
import { Role } from '../types';
import { RoleService } from '../services/RoleService';

interface RoleState {
    roles: Role[];
    isLoading: boolean;
    error: string | null;

    fetchRoles: () => Promise<void>;
    addRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
    deleteRole: (id: string) => Promise<void>;
}

export const useRoleStore = create<RoleState>((set, get) => ({
    roles: [],
    isLoading: false,
    error: null,

    fetchRoles: async () => {
        set({ isLoading: true, error: null });
        try {
            const roles = await RoleService.getRoles();
            set({ roles });
        } catch (error) {
            console.error('Error fetching roles:', error);
            set({ error: 'Erro ao carregar cargos.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addRole: async (newRole) => {
        set({ isLoading: true, error: null });
        try {
            await RoleService.createRole(newRole);
            await get().fetchRoles(); // Refresh list
        } catch (error) {
            console.error('Error adding role:', error);
            set({ error: 'Erro ao criar cargo.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateRole: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await RoleService.updateRole(id, updates);
            // Otimista: atualiza localmente
            set(state => ({
                roles: state.roles.map(r =>
                    r.id === id ? { ...r, ...updates } : r
                )
            }));
        } catch (error) {
            console.error('Error updating role:', error);
            set({ error: 'Erro ao atualizar cargo.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteRole: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await RoleService.deleteRole(id);
            set(state => ({
                roles: state.roles.filter(r => r.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting role:', error);
            set({ error: 'Erro ao excluir cargo.' });
        } finally {
            set({ isLoading: false });
        }
    }
}));
