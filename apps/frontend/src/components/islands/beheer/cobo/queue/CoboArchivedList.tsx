'use client';

import { type CoboGuestBoard } from '@salvemundi/validations';
import { ActionIcon, Button, Card, Group, Paper, Stack, Text } from '@mantine/core';
import { CheckCircle2, Clock, RotateCcw, Trash2 } from 'lucide-react';
import CoboActivityBadge from './CoboActivityBadge';

interface Props {
    type: 'completed' | 'late';
    boards: CoboGuestBoard[];
    onRestore: (id: number, name: string) => void;
    onDelete?: (id: number, name: string) => void;
}

export default function CoboArchivedList({
    type,
    boards,
    onRestore,
    onDelete
}: Props) {
    const isCompleted = type === 'completed';

    if (boards.length === 0) {
        return (
            <Paper withBorder p="xl" ta="center" style={{ borderStyle: 'dashed' }}>
                <Stack align="center" gap="xs" py="md">
                    {isCompleted ? (
                        <CheckCircle2 size={36} opacity={0.35} />
                    ) : (
                        <Clock size={36} opacity={0.35} />
                    )}
                    <Text size="sm" fw={500} c="dimmed">
                        {isCompleted
                            ? 'Nog geen besturen geweest.'
                            : 'Geen te late of afwezige besturen.'}
                    </Text>
                </Stack>
            </Paper>
        );
    }

    return (
        <Stack gap="xs">
            {boards.map((board) => (
                <Card
                    key={board.id}
                    withBorder
                    padding="md"
                    style={
                        isCompleted
                            ? { opacity: 0.85 }
                            : { borderColor: 'var(--mantine-color-accent-outline)' }
                    }
                >
                    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                        <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                            <Text
                                size="sm"
                                fw={600}
                                c={isCompleted ? 'dimmed' : undefined}
                                td={isCompleted ? 'line-through' : undefined}
                                truncate
                            >
                                {board.board_name}
                            </Text>
                            <Group gap="xs">
                                <CoboActivityBadge
                                    type={board.activity_type}
                                    custom={board.activity_custom}
                                />
                            </Group>
                        </Stack>

                        <Group gap="xs" wrap="nowrap">
                            <Button
                                type="button"
                                size="xs"
                                onClick={() => onRestore(board.id, board.board_name || 'Bestuur')}
                                leftSection={<RotateCcw size={14} />}
                            >
                                {isCompleted ? 'Herstel naar wachtrij' : 'Terug in wachtrij'}
                            </Button>

                            {!isCompleted && onDelete && (
                                <ActionIcon
                                    type="button"
                                    color="error"
                                    onClick={() => onDelete(board.id, board.board_name || 'Bestuur')}
                                    title="Verwijderen"
                                    aria-label="Verwijderen"
                                >
                                    <Trash2 size={16} />
                                </ActionIcon>
                            )}
                        </Group>
                    </Group>
                </Card>
            ))}
        </Stack>
    );
}
