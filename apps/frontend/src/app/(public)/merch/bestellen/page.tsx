import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { ChevronLeft, Lock, LogIn, ShieldAlert } from 'lucide-react';
import { Button, Card, Center, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import WebshopCheckoutIsland from '@/components/islands/webshop/WebshopCheckoutIsland';
import { getProductBySlug } from '@/server/actions/public/webshop.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { isProductSoldOut } from '@/shared/lib/utils/webshop-stock';

export const metadata: Metadata = {
    title: 'Bestellen | Webshop | Salve Mundi'
};

interface PageProps {
    searchParams: Promise<{ product?: string }>;
}

function BlockedCard({ icon: Icon, title, message }: { icon: typeof Lock; title: string; message: string }) {
    return (
        <Center mih="60vh">
            <Card w="100%" maw={440} padding="xl">
                <Stack align="center" ta="center" gap="lg">
                    <ThemeIcon size={64} radius="xl" variant="light" color="brand">
                        <Icon size={32} />
                    </ThemeIcon>
                    <Title order={1} size="h2" c="brand">
                        {title}
                    </Title>
                    <Text c="dimmed">{message}</Text>
                    <Button
                        component={Link}
                        href="/merch"
                        variant="default"
                        size="sm"
                        leftSection={<ChevronLeft size={16} />}
                    >
                        Terug naar merch
                    </Button>
                </Stack>
            </Card>
        </Center>
    );
}

export default async function WebshopBestellenPage({ searchParams }: PageProps) {
    await connection();
    const { product: slug } = await searchParams;

    if (!slug) notFound();

    const [product, session] = await Promise.all([
        getProductBySlug(slug),
        getEnrichedSession()
    ]);

    if (!product) notFound();

    const user = session?.user;
    const isLoggedIn = !!session?.user;
    const isMember = user?.membership_status === 'active';
    const isDropOpen = !product.drop_window || product.drop_window.status === 'open';
    const isSoldOut = isProductSoldOut(product);

    return (
        <PublicPageShell>
            <Container size="md" py="xl">
                <Stack gap="lg">
                    <Group>
                        <Button
                            component={Link}
                            href={`/merch/${product.slug}`}
                            title="Terug naar product"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>

                    {isSoldOut ? (
                        <BlockedCard icon={Lock} title="Uitverkocht" message="Dit product is helaas uitverkocht." />
                    ) : !isDropOpen ? (
                        <BlockedCard icon={Lock} title="Drop gesloten" message="Deze drop is gesloten voor nieuwe bestellingen." />
                    ) : !isLoggedIn ? (
                        <BlockedCard icon={LogIn} title="Log in om te bestellen" message="Je moet ingelogd zijn met je Salve Mundi account om een bestelling te plaatsen." />
                    ) : !isMember ? (
                        <BlockedCard icon={ShieldAlert} title="Alleen voor leden" message="Bestellen in de webshop is op dit moment alleen mogelijk voor leden van Salve Mundi." />
                    ) : (
                        <Card padding="xl">
                            <WebshopCheckoutIsland
                                product={product}
                                initialUser={{
                                    first_name: user.first_name,
                                    last_name: user.last_name,
                                    email: session.user.email,
                                    phone_number: user.phone_number
                                }}
                            />
                        </Card>
                    )}
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
