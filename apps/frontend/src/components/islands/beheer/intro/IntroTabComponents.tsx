import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { ActionIcon, Paper, Stack, Text, ThemeIcon } from '@mantine/core';

export function ActionButton({
    icon: Icon,
    onClick,
    variant = 'accent',
    disabled = false,
    loading = false,
    title
}: {
    icon: LucideIcon;
    onClick: (e: React.MouseEvent) => void;
    variant?: 'accent' | 'danger' | 'muted';
    disabled?: boolean;
    loading?: boolean;
    title?: string;
}) {
    const color = variant === 'danger' ? 'error' : variant === 'accent' ? 'accent' : undefined;
    const mVariant = variant === 'muted' ? 'default' : 'light';

    return (
        <ActionIcon
            type="button"
            variant={mVariant}
            color={color}
            size="lg"
            onClick={onClick}
            disabled={disabled || loading}
            loading={loading}
            title={title}
            aria-label={title}
        >
            <Icon size={16} />
        </ActionIcon>
    );
}

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <Paper withBorder p="xl" ta="center" radius="lg" style={{ borderStyle: 'dashed' }}>
            <Stack align="center" gap="md" py="xl">
                <ThemeIcon size={64} radius="xl" variant="light" color="accent">
                    <Icon size={32} />
                </ThemeIcon>
                <Text size="sm" fw={600} c="dimmed">{text}</Text>
            </Stack>
        </Paper>
    );
}
