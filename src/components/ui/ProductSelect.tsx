import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../types/Product';
import { supabaseGetProducts } from '../../services/supabaseApi';

interface ProductSelectProps {
    value: string;
    onChange: (value: string, price?: number) => void;
    className?: string;
}

const ProductSelect: React.FC<ProductSelectProps> = ({ value, onChange, className }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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

        fetchProducts();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const selectedProduct = products.find(p => p.id === selectedId);
        onChange(selectedId, selectedProduct ? selectedProduct.price : undefined);
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Produto / Serviço</label>
            <div className="relative">
                <Package className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select
                    value={value}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-slate-900 focus:outline-none focus:border-rose-600/50 transition-all shadow-inner appearance-none disabled:opacity-50"
                >
                    <option value="">Selecione um produto...</option>
                    {products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ProductSelect;
