import { useState, useEffect } from 'react';
import { Modal, Input, Button, Checkbox, Dropdown, NumberInput } from '@/design-system';
import { Product } from '../types';
import { useProductStore } from '../stores/useProductStore';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    productToEdit?: Product | null;
}

const CATEGORY_OPTIONS = [
    { label: 'Produto', value: 'Produto' },
    { label: 'Serviço', value: 'Serviço' },
    { label: 'Assinatura', value: 'Assinatura' },
    { label: 'Consultoria', value: 'Consultoria' },
];

export const ProductModal = ({ isOpen, onClose, productToEdit }: ProductModalProps) => {
    const { addProduct, updateProduct, isLoading } = useProductStore();

    // Form States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState<string | number>('Produto');
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (productToEdit) {
            setName(productToEdit.name);
            setDescription(productToEdit.description || '');
            setPrice(productToEdit.price.toString());
            setCategory(productToEdit.category);
            setActive(productToEdit.active);
        } else {
            // Reset for create mode
            setName('');
            setDescription('');
            setPrice('');
            setCategory('Produto');
            setActive(true);
        }
    }, [productToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const priceNum = parseFloat(price.replace(',', '.'));
        if (!name || isNaN(priceNum)) {
            alert('Preencha nome e preço válido');
            return;
        }

        try {
            if (productToEdit) {
                await updateProduct(productToEdit.id, {
                    name,
                    description,
                    price: priceNum,
                    category: category as string,
                    active
                });
            } else {
                await addProduct({
                    name,
                    description,
                    price: priceNum,
                    category: category as string,
                    active
                });
            }
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={productToEdit ? 'Editar Produto' : 'Novo Produto'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <Input
                    label="Nome do Produto"
                    placeholder="Ex: Consultoria de Marketing"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                />

                <Input
                    label="Descrição"
                    placeholder="Detalhes do produto ou serviço..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    rows={3}
                    autoComplete="off"
                    spellCheck="false"
                    fullWidth
                />

                <div className="grid grid-cols-2 gap-4">
                    <NumberInput
                        label="Preço (R$)"
                        placeholder="0.00"
                        step={0.01}
                        min={0}
                        value={price}
                        onChange={(val) => setPrice(val)}
                        fullWidth
                    />

                    <Dropdown
                        label="Categoria"
                        options={CATEGORY_OPTIONS}
                        value={category}
                        onChange={setCategory}
                        placeholder="Selecione..."
                    />
                </div>

                <div className="pt-2">
                    <Checkbox
                        id="active-product"
                        label="Produto Ativo"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        {productToEdit ? 'Salvar Alterações' : 'Criar Produto'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
