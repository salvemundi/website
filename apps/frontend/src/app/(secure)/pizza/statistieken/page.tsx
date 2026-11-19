import Link from '@/components/ui/Link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack } from '@mantine/core';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPizzaStats } from '@/server/actions/public/pizza.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { PizzaStatsIsland } from '@/components/islands/pizza/PizzaStatsIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Pizza-statistieken | SV Salve Mundi',
    description: 'Jouw persoonlijke pizza-statistieken.'
};

export default async function PizzaStatsPage() {
    const session = await getEnrichedSession();
    if (!session) {
        redirect('/');
    }

    const stats = await getPizzaStats();

    return (
        <PublicPageShell title="Pizza-statistieken">
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
                    <PizzaStatsIsland stats={stats} />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
