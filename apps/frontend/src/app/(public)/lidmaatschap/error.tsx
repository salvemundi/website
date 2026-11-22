'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button, Center, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { safeConsoleError } from '@/server/utils/logger';

export default function MembershipError({
    error,
    reset
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        safeConsoleError('[error.tsx][MembershipError] Error:', error);
    }, [error]);

    return (
        <Container size="sm" py="xl">
            <Center mih="70vh">
                <Stack align="center" ta="center" gap="lg">
                    <ThemeIcon size="xl">
                        <AlertTriangle size={36} />
                    </ThemeIcon>

                    <Title order={1} fz={{ base: '2rem', sm: '2.5rem' }}>
                        Er is iets misgegaan
                    </Title>

                    <Text c="dimmed" maw={480}>
                        Onze servers konden je lidmaatschapsgegevens niet ophalen.
                        Probeer de pagina te herladen of controleer je internetverbinding.
                    </Text>

                    <Group justify="center" gap="md">
                        <Button
                            type="button"
                            size="md"
                            onClick={() => reset()}
                            leftSection={<RefreshCcw size={16} />}
                        >
                            Opnieuw Proberen
                        </Button>

                        <Button
                            component={Link}
                            href="/"
                            size="md"
                            leftSection={<Home size={16} />}
                        >
                            Terug naar Home
                        </Button>
                    </Group>

                    {error.digest && (
                        <Text size="xs" c="dimmed" ff="monospace">
                            Err-ID: {error.digest}
                        </Text>
                    )}
                </Stack>
            </Center>
        </Container>
    );
}
