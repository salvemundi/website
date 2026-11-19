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
    getBeheerProductMedia
} from '@/server/queries/webshop/beheer-webshop.queries';
import { getWebshopSettings } from '@/server/actions/public/webshop.actions';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';
import { COMMITTEES } from '@/shared/lib/permissions-config';

export const metadata: Metadata = {
    title: 'Webshop Beheer | SV Salve Mundi'
};

async function loadWebshopAdminData() {
    const [dropWindows, products, settings] = await Promise.all([
        getBeheerDropWindows(),
        getBeheerProducts(),
        getWebshopSettings()
    ]);
    const productsWithDetails = await Promise.all(products.map(async (product) => {
        const [variants, media] = await Promise.all([
            getBeheerProductVariants(product.id),
            getBeheerProductMedia(product.id)
        ]);
        return { ...product, variants, media };
    }));
    return { dropWindows, products: productsWithDetails, settings };
}

export default async function AdminWebshopPage() {
    const [{ dropWindows, products, settings }, accessData] = await Promise.all([
        loadWebshopAdminData(),
        checkBeheerAccess()
    ]);
    const isBoardOrIct = Boolean(accessData.user?.committees.some(
        c => c.azure_group_id === COMMITTEES.BESTUUR || c.azure_group_id === COMMITTEES.ICT
    ));

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            variant="default"
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
                            variant="default"
                            size="sm"
                            leftSection={<ClipboardList size={14} />}
                        >
                            Bestellingen
                        </Button>
                        {isBoardOrIct && (
                            <Button
                                component={Link}
                                href="/beheer/webshop/afhalen"
                                variant="default"
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