import Link from '@/components/ui/Link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack } from '@mantine/core';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPizzaRound, getPizzaFavorites } from '@/server/actions/public/pizza.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { PizzaRoundIsland } from '@/components/islands/pizza/PizzaRoundIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Pizza-ronde | SV Salve Mundi',
    description: 'Bestel mee met een pizza-ronde van Salve Mundi.'
};

export default async function PizzaRoundPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getEnrichedSession();
    if (!session) {
        redirect('/');
    }

    const { id } = await params;
    const detail = await getPizzaRound(id);
    if (!detail) {
        notFound();
    }

    const favorites = detail.round.isOpen ? await getPizzaFavorites() : undefined;

    return (
        <PublicPageShell title={detail.round.title}>
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Group>
                        <Button
                            component={Link}
                            href="/pizza"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>
                    <PizzaRoundIsland detail={detail} favorites={favorites} />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
