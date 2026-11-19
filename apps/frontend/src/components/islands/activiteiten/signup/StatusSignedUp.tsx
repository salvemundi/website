'use client';

import React from 'react';
import { CheckCircle2, CreditCard, AlertCircle, Ticket } from 'lucide-react';
import { Alert, Badge, Box, Button, Card, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import QRDisplay from '@/shared/ui/QRDisplay';

interface StatusSignedUpProps {
    isPaidStatus: boolean;
    eventName: string;
    qrToken?: string;
    onRetry: () => void;
    serverError: string | null;
}

export default function StatusSignedUp({
    isPaidStatus,
    eventName,
    qrToken,
    onRetry,
    serverError
}: StatusSignedUpProps) {
    return (
        <Card
            padding="xl"
            radius="xl"
            withBorder
            shadow="xl"
            h="100%"
            style={{
                borderColor: isPaidStatus ? 'color-mix(in srgb, var(--success) 35%, transparent)' : undefined,
            }}
        >
            <Stack justify="center" gap="xl" h="100%">
                <Stack align="center" gap="md" ta="center">
                    <ThemeIcon
                        size={80}
                        radius="xl"
                        variant={isPaidStatus ? 'light' : 'default'}
                        color={isPaidStatus ? 'success' : undefined}
                    >
                        {isPaidStatus ? <CheckCircle2 size={40} /> : <CreditCard size={40} />}
                    </ThemeIcon>

                    <Title order={3} size="h2">
                        {isPaidStatus ? 'Aanmelding Definitief!' : 'Betaling Gestart'}
                    </Title>

                    <Text c="dimmed">
                        {isPaidStatus ? (
                            <>
                                Je bent succesvol aangemeld voor{' '}
                                <Text span fw={600} c="brand">{eventName}</Text>.
                            </>
                        ) : (
                            <>
                                Je aanmelding voor{' '}
                                <Text span fw={600} c="brand">{eventName}</Text> is in afwachting van betaling.
                            </>
                        )}
                    </Text>

                    {!isPaidStatus && (
                        <Stack gap="sm" w="100%" align="center">
                            <Badge variant="default" size="lg" radius="md">
                                Wachten op bevestiging van betaling...
                            </Badge>
                            <Text size="xs" fw={600} c="dimmed" maw={320}>
                                Zodra de betaling is afgerond verschijnt hier je digitale ticket. Dit kan enkele minuten duren.
                            </Text>

                            <Button
                                type="button"
                                fullWidth
                                size="lg"
                                onClick={onRetry}
                                leftSection={<CreditCard size={18} />}
                            >
                                Betaal Nu
                            </Button>

                            {serverError && (
                                <Alert color="error" variant="light" icon={<AlertCircle size={18} />} w="100%" ta="left">
                                    {serverError}
                                </Alert>
                            )}
                        </Stack>
                    )}
                </Stack>

                {isPaidStatus ? (
                    <Paper p="xl" radius="xl" withBorder>
                        <Stack align="center" gap="md">
                            <Box p="sm" bg="#FFFFFF" style={{ borderRadius: 'var(--mantine-radius-lg)', boxShadow: 'var(--mantine-shadow-lg)' }}>
                                <QRDisplay qrToken={qrToken || 'PENDING_VERIFICATION'} size={240} />
                            </Box>
                            <Group gap={6} c="dimmed">
                                <Ticket size={14} />
                                <Text size="xs" fw={600} tt="uppercase">
                                    Toon bij de ingang
                                </Text>
                            </Group>
                        </Stack>
                    </Paper>
                ) : (
                    <Paper p="xl" radius="xl" withBorder style={{ borderStyle: 'dashed', opacity: 0.7 }}>
                        <Stack align="center" gap="sm">
                            <Paper p="xl" radius="lg" withBorder>
                                <Text span c="dimmed" opacity={0.3} lh={1}>
                                    <Ticket size={64} />
                                </Text>
                            </Paper>
                            <Text size="xs" fw={600} c="dimmed" ta="center">
                                Ticket wordt gegenereerd na betaling
                            </Text>
                        </Stack>
                    </Paper>
                )}
            </Stack>
        </Card>
    );
}
