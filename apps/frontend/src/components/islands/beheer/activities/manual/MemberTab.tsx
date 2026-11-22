'use client';

import { X } from 'lucide-react';
import { ActionIcon, Avatar, Group, Paper, Stack, Text } from '@mantine/core';
import { type UserBasic } from '@salvemundi/validations';
import BeheerLedenSearch from '@/components/ui/beheer/BeheerLedenSearch';

interface MemberTabProps {
    selectedMember: UserBasic | null;
    onSelect: (user: UserBasic) => void;
    onClear: () => void;
}

export default function MemberTab({
    selectedMember,
    onSelect,
    onClear
}: MemberTabProps) {
    return (
        <Stack gap="xs">
            <Text size="sm" fw={500}>
                Zoek bestaand lid
            </Text>
            {selectedMember ? (
                <Paper withBorder p="md">
                    <Group justify="space-between" align="center" wrap="nowrap" gap="md">
                        <Group gap="md" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                            <Avatar size="lg" color="accent">
                                {selectedMember.first_name?.[0]}{selectedMember.last_name?.[0]}
                            </Avatar>
                            <Stack gap={2} style={{ minWidth: 0 }}>
                                <Text size="sm" fw={600} truncate>
                                    {selectedMember.first_name} {selectedMember.last_name}
                                </Text>
                                <Text size="xs" c="dimmed" truncate>
                                    {selectedMember.email}
                                </Text>
                            </Stack>
                        </Group>
                        <ActionIcon
                            type="button"
                            color="error"
                            size="lg"
                            onClick={onClear}
                            title="Selectie wissen"
                            aria-label="Selectie wissen"
                        >
                            <X size={16} />
                        </ActionIcon>
                    </Group>
                </Paper>
            ) : (
                <BeheerLedenSearch
                    onSelect={onSelect}
                    placeholder="TYP NAAM OM TE ZOEKEN..."
                    autoFocus
                />
            )}
        </Stack>
    );
}
