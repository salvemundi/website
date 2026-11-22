'use client';

import { Smartphone, X } from 'lucide-react';
import { ActionIcon, Group, Stack, Text, ThemeIcon } from '@mantine/core';

export default function ToastHeader({ onDismiss }: { onDismiss: () => void }) {
    return (
        <Group align="center" gap="md" p="md" wrap="nowrap">
            <ThemeIcon size="lg">
                <Smartphone size={20} />
            </ThemeIcon>

            <Stack gap={2} flex={1} miw={0}>
                <Text fw={600} size="sm" lh={1.3}>
                    Installeer de app
                </Text>
                <Text size="xs" c="dimmed" lh={1.4}>
                    Snellere toegang tot al onze functies
                </Text>
            </Stack>

            <ActionIcon
                id="pwa-dismiss-btn"
                type="button"
                size="md"
                onClick={onDismiss}
                aria-label="Melding een week verbergen"
                title="Een week niet tonen"
            >
                <X size={16} />
            </ActionIcon>
        </Group>
    );
}
