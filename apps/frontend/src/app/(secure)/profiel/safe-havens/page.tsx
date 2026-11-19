import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';

export const metadata: Metadata = {
    title: 'Safe Haven | SV Salve Mundi',
    description: 'Safe Haven Beschikbaarheid'
};

export default function SafeHavenPage() {
    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Stack component="header" gap="md">
                    <Group>
                        <Button
                            component={Link}
                            href="/profiel"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug naar profiel
                        </Button>
                    </Group>
                    <Title order={1}>Safe Haven Beschikbaarheid</Title>
                </Stack>

                <Card padding="xl">
                    <Stack align="center" ta="center" gap="md">
                        <Title order={2} size="h3">
                            Bewerken van beschikbaarheid uitgeschakeld
                        </Title>
                        <Text c="dimmed" maw={640}>
                            Het bijwerken van Safe Haven beschikbaarheid is momenteel uitgeschakeld. Neem contact op met het bestuur
                            als je deze functionaliteit nodig hebt.
                        </Text>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
}
