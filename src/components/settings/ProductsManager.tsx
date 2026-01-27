import React, { useState, useEffect } from 'react';
import { Product, CreateProductDTO, UpdateProductDTO } from '../../types/Product';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseGetProducts, supabaseCreateProduct, supabaseUpdateProduct, supabaseDeleteProduct } from '../../services/supabaseApi';

const ProductsManager: React.FC = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await supabaseGetProducts();
            setProducts(data as Product[]);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const productData = {
                name,
                description,
                price: parseFloat(price.replace('R$', '').replace('.', '').replace(',', '.').trim())
            };

            if (editingProduct) {
                await supabaseUpdateProduct(editingProduct.id, productData);
            } else {
                await supabaseCreateProduct(productData);
            }

            fetchProducts();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este produto?')) return;

        try {
            await supabaseDeleteProduct(id);
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setName('');
        setDescription('');
        setPrice('');
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        Catálogo de Produtos
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">
                        Gerencie os produtos e serviços disponíveis para venda
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20"
                >
                    <Plus className="w-4 h-4" />
                    Novo Produto
                </motion.button>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar produtos..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
            </div>

            {/* List */}
            <div className="grid gap-3">
                {filteredProducts.map((product) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/5 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                                <Package className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                                    {product.name}
                                </h3>
                                {product.description && (
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                        {product.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 sm:pl-4 sm:border-l border-slate-200">
                            <div className="text-right">
                                <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Valor Base</span>
                                <p className="text-lg font-semibold text-emerald-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {filteredProducts.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">Nenhum produto encontrado</p>
                        <p className="text-sm mt-1">Clique em "Novo Produto" para adicionar</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-900">
                                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Nome do Produto</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                                        placeholder="Ex: Consultoria Premium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Descrição (Opcional)</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 min-h-[80px]"
                                        placeholder="Detalhes sobre o produto..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Valor Base (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                                        placeholder="0,00"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Este valor virá pré-preenchido ao criar um negócio.</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductsManager;
