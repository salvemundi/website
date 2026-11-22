'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export default function StatusFull() {
    return (
        <Paper p="xl" withBorder ta="center" h="100%" style={{ borderStyle: 'dashed' }}>
            <Stack align="center" justify="center" gap="md" h="100%" py="lg">
                <ThemeIcon size="lg">
                    <Users size={24} />
                </ThemeIcon>
                <Stack gap={4} align="center">
                    <Title order={3} size="h4">
                        Deze activiteit zit vol
                    </Title>
                    <Text size="sm" c="dimmed" maw={280}>
                        Het maximum aantal aanmeldingen is bereikt. Aanmelden is helaas niet meer mogelijk.
                    </Text>
                </Stack>
            </Stack>
        </Paper>
    );
}
