'use client';

import { Users } from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Card,
    Center,
    Group,
    Loader,
    Modal,
    Paper,
    Stack,
    Table,
    Text,
    ThemeIcon,
} from '@mantine/core';
import {
    mapActivityOptionIdToName,
    parseActivityOptions,
    parseSelectedOptions,
} from '@/lib/reis';

export interface Signup {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    trip_signup_id: number | null;
    selected_options?: unknown;
}

interface Props {
    activityName: string;
    options?: unknown;
    signups: Signup[];
    loading: boolean;
    onClose: () => void;
}

export default function ReisActivitySignupsModal({
    activityName,
    options,
    signups,
    loading,
    onClose,
}: Props) {
    return (
        <Modal
            opened
            onClose={onClose}
            size="xl"
            centered
            title={
                <Group gap="sm">
                    <ThemeIcon size={40} radius="md" variant="light" color="brand">
                        <Users size={20} />
                    </ThemeIcon>
                    <Box>
                        <Text fw={700} size="lg">
                            Inschrijvingen
                        </Text>
                        <Text size="xs" c="dimmed">
                            {activityName}
                        </Text>
                    </Box>
                </Group>
            }
        >
            <Stack gap="lg">
                {loading ? (
                    <Center py={64}>
                        <Stack align="center" gap="sm">
                            <Loader size="lg" color="brand" />
                            <Text size="xs" fw={600} c="dimmed">
                                Data laden...
                            </Text>
                        </Stack>
                    </Center>
                ) : signups.length === 0 ? (
                    <Paper
                        withBorder
                        py={64}
                        radius="lg"
                        style={{ borderStyle: 'dashed' }}
                        ta="center"
                    >
                        <Stack align="center" gap="md">
                            <ThemeIcon size={64} radius="xl" variant="default">
                                <Users size={28} />
                            </ThemeIcon>
                            <Text size="sm" fw={600} c="dimmed">
                                Nog geen inschrijvingen voor deze activiteit.
                            </Text>
                        </Stack>
                    </Paper>
                ) : (
                    <Card p={0} withBorder shadow="xs" style={{ overflow: 'hidden' }}>
                        <Table.ScrollContainer minWidth={520}>
                            <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Reiziger</Table.Th>
                                        <Table.Th>Contact</Table.Th>
                                        <Table.Th>Gekozen Opties</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {signups.map((s) => {
                                        const travelerName =
                                            `${s.first_name} ${s.last_name}`.trim() ||
                                            'Onbekende reiziger';
                                        const travelerEmail = s.email || '-';
                                        const rawSelected = parseSelectedOptions(s.selected_options);
                                        const metaOptions = parseActivityOptions(options);
                                        const selectedIds = Object.entries(rawSelected)
                                            .filter(([, isSelected]) => isSelected)
                                            .map(([id]) => id);

                                        return (
                                            <Table.Tr key={s.id}>
                                                <Table.Td>
                                                    <Text size="sm" fw={600}>
                                                        {travelerName}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="xs" c="dimmed" tt="lowercase">
                                                        {travelerEmail}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    {selectedIds.length === 0 ? (
                                                        <Text size="xs" c="dimmed" fs="italic">
                                                            Geen opties
                                                        </Text>
                                                    ) : (
                                                        <Group gap={6} wrap="wrap">
                                                            {selectedIds.map((optId, i) => (
                                                                <Badge
                                                                    key={i}
                                                                    size="xs"
                                                                    variant="light"
                                                                    color="brand"
                                                                >
                                                                    {mapActivityOptionIdToName(
                                                                        optId,
                                                                        metaOptions
                                                                    )}
                                                                </Badge>
                                                            ))}
                                                        </Group>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                                <Table.Tfoot>
                                    <Table.Tr>
                                        <Table.Td colSpan={3}>
                                            <Text size="xs" fw={600} c="dimmed">
                                                Totaal: {signups.length}{' '}
                                                {signups.length === 1
                                                    ? 'aanmelding'
                                                    : 'aanmeldingen'}
                                            </Text>
                                        </Table.Td>
                                    </Table.Tr>
                                </Table.Tfoot>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>
                )}

                <Group justify="flex-end">
                    <Button type="button" onClick={onClose}>
                        Venster Sluiten
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
