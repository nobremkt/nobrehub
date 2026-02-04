import { create } from 'zustand';
import { Product } from '../types';
import { ProductService } from '../services/ProductService';

interface ProductState {
    products: Product[];
    isLoading: boolean;
    error: string | null;

    fetchProducts: () => Promise<void>;
    addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    updateProductPoints: (updates: { id: string; points: number }[]) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    isLoading: false,
    error: null,

    fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const products = await ProductService.getProducts();
            set({ products });
        } catch (error) {
            console.error('Error fetching products:', error);
            set({ error: 'Erro ao carregar produtos.' });
        } finally {
            set({ isLoading: false });
        }
    },

    addProduct: async (newProduct) => {
        set({ isLoading: true, error: null });
        try {
            await ProductService.createProduct(newProduct);
            await get().fetchProducts(); // Refresh list
        } catch (error) {
            console.error('Error adding product:', error);
            set({ error: 'Erro ao criar produto.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateProduct: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            await ProductService.updateProduct(id, updates);
            // Otimista: atualiza localmente para evitar refetch
            set(state => ({
                products: state.products.map(p =>
                    p.id === id ? { ...p, ...updates } : p
                )
            }));
        } catch (error) {
            console.error('Error updating product:', error);
            set({ error: 'Erro ao atualizar produto.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    updateProductPoints: async (updates) => {
        set({ isLoading: true, error: null });
        try {
            // Batch update all product points
            await Promise.all(
                updates.map(({ id, points }) =>
                    ProductService.updateProduct(id, { points })
                )
            );
            // Optimistic update local state
            set(state => ({
                products: state.products.map(p => {
                    const update = updates.find(u => u.id === p.id);
                    return update ? { ...p, points: update.points } : p;
                })
            }));
        } catch (error) {
            console.error('Error updating product points:', error);
            set({ error: 'Erro ao atualizar pontos.' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProduct: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await ProductService.deleteProduct(id);
            set(state => ({
                products: state.products.filter(p => p.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting product:', error);
            set({ error: 'Erro ao excluir produto.' });
        } finally {
            set({ isLoading: false });
        }
    }
}));
