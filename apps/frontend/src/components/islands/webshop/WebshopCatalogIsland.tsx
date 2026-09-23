'use client';

import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import WebshopProductCard from './WebshopProductCard';
import { type WebshopCatalogProduct } from '@salvemundi/validations/schema/webshop.zod';

interface WebshopCatalogIslandProps {
    products: WebshopCatalogProduct[];
}

type CategoryFilter = 'all' | 'clothing' | 'item';

const FILTERS: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'Alles' },
    { value: 'clothing', label: 'Kleding' },
    { value: 'item', label: 'Items' },
];

export default function WebshopCatalogIsland({ products }: WebshopCatalogIslandProps) {
    const [category, setCategory] = useState<CategoryFilter>('all');

    const filteredProducts = useMemo(() => {
        if (category === 'all') return products;
        return products.filter(p => p.type === category);
    }, [products, category]);

    return (
        <div className="space-y-6">
            <div className="flex gap-2" role="tablist" aria-label="Categorie filter">
                {FILTERS.map((filter) => (
                    <button
                        key={filter.value}
                        type="button"
                        role="tab"
                        aria-selected={category === filter.value}
                        onClick={() => setCategory(filter.value)}
                        className={`form-button rounded-full px-4 py-2 text-sm font-bold transition-all ${
                            category === filter.value
                                ? 'bg-(--theme-purple) text-white shadow-(--theme-purple)/20 shadow-lg'
                                : 'bg-(--bg-soft) text-(--text-muted) hover:text-(--theme-purple)'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                    <ShoppingBag className="size-12 text-(--theme-purple)/20" />
                    <p className="text-(--text-muted)">Er zijn op dit moment geen producten beschikbaar in deze categorie.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProducts.map((product) => (
                        <WebshopProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
