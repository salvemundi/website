'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { Gift, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, Badge, Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { claimBorrelBarLink, type BorrelBarClaimStatus } from '@/server/actions/profile/borrelbar-claim.actions';
import { getImageUrl } from '@/lib/utils/image-utils';

interface BorrelBarClaimCardProps {
    initialStatus?: BorrelBarClaimStatus;
}

export default function BorrelBarClaimCard({ initialStatus }: BorrelBarClaimCardProps) {
    const [status, setStatus] = useState<BorrelBarClaimStatus | undefined>(initialStatus);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    if (!status?.isActive) return null;

    const handleClaim = () => {
        setError(null);
        startTransition(async () => {
            try {
                const res = await claimBorrelBarLink();
                if (res.success) {
                    setStatus((prev) => prev ? { ...prev, hasClaimed: true, passUrl: res.passUrl ?? prev.passUrl } : prev);
                    if (res.passUrl) {
                        window.open(res.passUrl, '_blank', 'noopener,noreferrer');
                    }
                } else {
                    setError(res.error || 'Er is een fout opgetreden bij het claimen.');
                }
            } catch {
                setError('Het claimen is niet gelukt. Vernieuw de pagina en probeer het opnieuw.');
            }
        });
    };

    const hasClaimed = status.hasClaimed;
    const passUrl = status.passUrl;
    const logoUrl = status.logoImageId ? getImageUrl(status.logoImageId, { width: 96, height: 96, fit: 'inside' }) : null;

    return (
        <Stack gap={6} style={{ gridColumn: '1 / -1' }}>
            <Text size="xs" fw={900} tt="uppercase" c="brand" pl={4}>
                BorrelBar Voordeel
            </Text>

            <Paper p="md" withBorder>
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                    <Group gap="md" wrap="nowrap">
                        <Text span c="brand" lh={1}>
                            {logoUrl ? (
                                <Box pos="relative" w={24} h={24} style={{ borderRadius: 'var(--mantine-radius-sm)', overflow: 'hidden' }}>
                                    <Image
                                        src={logoUrl}
                                        alt="BorrelBar Logo"
                                        fill
                                        sizes="24px"
                                        style={{ objectFit: 'contain' }}
                                    />
                                </Box>
                            ) : (
                                <Gift size={20} />
                            )}
                        </Text>
                        <Stack gap={2}>
                            <Text size="sm" fw={700}>
                                BorrelBar pas claimen
                            </Text>
                            <Text size="xs" c="dimmed">
                                {hasClaimed
                                    ? 'Je hebt jouw eenmalige registratie al geclaimd.'
                                    : 'Claim je eenmalige Wallet registratie (1x per lid).'}
                            </Text>
                        </Stack>
                    </Group>

                    <Box>
                        {hasClaimed ? (
                            passUrl ? (
                                <Button
                                    component="a"
                                    href={passUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="xs"
                                    rightSection={<ExternalLink size={14} />}
                                >
                                    Bekijk Pas
                                </Button>
                            ) : (
                                <Badge
                                    color="success"
                                    variant="light"
                                    size="lg"
                                    leftSection={<CheckCircle2 size={14} />}
                                >
                                    Al geclaimd
                                </Badge>
                            )
                        ) : (
                            <Button
                                type="button"
                                size="xs"
                                onClick={handleClaim}
                                loading={isPending}
                                rightSection={<ExternalLink size={14} />}
                            >
                                {isPending ? 'Bezig met activeren...' : 'Claimen'}
                            </Button>
                        )}
                    </Box>
                </Group>
            </Paper>

            {error && (
                <Alert color="error" icon={<AlertCircle size={16} />} variant="light">
                    {error}
                </Alert>
            )}
        </Stack>
    );
}
