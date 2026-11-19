'use client';

import React from 'react';
import { Group, Loader, Paper, Switch, Text } from '@mantine/core';
import { useGuardAccess } from '@/components/ui/beheer/BeheerGuardClient';

interface AdminVisibilityToggleProps {
    isVisible: boolean;
    onToggle: () => void;
    isPending?: boolean;
    label?: React.ReactNode;
    disabled?: boolean;
}

export default function BeheerVisibilityToggle({
    isVisible,
    onToggle,
    isPending = false,
    label = 'Zichtbaarheid',
    disabled = false
}: AdminVisibilityToggleProps) {
    const { canToggleVisibility } = useGuardAccess();

    if (!canToggleVisibility) {
        return null;
    }

    return (
        <Paper
            withBorder
            radius="md"
            px="sm"
            py={6}
            style={{
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : undefined,
            }}
        >
            <Group gap="xs" wrap="nowrap">
                <Text size="xs" fw={600} style={{ whiteSpace: 'nowrap' }}>
                    {label}
                </Text>
                <Switch
                    checked={isVisible}
                    onChange={onToggle}
                    disabled={isPending || disabled}
                    color="success"
                    size="md"
                    aria-label={typeof label === 'string' ? label : 'Toggle zichtbaarheid'}
                    thumbIcon={isPending ? <Loader size={10} /> : undefined}
                />
            </Group>
        </Paper>
    );
}