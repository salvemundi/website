'use client';

import { Map as MapIcon, Plus } from 'lucide-react';
import { Box, Button, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { type EnrichedUser } from '@/types/auth';

interface StickerActionPanelProps {
    user: EnrichedUser | null;
    onPlaceSticker: () => void;
    compact?: boolean;
}

export default function StickerActionPanel({ user, onPlaceSticker, compact = false }: StickerActionPanelProps) {
    if (!user) {
        return (
            <Card
                bg="var(--mantine-color-accent-filled)"
                c="var(--mantine-color-darkBase-filled)"
                p={compact ? 'xs' : 'md'}
                shadow="xl"
                w={compact ? '100%' : undefined}
                style={{ pointerEvents: 'auto' }}
            >
                <Group align="flex-start" gap="sm" wrap="nowrap" justify={compact ? 'center' : 'flex-start'}>
                    {!compact && (
                        <ThemeIcon color="darkBase" size="lg">
                            <Plus size={18} />
                        </ThemeIcon>
                    )}
                    <Box ta={compact ? 'center' : 'left'}>
                        <Text size="xs" fw={700} tt="uppercase" lh={1.2}>
                            Login om sticker te plakken
                        </Text>
                        {!compact && (
                            <Text size="xs" mt={4} opacity={0.85}>
                                Alleen leden kunnen nieuwe locaties toevoegen aan de wereldkaart.
                            </Text>
                        )}
                    </Box>
                </Group>
            </Card>
        );
    }

    return (
        <Card
            p={compact ? 'xs' : 'md'}
            shadow="xl"
            w={compact ? '100%' : undefined}
            style={{ pointerEvents: 'auto' }}
        >
            <Stack gap="xs">
                <Button
                    type="button"
                    fullWidth
                    size={compact ? 'xs' : 'sm'}
                    onClick={onPlaceSticker}
                    leftSection={<MapIcon size={16} />}
                >
                    Plaats sticker
                </Button>
                <Text size="xs" fw={600} c="dimmed" ta="center" fs="italic">
                    Kies je huidige locatie of zoek een adres
                </Text>
            </Stack>
        </Card>
    );
}
