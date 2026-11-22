'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export default function StatusPast() {
    return (
        <Paper p="xl" withBorder ta="center" h="100%" style={{ borderStyle: 'dashed' }}>
            <Stack align="center" justify="center" gap="md" h="100%" py="lg">
                <ThemeIcon size="lg">
                    <AlertCircle size={24} />
                </ThemeIcon>
                <Stack gap={4} align="center">
                    <Title order={3} size="h4">
                        Activiteit Afgelopen
                    </Title>
                    <Text size="sm" c="dimmed" maw={280}>
                        Helaas kun je je voor deze activiteit niet meer aanmelden.
                    </Text>
                </Stack>
            </Stack>
        </Paper>
    );
}
