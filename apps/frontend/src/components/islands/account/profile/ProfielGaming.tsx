'use client';

import React from 'react';
import { Gamepad2, Pen, Save } from 'lucide-react';
import { ActionIcon, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { Tile, formatForBreak } from './ProfielUI';
import { UseFormRegister, UseFormHandleSubmit } from 'react-hook-form';

interface ProfielGamingProps {
    user?: {
        minecraft_username?: string | null;
    };
    isEditingMinecraft?: boolean;
    setIsEditingMinecraft?: (val: boolean) => void;
    registerMinecraft: UseFormRegister<{ minecraft_username?: string | null }>;
    handleSubmitMinecraft: UseFormHandleSubmit<{ minecraft_username?: string | null }>;
    onSaveMinecraft?: (data: { minecraft_username?: string | null }) => void;
    isPending?: boolean;
}

export default function ProfielGaming({
    user = {},
    isEditingMinecraft = false,
    setIsEditingMinecraft = () => { },
    registerMinecraft,
    handleSubmitMinecraft,
    onSaveMinecraft = () => { },
    isPending = false
}: ProfielGamingProps) {
    return (
        <Tile title="Social Gaming" icon={<Gamepad2 size={20} />}>
            <Stack gap={6}>
                <Group justify="space-between" align="center" pl={4} h={20}>
                    <Text size="xs" fw={900} tt="uppercase" c="brand">
                        Minecraft Username
                    </Text>
                    {!isEditingMinecraft && (
                        <ActionIcon
                            type="button"
                            size="sm"
                            onClick={() => setIsEditingMinecraft(true)}
                            aria-label="Minecraft username bewerken"
                        >
                            <Pen size={14} />
                        </ActionIcon>
                    )}
                </Group>

                <Paper p="md" withBorder mih={68}>
                    <Group gap="sm" wrap="nowrap" h="100%">
                        <Text span c="brand" lh={1}>
                            <Gamepad2 size={20} />
                        </Text>
                        {isEditingMinecraft ? (
                            <form
                                onSubmit={(e) => {
                                    void handleSubmitMinecraft(onSaveMinecraft)(e);
                                }}
                                style={{ flex: 1, minWidth: 0 }}
                                autoComplete="off"
                            >
                                <Group gap="xs" wrap="nowrap">
                                    <TextInput
                                        {...registerMinecraft('minecraft_username')}
                                        placeholder="Username"
                                        autoComplete="off"
                                        style={{ flex: 1 }}
                                    />
                                    <ActionIcon
                                        type="submit"
                                        size="lg"
                                        loading={isPending}
                                        aria-label="Minecraft username opslaan"
                                    >
                                        <Save size={16} />
                                    </ActionIcon>
                                </Group>
                            </form>
                        ) : (
                            <Text size="sm" fw={700} style={{ wordBreak: 'break-word', minWidth: 0, flex: 1 }}>
                                {formatForBreak(user.minecraft_username) || 'Niet ingesteld'}
                            </Text>
                        )}
                    </Group>
                </Paper>
            </Stack>
        </Tile>
    );
}
