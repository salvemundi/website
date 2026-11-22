'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Group, Modal, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface NameConfirmModalProps {
    isOpen: boolean;
    name: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function NameConfirmModal({ isOpen, name, onConfirm, onCancel }: NameConfirmModalProps) {
    return (
        <Modal
            opened={isOpen}
            onClose={onCancel}
            centered
            size="md"
            title={
                <Group gap="xs">
                    <ThemeIcon size="md">
                        <AlertCircle size={18} />
                    </ThemeIcon>
                    <Text size="xs" fw={700} tt="uppercase">
                        Naam Bevestigen
                    </Text>
                </Group>
            }
        >
            <Stack gap="lg" ta="center" pt="xs">
                <Title order={3} size="h2">
                    Klopt je voornaam?
                </Title>

                <Paper
                    p="lg"
                    withBorder
                    style={{
                        backgroundColor: 'var(--surface-subtle)',
                        borderColor: 'var(--surface-subtle-border)',
                    }}
                >
                    <Text size="sm" fw={500} c="dimmed" mb={4}>
                        Ingevulde voornaam:
                    </Text>
                    <Text size="xl" fw={700} c="brand">
                        {name}
                    </Text>
                </Paper>

                <Stack gap={4}>
                    <Text size="md" c="dimmed">
                        Komt dit <Text span fw={700} fs="italic" c="var(--mantine-color-text)">exact</Text> overeen met de naam op je paspoort of ID-kaart?
                    </Text>
                    <Text size="xs" c="dimmed">
                        Een typefout kan leiden tot problemen bij de gate!
                    </Text>
                </Stack>

                <Stack gap="xs">
                    <Button
                        type="button"
                        fullWidth
                        size="md"
                        leftSection={<CheckCircle2 size={18} />}
                        onClick={onConfirm}
                    >
                        Ja, dit klopt exact
                    </Button>
                    <Button
                        type="button"
                        fullWidth
                        size="md"
                        onClick={onCancel}
                    >
                        Nee, aanpassen
                    </Button>
                </Stack>
            </Stack>
        </Modal>
    );
}
