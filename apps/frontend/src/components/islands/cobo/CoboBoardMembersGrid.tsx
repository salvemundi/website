'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CoboBoardPreference } from '@salvemundi/validations';
import { Wine } from 'lucide-react';
import { Badge, Box, Card, Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { getImageUrl } from '@/lib/utils/image-utils';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface Props {
    boardMembers: CoboBoardPreference[];
    coboId?: number;
}

interface LiveApiResponse {
    success: boolean;
    boardMembers?: CoboBoardPreference[];
}

export default function CoboBoardMembersGrid({ boardMembers: initialMembers, coboId }: Props) {
    const [boardMembers, setBoardMembers] = useState<CoboBoardPreference[]>(initialMembers);

    useEffect(() => {
        setBoardMembers(initialMembers);
    }, [initialMembers]);

    useEffect(() => {
        if (!coboId) return;

        const fetchLivePreferences = async () => {
            try {
                const res = await fetch(`/api/cobo/live?coboId=${coboId}&includeMembers=true`, {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = (await res.json()) as LiveApiResponse;
                    if (data.success && Array.isArray(data.boardMembers)) {
                        setBoardMembers(data.boardMembers);
                    }
                }
            } catch {
            }
        };

        const interval = setInterval(() => {
            void fetchLivePreferences();
        }, 5000);
        return () => clearInterval(interval);
    }, [coboId]);

    if (boardMembers.length === 0) {
        return null;
    }

    return (
        <Stack gap="xl" pt="md">
            <Divider />
            <Stack align="center" gap="sm" ta="center">
                <Title order={2} fz={{ base: '1.875rem', sm: '2.25rem' }} c="brand">
                    Het Bestuur &amp; Voorkeuren
                </Title>
                <Box
                    w={96}
                    h={6}
                    style={{
                        borderRadius: '9999px',
                        background: 'linear-gradient(to right, transparent, var(--mantine-color-brand-filled), transparent)',
                    }}
                />
                <Text size="sm" fw={500} c="dimmed" maw={560}>
                    Bekijk per bestuurslid de functie, alcoholvoorkeur en veto&apos;s voordat je gaat recipiëren.
                </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                {boardMembers.map((member) => {
                    const memberName = [member.user?.first_name, member.user?.last_name].filter(Boolean).join(' ') || 'Bestuurslid';
                    const vetoList = member.vetoes
                        ? member.vetoes.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean)
                        : [];

                    return (
                        <Card key={member.user_id || member.id} padding="lg" withBorder>
                            <Stack gap="md">
                                <Stack align="center" gap="xs" ta="center">
                                    <Box
                                        pos="relative"
                                        w={128}
                                        h={128}
                                        mb="xs"
                                        style={{
                                            borderRadius: 'var(--mantine-radius-lg)',
                                            overflow: 'hidden',
                                            boxShadow: 'var(--mantine-shadow-md)',
                                            border: '4px solid var(--surface-subtle)',
                                        }}
                                    >
                                        {member.user?.avatar ? (
                                            <Image
                                                src={getImageUrl(member.user.avatar)}
                                                alt={memberName}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                unoptimized
                                            />
                                        ) : (
                                            <FallbackLogo className="object-contain p-4 opacity-45" />
                                        )}
                                    </Box>

                                    <Title order={3} size="h5">
                                        {memberName}
                                    </Title>
                                    <Badge size="sm">
                                        {member.user?.functie || 'Bestuurslid'}
                                    </Badge>
                                </Stack>

                                <Paper p="sm" withBorder>
                                    <Group justify="space-between" align="center">
                                        <Group gap="xs">
                                            <Text span c={member.drinks_alcohol ? 'success' : 'dimmed'} lh={1}>
                                                <Wine size={16} />
                                            </Text>
                                            <Text size="xs" fw={600}>
                                                Alcohol
                                            </Text>
                                        </Group>
                                        {member.drinks_alcohol ? (
                                            <Badge color="success" size="sm">
                                                Drinkt alcohol
                                            </Badge>
                                        ) : (
                                            <Badge color="error" size="sm">
                                                Geen alcohol (0.0%)
                                            </Badge>
                                        )}
                                    </Group>
                                </Paper>

                                <Stack gap={6}>
                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                        Veto&apos;s
                                    </Text>
                                    {vetoList.length > 0 ? (
                                        <Group gap={6} wrap="wrap">
                                            {vetoList.map((veto) => (
                                                <Badge key={veto} color="error" size="md">
                                                    {veto}
                                                </Badge>
                                            ))}
                                        </Group>
                                    ) : (
                                        <Text size="xs" c="dimmed" fs="italic">
                                            Geen specifieke veto&apos;s opgegeven.
                                        </Text>
                                    )}
                                </Stack>

                                {Boolean(member.dietary_requirements) && (
                                    <Stack gap={4}>
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                            Allergieën
                                        </Text>
                                        <Paper
                                            p="sm"
                                            withBorder
                                            style={{
                                                backgroundColor: 'color-mix(in srgb, var(--mantine-color-accent-filled) 10%, transparent)',
                                                borderColor: 'color-mix(in srgb, var(--mantine-color-accent-filled) 25%, transparent)',
                                            }}
                                        >
                                            <Text size="xs" fw={500}>
                                                {member.dietary_requirements}
                                            </Text>
                                        </Paper>
                                    </Stack>
                                )}

                                {Boolean(member.notes) && (
                                    <Stack gap={4}>
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                            Opmerking
                                        </Text>
                                        <Paper
                                            p="sm"
                                            withBorder
                                            style={{
                                                backgroundColor: 'var(--surface-subtle)',
                                                borderColor: 'var(--surface-subtle-border)',
                                            }}
                                        >
                                            <Text size="xs" fw={500}>
                                                {member.notes}
                                            </Text>
                                        </Paper>
                                    </Stack>
                                )}
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
}
