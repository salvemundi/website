'use client';

import { Plus, Smartphone, Share } from 'lucide-react';
import { Alert, Badge, Divider, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import ToastHeader from './ToastHeader';

function IosShareIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v12M8 6l4-4 4 4" />
            <path d="M4 14v6a1 1 0 001 1h14a1 1 0 001-1v-6" />
        </svg>
    );
}

const IOS_STEPS = [
    {
        id: 1,
        icon: <IosShareIcon />,
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
                        radius="md"
                        bg="var(--mantine-color-body)"
                        style={{ border: '1px solid var(--border)' }}
                    >
                        <Group gap="sm" wrap="nowrap">
                            <Badge circle size="sm" variant="light" color="brand">
                                {step.id}
                            </Badge>
                            <ThemeIcon variant="light" color="brand" size="md" radius="md">
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

            <Alert variant="light" color="brand" mx="md" mb="md" p="xs" radius="md" icon={<Share size={14} />}>
                <Text size="xs" c="dimmed" lh={1.4}>
                    De <Text span fw={600} c="brand">Deel-knop</Text> staat in de Safari-werkbalk onderaan je scherm
                </Text>
            </Alert>
        </>
    );
}
