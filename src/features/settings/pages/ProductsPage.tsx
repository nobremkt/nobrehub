import { useEffect, useState } from 'react';

import { Card, CardBody, Button, Badge, Spinner, Input, ConfirmModal } from '@/design-system';
import { useProductStore } from '../stores/useProductStore';
import { ProductModal } from '../components/ProductModal';
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import { Product } from '../types';

export const ProductsPage = () => {
    const { products, fetchProducts, isLoading, deleteProduct } = useProductStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Delete Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setProductToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (productToDelete) {
            setIsDeleting(true);
            try {
                await deleteProduct(productToDelete);
                setIsConfirmOpen(false);
                setProductToDelete(null);
            } catch (error) {
                console.error("Error deleting product:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full px-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Produtos e Serviços</h1>
                    <p className="text-text-muted">Gerencie o catálogo de itens disponíveis para venda.</p>
                </div>
                <Button onClick={handleCreate} leftIcon={<Plus size={18} />}>
                    Novo Produto
                </Button>
            </div>

            <div className="w-full md:w-96">
                <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search size={18} />}
                    fullWidth
                />
            </div>

            {isLoading && products.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <Card key={product.id} variant="elevated">
                            <CardBody className="p-4 flex flex-col h-full gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-lg bg-surface-tertiary text-primary-600">
                                        <Package size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-text-secondary">
                                            {product.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <Badge variant={product.active ? 'success' : 'default'} dot />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg text-text-primary mb-1">{product.name}</h3>
                                    <p className="text-sm text-text-muted line-clamp-2 min-h-[40px]">
                                        {product.description || 'Sem descrição.'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-text-muted uppercase font-bold">Preço</span>
                                        <span className="font-bold text-lg text-text-primary">
                                            {product.price != null
                                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)
                                                : '—'
                                            }
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} title="Editar">
                                            <Pencil size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product.id)} title="Excluir" className="text-danger-500 hover:text-danger-600">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-12 text-text-muted">
                            Nenhum produto encontrado.
                        </div>
                    )}
                </div>
            )}

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={editingProduct}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Excluir Produto"
                description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};
