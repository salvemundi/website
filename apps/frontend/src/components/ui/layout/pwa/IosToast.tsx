'use client';

import { Plus, Smartphone, Share } from 'lucide-react';
import { Alert, Badge, Divider, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import ToastHeader from './ToastHeader';

const IOS_STEPS = [
    {
        id: 1,
        icon: <Share size={18} />,
        label: 'Tik op',
        highlight: 'Deel',
        sublabel: 'de knop onderaan in Safari',
    },
    {
        id: 2,
        icon: <Plus size={18} />,
        label: 'Kies',
        highlight: 'Zet op beginscherm',
        sublabel: 'scroll omlaag in het menu',
    },
    {
        id: 3,
        icon: <Smartphone size={18} />,
        label: 'Tik op',
        highlight: 'Voeg toe',
        sublabel: 'rechts bovenin',
    },
];

export default function IosToast({ onDismiss }: { onDismiss: () => void }) {
    return (
        <>
            <ToastHeader onDismiss={onDismiss} />

            <Divider mx="md" />

            <Stack p="md" gap="xs">
                <Text size="xs" fw={600} c="dimmed" style={{ letterSpacing: '0.06em' }}>
                    Hoe installeer je de app?
                </Text>

                {IOS_STEPS.map((step) => (
                    <Paper
                        key={step.id}
                        p="xs"
                        bg="var(--mantine-color-body)"
                        style={{ border: '1px solid var(--mantine-color-default-border)' }}
                    >
                        <Group gap="sm" wrap="nowrap">
                            <Badge circle size="sm">
                                {step.id}
                            </Badge>
                            <ThemeIcon size="md">
                                {step.icon}
                            </ThemeIcon>
                            <Stack gap={2} flex={1} miw={0}>
                                <Text size="xs" lh={1.3}>
                                    {step.label}{' '}
                                    <Text span fw={700}>
                                        {step.highlight}
                                    </Text>
                                </Text>
                                <Text size="xs" c="dimmed" lh={1.3}>
                                    {step.sublabel}
                                </Text>
                            </Stack>
                        </Group>
                    </Paper>
                ))}
            </Stack>

            <Alert mx="md" mb="md" p="xs" icon={<Share size={14} />}>
                <Text size="xs" c="dimmed" lh={1.4}>
                    De <Text span fw={600} c="brand">Deel-knop</Text> staat in de Safari-werkbalk onderaan je scherm
                </Text>
            </Alert>
        </>
    );
}
