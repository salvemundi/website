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
            withBorder
            ta="center"
            style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--surface-subtle-border)',
            }}
        >
            <Stack align="center" gap="sm" py="md">
                <ThemeIcon size="lg">
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
