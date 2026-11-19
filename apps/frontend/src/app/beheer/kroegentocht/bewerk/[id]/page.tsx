import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import KroegentochtEventForm from '@/components/islands/beheer/kroegentocht/KroegentochtEventForm';
import { getPubCrawlEvent } from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Kroegentocht Event Bewerken | Salve Mundi'
};

interface EditKroegentochtPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditKroegentochtPage({ params }: EditKroegentochtPageProps) {
    const { id } = await params;
    const event = await getPubCrawlEvent(id).catch(() => null);

    if (!event) notFound();

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer/kroegentocht"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Stack gap={2}>
                            <Title order={1} size="h2" c="brand">
                                Event Bewerken
                            </Title>
                            <Text size="sm" c="dimmed">
                                Beheer de gegevens van {event.name}
                            </Text>
                        </Stack>
                    </Group>
                </Group>

                <KroegentochtEventForm event={event} />
            </Stack>
        </Container>
    );
}
