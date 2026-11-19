'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CoboGuestBoard } from '@salvemundi/validations';
import { Clock, AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';
import { Badge, Button, Card, Divider, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface Props {
    coboId: number;
    initialGuestBoards: CoboGuestBoard[];
    limit?: number;
}

interface LiveApiResponse {
    success: boolean;
    guestBoards?: CoboGuestBoard[];
    allBoards?: CoboGuestBoard[];
}

export default function CoboPublicQueueIsland({
    coboId,
    initialGuestBoards,
    limit
}: Props) {
    const [boards, setBoards] = useState<CoboGuestBoard[]>(initialGuestBoards);

    useEffect(() => {
        setBoards(initialGuestBoards);
    }, [initialGuestBoards]);

    useEffect(() => {
        const fetchLiveQueue = async () => {
            try {
                const res = await fetch(`/api/cobo/live?coboId=${coboId}`, {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = (await res.json()) as LiveApiResponse;
                    const newBoards = data.guestBoards || data.allBoards;
                    if (data.success && Array.isArray(newBoards)) {
                        setBoards(newBoards);
                    }
                }
            } catch {
                // Background polling error silent
            }
        };

        const interval = setInterval(() => {
            void fetchLiveQueue();
        }, 5000);
        return () => clearInterval(interval);
    }, [coboId]);

    const currentBoard = boards.find(b => b.status === 'current');
    const allActiveQueue = boards
        .filter(b => b.status === 'waiting' || b.status === 'late')
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const displayedQueue = limit ? allActiveQueue.slice(0, limit) : allActiveQueue;
    const remainingCount = limit ? Math.max(0, allActiveQueue.length - limit) : 0;

    const renderActivityBadge = (type: string | null | undefined, custom?: string | null, isCurrent: boolean = false) => {
        const size = isCurrent ? 'lg' : 'sm';

        if (type === 'shotjes') {
            return (
                <Badge size={size} color="accent" variant="light">
                    Shotjes
                </Badge>
            );
        }
        if (type === 'watervallen') {
            return (
                <Badge size={size} color="lightPurple" variant="light">
                    Watervallen
                </Badge>
            );
        }
        return (
            <Badge size={size} color="brand" variant="light">
                {custom || 'Activiteit'}
            </Badge>
        );
    };

    const hasAnyActive = Boolean(currentBoard || allActiveQueue.length > 0);

    return (
        <Stack gap="lg">
            {!hasAnyActive && (
                <Card padding="xl" radius="xl" withBorder ta="center">
                    <Stack align="center" gap="sm">
                        <ThemeIcon size={56} radius="lg" variant="light" color="brand">
                            <UserCheck size={28} />
                        </ThemeIcon>
                        <Title order={3} size="h4">
                            De wachtlijst is momenteel leeg
                        </Title>
                        <Text size="sm" fw={500} c="dimmed" maw={420}>
                            Meld je aan bij de pedel om op de lijst te komen.
                        </Text>
                    </Stack>
                </Card>
            )}

            {currentBoard && (
                <Card
                    padding="xl"
                    radius="xl"
                    withBorder
                    ta="center"
                    style={{ borderWidth: 2, borderColor: 'color-mix(in srgb, var(--primary) 35%, transparent)' }}
                >
                    <Stack align="center" gap="md">
                        <Group justify="center" gap="sm" wrap="wrap">
                            <Badge size="lg" color="brand" variant="light">
                                Nu aan de beurt
                            </Badge>
                            {renderActivityBadge(currentBoard.activity_type, currentBoard.activity_custom, true)}
                        </Group>
                        <Title order={3} fz={{ base: '1.875rem', sm: '2.25rem' }} c="brand">
                            {currentBoard.board_name}
                        </Title>
                    </Stack>
                </Card>
            )}

            {displayedQueue.length > 0 && (
                <Card padding="lg" radius="xl" withBorder>
                    <Stack gap="md">
                        <Group gap="xs">
                            <Text span c="brand" lh={1}>
                                <Clock size={16} />
                            </Text>
                            <Text size="sm" fw={900} tt="uppercase" c="dimmed">
                                {limit && allActiveQueue.length > limit
                                    ? `Eerstvolgende (${displayedQueue.length} van ${allActiveQueue.length})`
                                    : `Wachtend (${allActiveQueue.length})`}
                            </Text>
                        </Group>
                        <Divider />

                        <Stack gap="xs">
                            {displayedQueue.map((board, index) => {
                                const isLate = board.status === 'late';

                                return (
                                    <Paper
                                        key={board.id}
                                        p="sm"
                                        radius="md"
                                        withBorder={isLate}
                                        style={isLate ? {
                                            backgroundColor: 'color-mix(in srgb, var(--destructive) 8%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--destructive) 25%, transparent)',
                                        } : undefined}
                                    >
                                        <Group justify="space-between" wrap="nowrap" gap="md">
                                            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                                                <ThemeIcon
                                                    size={32}
                                                    radius="md"
                                                    variant="light"
                                                    color={isLate ? 'error' : 'brand'}
                                                >
                                                    <Text size="xs" fw={900}>
                                                        #{index + 1}
                                                    </Text>
                                                </ThemeIcon>

                                                <Group gap="xs" wrap="wrap" style={{ minWidth: 0 }}>
                                                    <Text size="sm" fw={700} truncate>
                                                        {board.board_name}
                                                    </Text>
                                                    {isLate && (
                                                        <Badge
                                                            size="xs"
                                                            color="error"
                                                            variant="light"
                                                            leftSection={<AlertTriangle size={12} />}
                                                        >
                                                            Niet op tijd
                                                        </Badge>
                                                    )}
                                                </Group>
                                            </Group>

                                            {renderActivityBadge(board.activity_type, board.activity_custom)}
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </Stack>

                        {remainingCount > 0 && (
                            <>
                                <Divider />
                                <Button
                                    component={Link}
                                    href="/cobo/wachtlijst"
                                    variant="light"
                                    color="brand"
                                    fullWidth
                                    rightSection={<ArrowRight size={16} />}
                                >
                                    Bekijk nog {remainingCount} {remainingCount === 1 ? 'ander wachtend bestuur' : 'andere wachtende besturen'}
                                </Button>
                            </>
                        )}
                    </Stack>
                </Card>
            )}
        </Stack>
    );
}
