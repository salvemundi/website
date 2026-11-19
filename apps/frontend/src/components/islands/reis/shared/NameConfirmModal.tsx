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
            radius="xl"
            size="md"
            title={
                <Group gap="xs">
                    <ThemeIcon size="md" radius="md" variant="light" color="brand">
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
                    radius="lg"
                    withBorder
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--primary) 6%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                    }}
                >
                    <Text size="sm" fw={500} c="dimmed" mb={4}>
                        Ingevulde voornaam:
                    </Text>
                    <Text size="xl" fw={700} c="brand">
                        {name}
                    </Text>
                </Paper>

                <Text size="md" c="dimmed">
                    Komt dit <Text span fw={700} fs="italic" c="var(--mantine-color-text)">exact</Text> overeen met de naam op je paspoort of ID-kaart?
                    <br />
                    <Text span size="xs" mt="xs" display="inline-block">
                        Een typefout kan leiden tot problemen bij de gate!
                    </Text>
                </Text>

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
                        variant="default"
                        onClick={onCancel}
                    >
                        Nee, aanpassen
                    </Button>
                </Stack>
            </Stack>
        </Modal>
    );
}
