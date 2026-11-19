import type { Metadata } from 'next';
import { Container, Stack, Text, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import WebshopCatalogIsland from '@/components/islands/webshop/WebshopCatalogIsland';
import { getCatalogProducts } from '@/server/actions/public/webshop.actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Webshop | Salve Mundi',
    description: 'Bekijk de huidige preorder drop van Salve Mundi: kleding en items om vast te bestellen.'
};

export default async function WebshopPage() {
    const products = await getCatalogProducts();

    return (
        <PublicPageShell>
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Stack gap="xs">
                        <Title order={1} c="brand">Webshop</Title>
                        <Text c="dimmed" maw={640}>
                            Bestel je favoriete Salve Mundi kleding en items. Dit zijn preorders: je betaalt nu de
                            volledige prijs en je haalt je bestelling op tijdens een afgesproken afhaalmoment.
                        </Text>
                    </Stack>

                    <WebshopCatalogIsland products={products} />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
