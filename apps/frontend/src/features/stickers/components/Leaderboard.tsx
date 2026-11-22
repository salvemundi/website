import { Trophy, Medal, Award } from 'lucide-react';
import { Box, Card, Center, Group, Paper, ScrollArea, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import type { StickerPublic } from '@salvemundi/validations';
import type { EnrichedUser } from '@/types/auth';

type StickerCreator = {
    id?: string | number;
    first_name?: string | null;
    last_name?: string | null;
    avatar?: string | null;
};

interface LeaderboardProps {
    stickers: StickerPublic[];
    currentUser?: EnrichedUser | null;
}

export default function Leaderboard({ stickers, currentUser }: LeaderboardProps) {
    const counts = new Map<string, { id: string; name: string; avatar?: string | null; count: number }>();

    for (const s of stickers) {
        const u = s.user_created as StickerCreator | null | undefined;
        const uid = u?.id ? String(u.id) : 'unknown';
        const name = u ? ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || uid : 'Unknown';

        const current = counts.get(uid) || { id: uid, name, avatar: u?.avatar ?? null, count: 0 };
        current.count += 1;
        counts.set(uid, current);
    }

    const leaderboard = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    const podium = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    // Reorder for podium display: [2, 1, 3]
    const podiumDisplay = [
        (podium[1] as typeof podium[0] | undefined) || null,
        (podium[0] as typeof podium[0] | undefined) || null,
        (podium[2] as typeof podium[0] | undefined) || null,
    ];

    return (
        <Card h="100%" padding="lg" style={{ display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="lg">
                <Title order={2} size="h3" c="brand">
                    Leaderboard
                </Title>
                <Text span c="accent" lh={1}>
                    <Trophy size={24} />
                </Text>
            </Group>

            {leaderboard.length === 0 ? (
                <Center
                    flex={1}
                    p="xl"
                    style={{
                        borderRadius: 'var(--mantine-radius-lg)',
                        border: '2px dashed var(--mantine-color-default-border)',
                    }}
                >
                    <Text size="sm" fw={500} c="dimmed" fs="italic" ta="center">
                        Geen plakkers gevonden...
                    </Text>
                </Center>
            ) : (
                <Stack flex={1} gap="lg" style={{ minHeight: 0 }}>
                    <SimpleGrid cols={3} spacing="xs" style={{ alignItems: 'end' }}>
                        {podiumDisplay.map((user, idx) => {
                            if (!user) return <Box key={idx} />;

                            const isGold = idx === 1;
                            const isSilver = idx === 0;
                            const isMe = Boolean(currentUser && String(user.id) === String(currentUser.id));

                            const bgVar = isGold
                                ? 'var(--mantine-color-accent-filled)'
                                : isSilver
                                    ? 'var(--mantine-color-lightPurple-filled)'
                                    : 'var(--mantine-color-purple-filled)';
                            const fgColor = isGold ? 'var(--mantine-color-darkBase-filled)' : 'var(--mantine-color-white)';
                            const labelColor = isGold ? 'accent' : isSilver ? 'lightPurple' : 'brand';

                            return (
                                <Stack key={user.id} align="center" gap="xs">
                                    <Box pos="relative">
                                        <Center
                                            w={{ base: 48, md: 64 }}
                                            h={{ base: 48, md: 64 }}
                                            bg={bgVar}
                                            c={fgColor}
                                            fw={700}
                                            fz={{ base: 'md', md: 'lg' }}
                                            style={{
                                                borderRadius: '9999px',
                                                border: isMe ? '3px solid var(--mantine-color-white)' : '2px solid transparent',
                                                transform: isGold ? 'scale(1.08)' : undefined,
                                                boxShadow: 'var(--mantine-shadow-md)',
                                            }}
                                        >
                                            {user.name ? user.name.split(' ').map((x) => x[0]).slice(0, 2).join('') : '#'}
                                        </Center>
                                        <Center
                                            pos="absolute"
                                            bottom={-4}
                                            right={-4}
                                            w={24}
                                            h={24}
                                            bg={bgVar}
                                            c={fgColor}
                                            style={{
                                                borderRadius: '9999px',
                                                border: '2px solid var(--mantine-color-default)',
                                                boxShadow: 'var(--mantine-shadow-sm)',
                                            }}
                                        >
                                            {isGold ? <Trophy size={12} /> : isSilver ? <Medal size={12} /> : <Award size={12} />}
                                        </Center>
                                    </Box>

                                    <Stack gap={0} w="100%" px={4} align="center">
                                        <Text size="xs" fw={600} truncate w="100%" ta="center">
                                            {user.name}
                                        </Text>
                                        <Text size="xs" fw={700} c={labelColor}>
                                            {user.count} stickers
                                        </Text>
                                    </Stack>

                                    <Center
                                        w="100%"
                                        h={isGold ? { base: 64, md: 80 } : isSilver ? { base: 48, md: 64 } : { base: 32, md: 48 }}
                                        bg={bgVar}
                                        c={fgColor}
                                        fw={700}
                                        fz="xs"
                                        style={{
                                            borderTopLeftRadius: 'var(--mantine-radius-md)',
                                            borderTopRightRadius: 'var(--mantine-radius-md)',
                                        }}
                                    >
                                        {isGold ? '1' : isSilver ? '2' : '3'}
                                    </Center>
                                </Stack>
                            );
                        })}
                    </SimpleGrid>

                    <ScrollArea flex={1} offsetScrollbars="y" style={{ minHeight: 0 }}>
                        <Stack gap={4}>
                            {rest.map((c, idx) => {
                                const isMe = Boolean(currentUser && String(c.id) === String(currentUser.id));
                                return (
                                    <Paper
                                        key={c.id}
                                        p="xs"
                                        bg={isMe ? 'var(--mantine-color-accent-light)' : 'transparent'}
                                        style={isMe ? { border: '1px solid var(--mantine-color-accent-outline)' } : undefined}
                                    >
                                        <Group justify="space-between" wrap="nowrap" gap="sm">
                                            <Stack gap={0} miw={0} flex={1}>
                                                <Text size="sm" fw={500} truncate>
                                                    {c.name}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {c.count} sticker{c.count !== 1 ? 's' : ''}
                                                </Text>
                                            </Stack>
                                            <Text size="xs" fw={600} c="dimmed">
                                                #{idx + 4}
                                            </Text>
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </ScrollArea>
                </Stack>
            )}
        </Card>
    );
}
