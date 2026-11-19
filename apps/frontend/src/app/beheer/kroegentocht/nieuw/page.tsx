import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import KroegentochtEventForm from '@/components/islands/beheer/kroegentocht/KroegentochtEventForm';

export const metadata = {
    title: 'Nieuw Kroegentocht Event | Salve Mundi'
};

export default async function NewKroegentochtPage() {
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
                                Nieuw Event
                            </Title>
                            <Text size="sm" c="dimmed">
                                Maak een nieuwe kroegentocht aan
                            </Text>
                        </Stack>
                    </Group>
                </Group>

                <KroegentochtEventForm />
            </Stack>
        </Container>
    );
}
