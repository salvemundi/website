import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, VisuallyHidden } from '@mantine/core';
import { getMyTickets } from '@/server/actions/events/activiteiten/activiteiten-status.actions';
import TicketListIsland from '@/components/islands/activiteiten/TicketListIsland';

export const metadata = {
    title: 'Mijn Tickets | Salve Mundi',
    description: 'Bekijk al je actieve tickets voor aankomende activiteiten.'
};

export default async function TicketsPage() {
    const tickets = await getMyTickets();

    return (
        <Container size="xl" py="xl">
            <VisuallyHidden component="h1">Mijn Tickets</VisuallyHidden>
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
                <TicketListIsland tickets={tickets} />
            </Stack>
        </Container>
    );
}
