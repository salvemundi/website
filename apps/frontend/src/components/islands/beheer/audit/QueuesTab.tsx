'use client';

import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import {
    Badge,
    Button,
    Center,
    Divider,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Table,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import type { QueueInfo } from '@salvemundi/validations';

interface QueueTask {
    email?: string | null;
    userId?: string | null;
    retries: number;
    maxRetries: number;
}

interface QueuesTabProps {
    queueData: { new_users?: QueueInfo; sync_existing?: QueueInfo } | null;
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
}

export default function QueuesTab({ queueData, isLoading = false, error, onRefresh }: QueuesTabProps) {
    if (isLoading && !queueData) {
        return (
            <Paper withBorder radius="lg" p="xl">
                <Center py="xl">
                    <Stack align="center" gap="sm" ta="center">
                        <Loader color="brand" size="md" />
                        <Title order={4}>Wachtrijstatus ophalen...</Title>
                        <Text size="xs" c="dimmed" maw={420}>
                            De actuele gegevens worden opgehaald van de Azure Management Service.
                        </Text>
                    </Stack>
                </Center>
            </Paper>
        );
    }

    if (!queueData) {
        return (
            <Paper withBorder radius="lg" p="xl">
                <Center py="md">
                    <Stack align="center" gap="md" ta="center">
                        <ThemeIcon size={48} radius="md" variant="light" color="accent">
                            <AlertCircle size={24} />
                        </ThemeIcon>
                        <Stack gap={4} align="center">
                            <Title order={4}>Wachtrijmonitoring niet beschikbaar</Title>
                            <Text size="xs" c="dimmed" maw={440}>
                                {error || "De Azure Management Service is momenteel offline of niet bereikbaar vanaf deze omgeving. Zorg dat de service draait of verbind met de VPN als je lokaal ontwikkelt."}
                            </Text>
                        </Stack>
                        {onRefresh && (
                            <Button
                                type="button"
                                color="brand"
                                size="xs"
                                leftSection={<RefreshCw size={14} />}
                                loading={isLoading}
                                onClick={onRefresh}
                            >
                                Opnieuw proberen
                            </Button>
                        )}
                    </Stack>
                </Center>
            </Paper>
        );
    }

    return (
        <Stack gap="md">
            {onRefresh && (
                <Group justify="flex-end">
                    <Button
                        type="button"
                        variant="default"
                        size="xs"
                        leftSection={<RefreshCw size={14} />}
                        loading={isLoading}
                        onClick={onRefresh}
                    >
                        Vernieuwen
                    </Button>
                </Group>
            )}

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {(['new_users', 'sync_existing'] as const).map((qKey) => {
                    const q = qKey === 'new_users' ? queueData.new_users : queueData.sync_existing;
                    return (
                        <Paper key={qKey} withBorder radius="lg" style={{ overflow: 'hidden' }}>
                            <Group justify="space-between" align="center" p="lg">
                                <Stack gap={2}>
                                    <Title order={4}>
                                        {qKey === 'new_users' ? 'Nieuwe Leden Wachtrij' : 'Sync Wachtrij'}
                                    </Title>
                                    <Text size="xs" c="dimmed">
                                        Redis: {qKey === 'new_users' ? 'v7:queue:provision:new_user' : 'v7:queue:provision:sync_existing'}
                                    </Text>
                                </Stack>
                                <Badge color="brand" variant="light" size="lg">
                                    {q?.count || 0}
                                </Badge>
                            </Group>

                            <Divider />

                            {!q?.samples || q.samples.length === 0 ? (
                                <Center py="xl">
                                    <Stack align="center" gap="xs" py="md">
                                        <Text span c="success" style={{ opacity: 0.25 }} lh={1}>
                                            <CheckCircle size={40} />
                                        </Text>
                                        <Text size="xs" c="dimmed" fw={500}>
                                            Geen actieve taken
                                        </Text>
                                    </Stack>
                                </Center>
                            ) : (
                                <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Target</Table.Th>
                                            <Table.Th ta="center">Retries</Table.Th>
                                            <Table.Th ta="right">Status</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {(q.samples as QueueTask[]).map((task, idx) => (
                                            <Table.Tr key={task.userId ?? task.email ?? idx}>
                                                <Table.Td>
                                                    <Text size="xs" fw={600}>
                                                        {task.email || task.userId || 'Onbekend'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Text size="xs" fw={600}>
                                                        {task.retries} / {task.maxRetries}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Badge color="accent" variant="light" size="xs">
                                                        Wachtend
                                                    </Badge>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Paper>
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
}
