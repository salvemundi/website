import Link from '@/components/ui/Link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack } from '@mantine/core';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getPizzaOverview } from '@/server/actions/public/pizza.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { PizzaOverviewIsland } from '@/components/islands/pizza/PizzaOverviewIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Pizza-rondes | SV Salve Mundi',
    description: 'Start een pizza-ronde of bestel mee met andere leden.'
};

export default async function PizzaPage() {
    const session = await getEnrichedSession();
    if (!session) {
        redirect('/');
    }

    const overview = await getPizzaOverview();

    return (
        <PublicPageShell title="Pizza-rondes">
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Group>
                        <Button
                            component={Link}
                            href="/profiel"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>
                    <PizzaOverviewIsland open={overview.open} mine={overview.mine} />
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
