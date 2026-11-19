'use client';

import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button, Center, Group, SimpleGrid, Stack, Text } from '@mantine/core';
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
        <Stack gap="lg">
            <Group gap="xs" role="tablist" aria-label="Categorie filter">
                {FILTERS.map((filter) => (
                    <Button
                        key={filter.value}
                        type="button"
                        role="tab"
                        aria-selected={category === filter.value}
                        size="sm"
                        variant={category === filter.value ? 'filled' : 'default'}
                        onClick={() => setCategory(filter.value)}
                    >
                        {filter.label}
                    </Button>
                ))}
            </Group>

            {filteredProducts.length === 0 ? (
                <Center py="xl">
                    <Stack align="center" gap="sm" py="xl">
                        <Text span c="brand" opacity={0.3} lh={1}>
                            <ShoppingBag size={48} />
                        </Text>
                        <Text c="dimmed" ta="center">
                            Er zijn op dit moment geen producten beschikbaar in deze categorie.
                        </Text>
                    </Stack>
                </Center>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
                    {filteredProducts.map((product) => (
                        <WebshopProductCard key={product.id} product={product} />
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );
}
