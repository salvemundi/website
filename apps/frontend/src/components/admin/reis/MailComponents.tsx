'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Button, Group, Paper, Select, Stack, Text, ThemeIcon } from '@mantine/core';

export function Card({ title, icon, children }: { title: string, icon: ReactNode, children: ReactNode }) {
    return (
        <Paper withBorder p="lg">
            <Stack gap="md">
                <Group gap="sm">
                    <ThemeIcon color="accent" size="md">
                        {icon}
                    </ThemeIcon>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" lts={1}>
                        {title}
                    </Text>
                </Group>
                {children}
            </Stack>
        </Paper>
    );
}

export function FilterField({
    label,
    value,
    onChange,
    options
}: {
    label: string,
    value: string,
    onChange: (fieldValue: string) => void,
    options: { value: string; label: string }[]
}) {
    return (
        <Select
            label={label}
            value={value}
            onChange={(val) => {
                if (val !== null) onChange(val);
            }}
            data={options}
            size="sm"
            allowDeselect={false}
        />
    );
}

export function TypeTab({ active, onClick, children }: { active: boolean, onClick: () => void, children: ReactNode }) {
    return (
        <Button
            type="button"
            variant={active ? 'filled' : 'subtle'}
            color={active ? 'accent' : undefined}
            size="xs"
            onClick={onClick}
        >
            {children}
        </Button>
    );
}

export function TickItem({ children }: { children: ReactNode }) {
    return (
        <Group component="li" gap="sm" wrap="nowrap" py={2}>
            <ThemeIcon size="sm" color="success">
                <Check size={12} />
            </ThemeIcon>
            <Text size="xs" fw={600} c="dimmed">
                {children}
            </Text>
        </Group>
    );
}
