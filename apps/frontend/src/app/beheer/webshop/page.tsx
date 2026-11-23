import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft, ClipboardList, ClipboardCheck } from 'lucide-react';
import { Button, Container, Group, Stack, Title } from '@mantine/core';
import BeheerWebshopProductsIsland from '@/components/islands/beheer/webshop/BeheerWebshopProductsIsland';
import WebshopVisibilityIsland from '@/components/islands/beheer/webshop/WebshopVisibilityIsland';
import {
    getBeheerDropWindows,
    getBeheerProducts,
    getBeheerProductVariants,
    getBeheerProductMedia,
    getBeheerProductSales
} from '@/server/queries/webshop/beheer-webshop.queries';
import { getWebshopSettings } from '@/server/actions/public/webshop.actions';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';
import { canAccess } from '@/shared/lib/permissions';
import { type AdminProductSales } from '@/components/islands/beheer/webshop/webshop-admin-types';

export const metadata: Metadata = {
    title: 'Webshop Beheer | SV Salve Mundi'
};

async function loadWebshopAdminData() {
    const [dropWindows, products, settings, salesRows] = await Promise.all([
        getBeheerDropWindows(),
        getBeheerProducts(),
        getWebshopSettings(),
        getBeheerProductSales()
    ]);

    const salesByProduct = new Map<number, AdminProductSales>();
    for (const row of salesRows) {
        if (row.product_id === null) continue;
        const sales = salesByProduct.get(row.product_id) ?? { paid: 0, pending: 0, byVariant: [] };
        const isCompleted = row.status === 'completed';
        if (isCompleted) {
            sales.paid += row.quantity;
        } else {
            sales.pending += row.quantity;
        }
        if (row.variant_label) {
            let variant = sales.byVariant.find(v => v.label === row.variant_label);
            if (!variant) {
                variant = { label: row.variant_label, paid: 0, pending: 0 };
                sales.byVariant.push(variant);
            }
            if (isCompleted) {
                variant.paid += row.quantity;
            } else {
                variant.pending += row.quantity;
            }
        }
        salesByProduct.set(row.product_id, sales);
    }

    const productsWithDetails = await Promise.all(products.map(async (product) => {
        const [variants, media] = await Promise.all([
            getBeheerProductVariants(product.id),
            getBeheerProductMedia(product.id)
        ]);
        // Order per-variant sales the same way the sizes/colors are ordered on the product.
        const sales = salesByProduct.get(product.id);
        if (sales) {
            const order = variants.map(v => [v.size, v.color].filter(Boolean).join(' / '));
            sales.byVariant.sort((a, b) => (order.indexOf(a.label) + 1 || 9999) - (order.indexOf(b.label) + 1 || 9999));
        }
        return { ...product, variants, media, sales };
    }));
    return { dropWindows, products: productsWithDetails, settings };
}

export default async function AdminWebshopPage() {
    const [{ dropWindows, products, settings }, accessData] = await Promise.all([
        loadWebshopAdminData(),
        checkBeheerAccess()
    ]);
    const canViewPickupList = canAccess(accessData.user?.committees, 'webshop_pickup');

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            Webshop Beheer
                        </Title>
                    </Group>

                    <Group gap="xs" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer/webshop/bestellingen"
                            size="sm"
                            leftSection={<ClipboardList size={14} />}
                        >
                            Bestellingen
                        </Button>
                        {canViewPickupList && (
                            <Button
                                component={Link}
                                href="/beheer/webshop/afhalen"
                                size="sm"
                                leftSection={<ClipboardCheck size={14} />}
                            >
                                Afhaallijst
                            </Button>
                        )}
                        <WebshopVisibilityIsland initialVisible={settings.show} />
                    </Group>
                </Group>

                <BeheerWebshopProductsIsland
                    initialDropWindows={dropWindows}
                    initialProducts={products}
                />
            </Stack>
        </Container>
    );
}