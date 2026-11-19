'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Anchor, Button, Card, Group, Stack, Switch, Text, Title } from '@mantine/core';
import {
    getPubCrawlScannerEnabled,
    setPubCrawlScannerEnabled,
} from '@/server/actions/events/kroegentocht/kroegentocht-scanner.actions';

export default function KroegentochtScannerSettings({ eventId }: { eventId: number }) {
    const [enabled, setEnabled] = useState(false);
    const [pending, setPending] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        void getPubCrawlScannerEnabled(eventId)
            .then((value) => {
                if (!cancelled) setEnabled(value);
            })
            .catch(() => {
                if (!cancelled) setError('Scannerinstellingen konden niet worden geladen.');
            })
            .finally(() => {
                if (!cancelled) setPending(false);
            });
        return () => {
            cancelled = true;
        };
    }, [eventId]);

    const href = `/kroegentocht-scanner/${eventId}`;

    return (
        <Card p="lg" shadow="sm">
            <Stack gap="sm" align="flex-start">
                <Title order={2} size="h4">
                    Publieke ticketscanner
                </Title>
                <Text size="sm" c="dimmed">
                    Groepsleiders kunnen zonder account scannen. Activeer de scanner tijdens de kroegentocht en deactiveer hem na afloop.
                </Text>
                <Switch
                    checked={enabled}
                    disabled={pending || !!error}
                    label={
                        pending
                            ? 'Laden…'
                            : enabled
                              ? 'Scanner actief — deactiveren'
                              : 'Scanner inactief — activeren'
                    }
                    onChange={() => {
                        setPending(true);
                        void setPubCrawlScannerEnabled(eventId, !enabled)
                            .then(setEnabled)
                            .catch(() =>
                                setError(
                                    'Bijwerken van de scanner mislukt. Vernieuw de pagina en probeer opnieuw.'
                                )
                            )
                            .finally(() => setPending(false));
                    }}
                />
                <Group gap="md">
                    <Anchor component={Link} href={href} target="_blank" size="sm" fw={600}>
                        Scanner openen
                    </Anchor>
                    <Button
                        type="button"
                        variant="subtle"
                        size="xs"
                        px={0}
                        onClick={() => {
                            void navigator.clipboard
                                .writeText(`${window.location.origin}${href}`)
                                .catch(() =>
                                    setError(
                                        'Kopiëren mislukt. Kopieer de link via Scanner openen.'
                                    )
                                );
                        }}
                    >
                        Link voor groepsleiders kopiëren
                    </Button>
                </Group>
                {error && (
                    <Alert color="error" variant="light" w="100%">
                        {error}
                    </Alert>
                )}
            </Stack>
        </Card>
    );
}
