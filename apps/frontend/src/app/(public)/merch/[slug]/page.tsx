import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, SimpleGrid, Stack } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import WebshopGalleryIsland from '@/components/islands/webshop/WebshopGalleryIsland';
import WebshopProductDetailIsland from '@/components/islands/webshop/WebshopProductDetailIsland';
import { getProductBySlug } from '@/server/actions/public/webshop.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
        return { title: 'Product niet gevonden | Salve Mundi' };
    }

    return {
        title: `${product.name} | Webshop | Salve Mundi`,
        description: product.description?.slice(0, 160) || 'Bekijk dit product in de Salve Mundi webshop.'
    };
}

export default async function WebshopProductPage({ params }: PageProps) {
    await connection();
    const { slug } = await params;

    const [product, session] = await Promise.all([
        getProductBySlug(slug),
        getEnrichedSession()
    ]);

    if (!product) notFound();

    const user = session?.user;
    const isLoggedIn = !!session?.user;
    const isMember = user?.membership_status === 'active';

    return (
        <PublicPageShell>
            <Container size="lg" py="xl">
                <Stack gap="lg">
                    <Group>
                        <Button
                            component={Link}
                            href="/merch"
                            title="Terug naar merch"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                        <WebshopGalleryIsland media={product.media} productName={product.name} />
                        <WebshopProductDetailIsland product={product} isLoggedIn={isLoggedIn} isMember={isMember} />
                    </SimpleGrid>
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
