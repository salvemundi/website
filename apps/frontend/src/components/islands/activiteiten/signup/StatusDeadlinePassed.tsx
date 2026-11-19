'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export default function StatusDeadlinePassed() {
    return (
        <Paper p="xl" radius="xl" withBorder ta="center" h="100%" style={{ borderStyle: 'dashed' }}>
            <Stack align="center" justify="center" gap="md" h="100%" py="lg">
                <ThemeIcon size={48} radius="xl" variant="light" color="brand">
                    <AlertCircle size={24} />
                </ThemeIcon>
                <Stack gap={4} align="center">
                    <Title order={3} size="h4">
                        De inschrijvingen staan dicht
                    </Title>
                    <Text size="sm" c="dimmed" maw={280}>
                        Als er een update is kan je die volgen via de WhatsApp announcements.
                    </Text>
                </Stack>
            </Stack>
        </Paper>
    );
}
