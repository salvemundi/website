'use client';

import { Loader, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export default function StatusLoading() {
    return (
        <Stack align="center" gap="xl" py="xl" ta="center">
            <ThemeIcon size={96} radius="xl" variant="light" color="brand">
                <Loader size="lg" color="brand" />
            </ThemeIcon>
            <Stack gap="xs" align="center">
                <Title order={2} fz={{ base: '2rem', md: '2.5rem' }}>
                    Betaling <Text span c="brand" inherit>verifiëren</Text>
                </Title>
                <Text size="lg" c="dimmed" maw={400}>
                    Eén moment geduld, we controleren de status van je transactie bij de bank...
                </Text>
            </Stack>
        </Stack>
    );
}
