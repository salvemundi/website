'use client';

import Link from 'next/link';
import { Pizza, Trophy, History, ChevronRight } from 'lucide-react';
import { Anchor, Button, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import type { PizzaStats } from '@salvemundi/validations';
import { Tile } from '@/components/islands/account/profile/ProfielUI';
import { formatDate } from '@/shared/lib/utils/date';
import { formatEuro } from './pizza-utils';

function StatTile({ label, value }: { label: string; value: string | number }) {
    return (
        <Paper p="md" withBorder>
            <Text size="xs" fw={900} tt="uppercase" c="dimmed">
                {label}
            </Text>
            <Text size="1.5rem" fw={900} mt={4}>
                {value}
            </Text>
        </Paper>
    );
}

export function PizzaStatsIsland({ stats }: { stats: PizzaStats | null }) {
    if (!stats || (stats.totalOrders === 0 && stats.roundsCreated === 0)) {
        return (
            <Paper p="xl" radius="lg" withBorder ta="center" style={{ borderStyle: 'dashed' }}>
                <Stack align="center" gap="md">
                    <Text size="sm" fw={700} c="dimmed">
                        Je hebt nog geen pizza&apos;s besteld. Doe mee met een ronde!
                    </Text>
                    <Button component={Link} href="/pizza" leftSection={<Pizza size={16} />}>
                        Naar de rondes
                    </Button>
                </Stack>
            </Paper>
        );
    }

    return (
        <Stack gap="xl">
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                <StatTile label="Totaal bestellingen" value={stats.totalOrders} />
                <StatTile label="Totaal besteed" value={formatEuro(stats.totalSpent)} />
                <StatTile label="Rondes gestart" value={stats.roundsCreated} />
                <StatTile label="Rondes meebesteld" value={stats.roundsJoined} />
            </SimpleGrid>

            <Tile title="Jouw meest bestelde pizza's" icon={<Trophy size={22} />}>
                {stats.topPizzas.length === 0 ? (
                    <Text size="sm" c="dimmed">
                        Nog geen bestellingen.
                    </Text>
                ) : (
                    <Stack gap="xs">
                        {stats.topPizzas.slice(0, 5).map((p, i) => (
                            <Paper key={p.itemName} p="sm" radius="md" withBorder>
                                <Group justify="space-between" gap="sm">
                                    <Text size="sm" fw={700}>
                                        <Text span c="brand" mr="xs">{i + 1}.</Text>
                                        {p.itemName}
                                    </Text>
                                    <Text size="sm" fw={900}>
                                        {p.count}×
                                    </Text>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Tile>

            <Tile title="Recente bestellingen" icon={<History size={22} />}>
                {stats.recent.length === 0 ? (
                    <Text size="sm" c="dimmed">
                        Nog geen bestellingen.
                    </Text>
                ) : (
                    <Stack gap="xs">
                        {stats.recent.map((r) => (
                            <Anchor key={`${r.roundId}-${r.orderedAt}-${r.itemName}`} component={Link} href={`/pizza/${r.roundId}`} underline="never">
                                <Paper p="sm" radius="md" withBorder>
                                    <Group justify="space-between" wrap="nowrap" gap="sm">
                                        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                                            <Text size="sm" fw={900} c="brand" truncate>
                                                {r.itemName}{r.size ? ` (${r.size})` : ''}
                                            </Text>
                                            <Text size="xs" c="dimmed" truncate>
                                                {r.title} · {formatDate(r.orderedAt, 'd MMMM yyyy')}
                                            </Text>
                                        </Stack>
                                        <Group gap="xs" wrap="nowrap">
                                            <Text size="sm" fw={900} style={{ whiteSpace: 'nowrap' }}>
                                                {formatEuro(r.price)}
                                            </Text>
                                            <Text span c="brand" lh={1}>
                                                <ChevronRight size={16} />
                                            </Text>
                                        </Group>
                                    </Group>
                                </Paper>
                            </Anchor>
                        ))}
                    </Stack>
                )}
            </Tile>
        </Stack>
    );
}
