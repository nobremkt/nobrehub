/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOBRE HUB - FEATURE: STRATEGIC - SOCIAL MEDIA STORE
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';
import { SocialMediaClient, SocialMediaPost, SocialMediaClientFormData, PostStatus } from '../types/socialMedia';
import { SocialMediaService } from '../services/SocialMediaService';
import { toast } from 'react-toastify';

interface SocialMediaState {
    clients: SocialMediaClient[];
    posts: Record<string, SocialMediaPost[]>; // clientId -> posts
    selectedClientId: string | null;
    isLoading: boolean;

    // Subscriptions
    unsubscribeClients: () => void;
    postUnsubscribers: Record<string, () => void>;

    // Actions
    init: () => void;
    cleanup: () => void;
    selectClient: (id: string | null) => void;
    subscribeToClientPosts: (clientId: string) => void;

    // CRUD
    createClient: (data: SocialMediaClientFormData) => Promise<void>;
    updateClient: (clientId: string, data: Partial<SocialMediaClientFormData & { status: 'active' | 'inactive' }>) => Promise<void>;
    deleteClient: (clientId: string) => Promise<void>;
    createPost: (clientId: string, scheduledDate: Date, notes?: string) => Promise<void>;
    updatePostStatus: (clientId: string, postId: string, status: PostStatus) => Promise<void>;
    deletePost: (clientId: string, postId: string) => Promise<void>;

    // Selectors
    getActiveClients: () => SocialMediaClient[];
    getClientPosts: (clientId: string) => SocialMediaPost[];
    getSelectedClient: () => SocialMediaClient | null;
}

export const useSocialMediaStore = create<SocialMediaState>((set, get) => ({
    clients: [],
    posts: {},
    selectedClientId: null,
    isLoading: false,

    unsubscribeClients: () => { },
    postUnsubscribers: {},

    init: () => {
        set({ isLoading: true });
        const unsubscribe = SocialMediaService.subscribeToClients((clients) => {
            set({ clients, isLoading: false });
        });
        set({ unsubscribeClients: unsubscribe });
    },

    cleanup: () => {
        get().unsubscribeClients();
        Object.values(get().postUnsubscribers).forEach(unsub => unsub());
        set({
            clients: [],
            posts: {},
            selectedClientId: null,
            unsubscribeClients: () => { },
            postUnsubscribers: {},
        });
    },

    selectClient: (id) => {
        set({ selectedClientId: id });
        if (id) {
            get().subscribeToClientPosts(id);
        }
    },

    subscribeToClientPosts: (clientId) => {
        const { postUnsubscribers } = get();

        // Already subscribed
        if (postUnsubscribers[clientId]) return;

        const unsubscribe = SocialMediaService.subscribeToClientPosts(clientId, (posts) => {
            set((state) => ({
                posts: { ...state.posts, [clientId]: posts }
            }));
        });

        set({
            postUnsubscribers: { ...postUnsubscribers, [clientId]: unsubscribe }
        });
    },

    createClient: async (data) => {
        try {
            await SocialMediaService.createClient(data);
            toast.success('Cliente adicionado!');
        } catch (error) {
            toast.error('Erro ao adicionar cliente');
            console.error('Error creating client:', error);
        }
    },

    updateClient: async (clientId, data) => {
        try {
            await SocialMediaService.updateClient(clientId, data);
        } catch (error) {
            toast.error('Erro ao atualizar cliente');
            console.error('Error updating client:', error);
        }
    },

    deleteClient: async (clientId) => {
        try {
            await SocialMediaService.deleteClient(clientId);
            toast.success('Cliente removido');
        } catch (error) {
            toast.error('Erro ao remover cliente');
            console.error('Error deleting client:', error);
        }
    },

    createPost: async (clientId, scheduledDate, notes) => {
        try {
            await SocialMediaService.createPost(clientId, scheduledDate, notes);
        } catch (error) {
            toast.error('Erro ao criar post');
            console.error('Error creating post:', error);
        }
    },

    updatePostStatus: async (clientId, postId, status) => {
        try {
            await SocialMediaService.updatePost(clientId, postId, { status });
        } catch (error) {
            toast.error('Erro ao atualizar status');
            console.error('Error updating post:', error);
        }
    },

    deletePost: async (clientId, postId) => {
        try {
            await SocialMediaService.deletePost(clientId, postId);
        } catch (error) {
            toast.error('Erro ao remover post');
            console.error('Error deleting post:', error);
        }
    },

    getActiveClients: () => {
        return get().clients.filter(c => c.status === 'active');
    },

    getClientPosts: (clientId) => {
        return get().posts[clientId] || [];
    },

    getSelectedClient: () => {
        const { clients, selectedClientId } = get();
        return clients.find(c => c.id === selectedClientId) || null;
    },
}));
