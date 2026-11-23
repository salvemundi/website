'use client';

import { RefreshCw, CheckCircle, XCircle, Tag } from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Center,
    Checkbox,
    Divider,
    Group,
    Paper,
    Stack,
    Table,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';
import { type PendingSignup } from '@salvemundi/validations/schema/audit.zod';
import { formatDate } from '@/shared/lib/utils/date';

interface PendingTabProps {
    isProcessing: string | null;
    isBulkProcessing: 'approve' | 'reject' | null;
    filteredSignups: PendingSignup[];
    selectedIds: Set<string>;
    onToggleSelectAll: () => void;
    onToggleSelectOne: (id: string) => void;
    onApprove: (id: string, type: string) => void;
    onReject: (id: string, type: string) => void;
    onBulkApprove: () => void;
    onBulkReject: () => void;
    onRefresh: () => void;
}

export default function PendingTab({
    isProcessing,
    isBulkProcessing,
    filteredSignups,
    selectedIds,
    onToggleSelectAll,
    onToggleSelectOne,
    onApprove,
    onReject,
    onBulkApprove,
    onBulkReject,
    onRefresh
}: PendingTabProps) {
    const allSelected = selectedIds.size > 0 && selectedIds.size === filteredSignups.length;
    const partiallySelected = selectedIds.size > 0 && selectedIds.size < filteredSignups.length;

    return (
        <Paper withBorder style={{ overflow: 'hidden' }}>
            <Group justify="space-between" align="center" p="lg" wrap="wrap" gap="md">
                <Text size="xs" fw={600} c="dimmed">
                    Lidmaatschap Wachtrij
                </Text>

                <Group gap="sm">
                    <Tooltip label="Bulk Goedkeuren">
                        <ActionIcon
                            type="button"
                            color="success"
                            size="lg"
                            disabled={selectedIds.size === 0 || !!isBulkProcessing}
                            loading={isBulkProcessing === 'approve'}
                            onClick={onBulkApprove}
                            aria-label="Bulk Goedkeuren"
                        >
                            <CheckCircle size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Bulk Afwijzen">
                        <ActionIcon
                            type="button"
                            color="error"
                            size="lg"
                            disabled={selectedIds.size === 0 || !!isBulkProcessing}
                            loading={isBulkProcessing === 'reject'}
                            onClick={onBulkReject}
                            aria-label="Bulk Afwijzen"
                        >
                            <XCircle size={18} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Vernieuwen">
                        <ActionIcon
                            type="button"
                            size="lg"
                            onClick={onRefresh}
                            aria-label="Vernieuwen"
                        >
                            <RefreshCw size={18} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>

            <Divider />

            <Table.ScrollContainer minWidth={720}>
                <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th w={48} ta="center">
                                <Checkbox
                                    checked={allSelected}
                                    indeterminate={partiallySelected}
                                    onChange={onToggleSelectAll}
                                    aria-label="Selecteer alles"
                                />
                            </Table.Th>
                            <Table.Th>Datum</Table.Th>
                            <Table.Th>Naam</Table.Th>
                            <Table.Th>Product</Table.Th>
                            <Table.Th ta="center">Status</Table.Th>
                            <Table.Th ta="right">Acties</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredSignups.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={6}>
                                    <Center py="xl">
                                        <Stack align="center" gap="xs" py="lg">
                                            <Text span c="success" style={{ opacity: 0.25 }} lh={1}>
                                                <CheckCircle size={48} />
                                            </Text>
                                            <Title order={4}>Alles bijgewerkt!</Title>
                                            <Text size="sm" c="dimmed">
                                                Er zijn geen inschrijvingen die op goedkeuring wachten.
                                            </Text>
                                        </Stack>
                                    </Center>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            filteredSignups.map((s) => (
                                <Table.Tr key={s.id}>
                                    <Table.Td ta="center">
                                        <Checkbox
                                            checked={selectedIds.has(s.id)}
                                            onChange={() => onToggleSelectOne(s.id)}
                                            aria-label={`Selecteer ${s.first_name} ${s.last_name}`}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed" fw={500} style={{ whiteSpace: 'nowrap' }}>
                                            {formatDate(s.created_at, 'dd-MM-yyyy HH:mm')}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2} style={{ minWidth: 0 }}>
                                            <Text size="sm" fw={600} truncate>
                                                {s.first_name} {s.last_name}
                                            </Text>
                                            <Text size="xs" c="dimmed" truncate>
                                                {s.email}
                                            </Text>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs" wrap="nowrap">
                                            <Text span c="dimmed" lh={1}>
                                                <Tag size={14} />
                                            </Text>
                                            <Text size="xs" fw={600}>
                                                {s.product_name}
                                            </Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Badge
                                            color={s.payment_status === 'paid' ? 'success' : 'accent'}
                                            size="sm"
                                        >
                                            {s.payment_status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group justify="flex-end" gap="xs" wrap="nowrap">
                                            <Tooltip label="Goedkeuren">
                                                <ActionIcon
                                                    type="button"
                                                    color="success"
                                                    size="md"
                                                    disabled={!!isProcessing}
                                                    loading={isProcessing === s.id}
                                                    onClick={() => onApprove(s.id, s.type)}
                                                    aria-label="Goedkeuren"
                                                >
                                                    <CheckCircle size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Afwijzen">
                                                <ActionIcon
                                                    type="button"
                                                    color="error"
                                                    size="md"
                                                    disabled={!!isProcessing}
                                                    loading={isProcessing === s.id}
                                                    onClick={() => onReject(s.id, s.type)}
                                                    aria-label="Afwijzen"
                                                >
                                                    <XCircle size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Paper>
    );
}
