'use client';

import { Sparkles } from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Modal,
    Paper,
    ScrollArea,
    SimpleGrid,
    Stack,
    Text,
} from '@mantine/core';

interface PreviewSignup {
    signupId: number;
    name: string;
    amountTickets: number;
    oldGroup: string | null;
}

interface DistributionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewData: {
        assignments: { signupId: number; groupName: string }[];
        groups: { name: string; signups: PreviewSignup[]; ticketCount: number }[];
    } | null;
    isPending: boolean;
    onSave: () => void;
}

export default function DistributionPreviewModal({
    isOpen,
    onClose,
    previewData,
    isPending,
    onSave,
}: DistributionPreviewModalProps) {
    if (!previewData) return null;

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            size="xl"
            centered
            title={
                <Group gap="xs">
                    <Text span c="brand" lh={1}>
                        <Sparkles size={18} />
                    </Text>
                    <Text fw={700}>Automatische Verdeling Preview</Text>
                </Group>
            }
        >
            <Stack gap="lg">
                <Text size="xs" c="dimmed">
                    Controleer de voorgestelde indeling voordat je deze definitief opslaat. Bestaande groepsindelingen worden hiermee overschreven.
                </Text>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {previewData.groups.map(
                        ({ name: groupName, signups: assignedSignups, ticketCount }) => (
                            <Card key={groupName} withBorder p="md" shadow="xs">
                                <Stack gap="sm">
                                    <Group justify="space-between">
                                        <Text size="xs" fw={700}>
                                            {groupName}
                                        </Text>
                                        <Badge size="xs" variant="light" color="brand">
                                            {ticketCount} {ticketCount === 1 ? 'persoon' : 'personen'}
                                        </Badge>
                                    </Group>
                                    <Divider />
                                    <ScrollArea.Autosize mah={192}>
                                        <Stack gap={6}>
                                            {assignedSignups.length === 0 ? (
                                                <Text size="xs" c="dimmed" fs="italic">
                                                    Geen aanmeldingen verdeeld naar deze groep
                                                </Text>
                                            ) : (
                                                assignedSignups.map((s, idx) => {
                                                    const changed = s.oldGroup !== groupName;
                                                    return (
                                                        <Paper
                                                            key={idx}
                                                            withBorder
                                                            px="xs"
                                                            py={6}
                                                            radius="sm"
                                                        >
                                                            <Group
                                                                justify="space-between"
                                                                wrap="nowrap"
                                                            >
                                                                <Box miw={0}>
                                                                    <Text
                                                                        size="xs"
                                                                        fw={600}
                                                                        truncate
                                                                        title={s.name}
                                                                    >
                                                                        {s.name}
                                                                    </Text>
                                                                    {changed && (
                                                                        <Text size="xs" c="accent">
                                                                            Was:{' '}
                                                                            {s.oldGroup ||
                                                                                'Niet ingedeeld'}
                                                                        </Text>
                                                                    )}
                                                                </Box>
                                                                <Text
                                                                    size="xs"
                                                                    fw={700}
                                                                    c="dimmed"
                                                                    style={{ flexShrink: 0 }}
                                                                >
                                                                    {s.amountTickets}{' '}
                                                                    {s.amountTickets === 1
                                                                        ? 'persoon'
                                                                        : 'personen'}
                                                                </Text>
                                                            </Group>
                                                        </Paper>
                                                    );
                                                })
                                            )}
                                        </Stack>
                                    </ScrollArea.Autosize>
                                </Stack>
                            </Card>
                        )
                    )}
                </SimpleGrid>

                <Divider />

                <Group justify="space-between" wrap="wrap" gap="md">
                    <Text size="xs" fw={600} c="dimmed">
                        Totaal te verdelen:{' '}
                        <Text span fw={700} c="var(--mantine-color-text)">
                            {previewData.assignments.length} aanmeldingen
                        </Text>
                    </Text>
                    <Group gap="sm">
                        <Button type="button" variant="default" onClick={onClose}>
                            Annuleren
                        </Button>
                        <Button
                            type="button"
                            color="success"
                            onClick={onSave}
                            loading={isPending}
                        >
                            Indeling Opslaan
                        </Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    );
}
