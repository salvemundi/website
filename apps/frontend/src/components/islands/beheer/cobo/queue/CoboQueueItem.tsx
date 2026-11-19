'use client';

import React from 'react';
import { type CoboGuestBoard } from '@salvemundi/validations';
import { ActionIcon, Box, Button, Group, Paper, Select, Stack, Text } from '@mantine/core';
import { GripVertical, ArrowUpToLine, MoveUp, MoveDown, Play, Clock, Trash2 } from 'lucide-react';
import CoboActivityBadge from './CoboActivityBadge';

interface Props {
    board: CoboGuestBoard;
    index: number;
    totalCount: number;
    isDragged: boolean;
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onStatusChange: (id: number, status: string, name: string) => void;
    onDelete: (id: number, name: string) => void;
}

export default function CoboQueueItem({
    board,
    index,
    totalCount,
    isDragged,
    isDragOver,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onReorder,
    onStatusChange,
    onDelete
}: Props) {
    const positionOptions = Array.from({ length: totalCount }, (_, pIdx) => ({
        value: (pIdx + 1).toString(),
        label: `#${pIdx + 1}`
    }));

    return (
        <Paper
            withBorder
            p="md"
            radius="md"
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            style={{
                opacity: isDragged ? 0.4 : 1,
                borderColor: isDragged || isDragOver ? 'var(--mantine-color-brand-filled)' : undefined,
                backgroundColor: isDragOver ? 'var(--mantine-color-brand-light)' : undefined,
                transition: 'all 150ms ease',
            }}
        >
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                    <Box
                        c="dimmed"
                        style={{ cursor: 'grab', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        title="Sleep om volgorde direct te wijzigen"
                    >
                        <GripVertical size={16} />
                    </Box>

                    <Box title="Klik om direct naar positie te springen" style={{ flexShrink: 0 }}>
                        <Select
                            value={(index + 1).toString()}
                            onChange={(val) => {
                                if (!val) return;
                                const targetPos = parseInt(val, 10) - 1;
                                onReorder(index, targetPos);
                            }}
                            data={positionOptions}
                            size="xs"
                            w={76}
                            allowDeselect={false}
                            aria-label="Positie in wachtrij"
                        />
                    </Box>

                    <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                        <Text size="sm" fw={600} truncate>
                            {board.board_name}
                        </Text>
                        <Group gap="xs">
                            <CoboActivityBadge
                                type={board.activity_type}
                                custom={board.activity_custom}
                            />
                        </Group>
                    </Stack>
                </Group>

                <Group gap={6} wrap="wrap" justify="flex-end">
                    {index > 0 && (
                        <Button
                            type="button"
                            variant="light"
                            color="brand"
                            size="xs"
                            onClick={() => onReorder(index, 0)}
                            title="Direct naar boven (#1)"
                            leftSection={<ArrowUpToLine size={14} />}
                        >
                            Naar #1
                        </Button>
                    )}

                    <ActionIcon.Group>
                        <ActionIcon
                            type="button"
                            variant="default"
                            size="md"
                            onClick={() => onReorder(index, index - 1)}
                            disabled={index === 0}
                            title="Eén plek omhoog"
                            aria-label="Eén plek omhoog"
                        >
                            <MoveUp size={14} />
                        </ActionIcon>
                        <ActionIcon
                            type="button"
                            variant="default"
                            size="md"
                            onClick={() => onReorder(index, index + 1)}
                            disabled={index === totalCount - 1}
                            title="Eén plek omlaag"
                            aria-label="Eén plek omlaag"
                        >
                            <MoveDown size={14} />
                        </ActionIcon>
                    </ActionIcon.Group>

                    <Button
                        type="button"
                        variant="light"
                        color="brand"
                        size="xs"
                        onClick={() => onStatusChange(board.id, 'current', board.board_name || 'Bestuur')}
                        title="Nu aan de beurt zetten"
                        leftSection={<Play size={12} />}
                    >
                        Nu
                    </Button>

                    <ActionIcon
                        type="button"
                        variant="subtle"
                        color="accent"
                        onClick={() => onStatusChange(board.id, 'late', board.board_name || 'Bestuur')}
                        title="Markeren als niet op tijd"
                        aria-label="Markeren als niet op tijd"
                    >
                        <Clock size={14} />
                    </ActionIcon>

                    <ActionIcon
                        type="button"
                        variant="subtle"
                        color="error"
                        onClick={() => onDelete(board.id, board.board_name || 'Bestuur')}
                        title="Verwijderen"
                        aria-label="Verwijderen"
                    >
                        <Trash2 size={14} />
                    </ActionIcon>
                </Group>
            </Group>
        </Paper>
    );
}
