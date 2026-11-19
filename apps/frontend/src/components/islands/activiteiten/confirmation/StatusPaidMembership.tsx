'use client';

import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { Button, Card, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export default function StatusPaidMembership() {
    return (
        <Stack align="center" gap="xl" ta="center">
            <Stack align="center" gap="md">
                <ThemeIcon size={96} radius="xl" variant="light" color="success">
                    <UserPlus size={48} />
                </ThemeIcon>
                <Title order={1} fz={{ base: '2.25rem', md: '3.75rem' }} lh={1}>
                    Welkom <Text span c="success" inherit>lid!</Text>
                </Title>
                <Text size="lg" c="dimmed" maw={440}>
                    Je betaling is geslaagd. Je bent nu officieel lid van SV Salve Mundi!
                </Text>
            </Stack>

            <Card padding="xl" radius="xl" withBorder shadow="xl" maw={448} w="100%">
                <Stack gap="lg">
                    <Text fw={500}>
                        Je hebt zojuist een bevestigingsmail ontvangen met alle details.
                        Je kunt nu inloggen op de website om gebruik te maken van je ledenvoordelen.
                    </Text>
                    <Button component={Link} href="/profiel" fullWidth size="lg">
                        Naar mijn profiel
                    </Button>
                </Stack>
            </Card>
        </Stack>
    );
}
