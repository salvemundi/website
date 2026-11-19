import React from 'react';
import { Clock, Lock } from 'lucide-react';
import { Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface RegistrationClosedProps {
    registrationStartText: string;
}

export function RegistrationClosed({ registrationStartText }: RegistrationClosedProps) {
    const isWaitingForDate = registrationStartText.includes('opent op');

    return (
        <Paper
            p="xl"
            radius="lg"
            withBorder
            ta="center"
            style={{
                backgroundColor: 'color-mix(in srgb, var(--primary) 6%, transparent)',
                borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
            }}
        >
            <Stack align="center" gap="sm" py="md">
                <ThemeIcon size={48} radius="xl" variant="light" color="brand">
                    {isWaitingForDate ? <Clock size={24} /> : <Lock size={24} />}
                </ThemeIcon>
                <Title order={3} size="h4">
                    {isWaitingForDate ? 'Binnenkort Open' : 'Inschrijving Gesloten'}
                </Title>
                <Text size="sm" c="dimmed" maw={320}>
                    {registrationStartText}
                </Text>
            </Stack>
        </Paper>
    );
}
