'use client';

import React, { useState } from 'react';
import { Plus, Flame, Waves, Edit3 } from 'lucide-react';
import { Box, Button, Card, Group, Stack, TextInput, ThemeIcon, Title } from '@mantine/core';

interface Props {
    onAddBoard: (
        boardName: string,
        activityType: 'shotjes' | 'watervallen' | 'anders',
        activityCustom?: string
    ) => Promise<boolean>;
    isPending?: boolean;
}

export default function CoboAddBoardForm({ onAddBoard, isPending = false }: Props) {
    const [boardName, setBoardName] = useState('');
    const [activityType, setActivityType] = useState<'shotjes' | 'watervallen' | 'anders'>('shotjes');
    const [activityCustom, setActivityCustom] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!boardName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const success = await onAddBoard(
                boardName.trim(),
                activityType,
                activityType === 'anders' ? activityCustom.trim() : undefined
            );

            if (success) {
                setBoardName('');
                setActivityCustom('');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card withBorder padding="lg">
            <Stack gap="md">
                <Group gap="xs">
                    <ThemeIcon size="md">
                        <Plus size={16} />
                    </ThemeIcon>
                    <Title order={3} size="sm">
                        Gasten Toevoegen
                    </Title>
                </Group>

                <Box
                    component="form"
                    onSubmit={(e) => {
                        void handleSubmit(e);
                    }}
                >
                    <Stack gap="sm">
                        <Group align="center" wrap="wrap" gap="sm">
                            <TextInput
                                value={boardName}
                                onChange={(e) => setBoardName(e.currentTarget.value)}
                                placeholder="Naam gasten / vereniging (bijv. sv Innovum)"
                                required
                                style={{ flex: 1, minWidth: 240 }}
                            />

                            <Group gap="xs" wrap="wrap">
                                <Button
                                    type="button"
                                    variant={activityType === 'shotjes' ? 'light' : 'default'}
                                    color={activityType === 'shotjes' ? 'accent' : undefined}
                                    onClick={() => setActivityType('shotjes')}
                                    leftSection={<Flame size={14} />}
                                >
                                    Shotjes
                                </Button>

                                <Button
                                    type="button"
                                    variant={activityType === 'watervallen' ? 'light' : 'default'}
                                    color={activityType === 'watervallen' ? 'brand' : undefined}
                                    onClick={() => setActivityType('watervallen')}
                                    leftSection={<Waves size={14} />}
                                >
                                    Watervallen
                                </Button>

                                <Button
                                    type="button"
                                    variant={activityType === 'anders' ? 'light' : 'default'}
                                    color={activityType === 'anders' ? 'brand' : undefined}
                                    onClick={() => setActivityType('anders')}
                                    leftSection={<Edit3 size={14} />}
                                >
                                    Anders
                                </Button>
                            </Group>
                        </Group>

                        {activityType === 'anders' && (
                            <TextInput
                                value={activityCustom}
                                onChange={(e) => setActivityCustom(e.currentTarget.value)}
                                placeholder="Toelichting bij activiteit (bijv. Radje draaien, Brasopdracht, etc.)"
                            />
                        )}

                        <Group justify="flex-end">
                            <Button
                                type="submit"
                                disabled={isSubmitting || isPending}
                                loading={isSubmitting}
                                leftSection={<Plus size={16} />}
                            >
                                Aan Wachtrij Toevoegen
                            </Button>
                        </Group>
                    </Stack>
                </Box>
            </Stack>
        </Card>
    );
}
