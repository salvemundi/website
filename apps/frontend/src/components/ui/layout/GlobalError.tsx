'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button, Center, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
    title?: string;
}

export default function GlobalError({
    error,
    reset,
    title = 'Er is iets misgegaan',
}: GlobalErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service if available
    }, [error]);

    return (
        <Container size="sm">
            <Center mih="60vh">
                <Stack align="center" gap="lg" ta="center">
                    <ThemeIcon size={80} radius="lg" variant="light" color="error">
                        <AlertTriangle size={40} />
                    </ThemeIcon>

                    <Title order={2} fz={{ base: '1.75rem', sm: '2.25rem' }}>
                        {title}
                    </Title>

                    <Text c="dimmed" maw={440}>
                        {error.message || 'Onze servers konden het verzoek niet verwerken. Probeer het opnieuw of ga terug naar de homepagina.'}
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
                            variant="default"
                            size="md"
                            leftSection={<Home size={16} />}
                        >
                            Terug naar Home
                        </Button>
                    </Group>

                    {error.digest && (
                        <Text size="xs" ff="monospace" c="dimmed" tt="uppercase" opacity={0.6}>
                            Err-ID: {error.digest}
                        </Text>
                    )}
                </Stack>
            </Center>
        </Container>
    );
}
