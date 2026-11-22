'use client';

import { Fragment, useState, useTransition } from 'react';
import Link from 'next/link';
import {
    ClipboardList,
    Copy,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
} from 'lucide-react';
import {
    ActionIcon,
    Button,
    Card,
    Center,
    Container,
    Divider,
    Group,
    NativeSelect,
    Paper,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import {
    updatePreorderStatus,
    getPreorderPaymentLink,
} from '@/server/actions/beheer/webshop/beheer-webshop-preorders.actions';
import { formatDate } from '@/shared/lib/utils/date';
import { formatCustomFieldValues, type AdminPreorder } from './webshop-admin-types';

interface Props {
    initialPreorders: AdminPreorder[];
}

const STATUS_OPTIONS = [
    { value: 'awaiting_deposit', label: 'Wacht op betaling' },
    { value: 'completed', label: 'Voltooid' },
    { value: 'cancelled', label: 'Geannuleerd' },
];

export default function AdminWebshopPreordersIsland({ initialPreorders }: Props) {
    const { showToast } = useAdminToast();
    const [preorders, setPreorders] = useState(initialPreorders);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const handleStatusChange = (id: number, status: string) => {
        setUpdatingId(id);
        startTransition(async () => {
            const res = await updatePreorderStatus(id, status);
            if (res.success) {
                setPreorders((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
                showToast('Status bijgewerkt', 'success');
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
            setUpdatingId(null);
        });
    };

    const handleCopyLink = (id: number) => {
        startTransition(async () => {
            const res = await getPreorderPaymentLink(id);
            if (res.success && res.link) {
                await navigator.clipboard.writeText(res.link);
                showToast('Link gekopieerd naar klembord', 'success');
            } else {
                showToast(res.error || 'Link ophalen mislukt', 'error');
            }
        });
    };

    return (
        <>
            <Paper radius={0} shadow="xs" py="md">
                <Container size="xl" py={0}>
                    <Group gap="md">
                        <Button
                            component={Link}
                            href="/beheer/webshop"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h3" c="brand">
                            Webshop Bestellingen
                        </Title>
                    </Group>
                </Container>
            </Paper>

            <Container size="xl" py="lg">
                <Card p={0} shadow="md" style={{ overflow: 'hidden' }}>
                    {preorders.length === 0 ? (
                        <Center py={80}>
                            <Stack align="center" gap="xs">
                                <Text span c="dimmed" lh={1}>
                                    <ClipboardList size={40} />
                                </Text>
                                <Text size="sm" fw={600} c="dimmed">
                                    Nog geen bestellingen
                                </Text>
                            </Stack>
                        </Center>
                    ) : (
                        <Table.ScrollContainer minWidth={650}>
                            <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Besteller</Table.Th>
                                        <Table.Th visibleFrom="sm">Datum</Table.Th>
                                        <Table.Th>Totaal</Table.Th>
                                        <Table.Th>Status</Table.Th>
                                        <Table.Th ta="right">Acties</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {preorders.map((preorder) => (
                                        <Fragment key={preorder.id}>
                                            <Table.Tr>
                                                <Table.Td>
                                                    <Button
                                                        type="button"
                                                        size="xs"
                                                        onClick={() =>
                                                            setExpandedId(
                                                                expandedId === preorder.id ? null : preorder.id
                                                            )
                                                        }
                                                        leftSection={
                                                            expandedId === preorder.id ? (
                                                                <ChevronUp size={16} />
                                                            ) : (
                                                                <ChevronDown size={16} />
                                                            )
                                                        }
                                                    >
                                                        {preorder.first_name} {preorder.last_name}
                                                    </Button>
                                                    <Text size="xs" c="dimmed" pl={24}>
                                                        {preorder.email}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td visibleFrom="sm">
                                                    <Text size="sm" c="dimmed">
                                                        {preorder.created_at
                                                            ? formatDate(new Date(preorder.created_at), 'd MMM yyyy')
                                                            : '-'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={600}>
                                                        €{Number(preorder.subtotal_amount).toFixed(2)}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <NativeSelect
                                                        size="xs"
                                                        value={preorder.status || ''}
                                                        disabled={isPending && updatingId === preorder.id}
                                                        onChange={(e) =>
                                                            handleStatusChange(preorder.id, e.target.value)
                                                        }
                                                        data={STATUS_OPTIONS}
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group justify="flex-end">
                                                        {!preorder.deposit_paid && (
                                                            <ActionIcon
                                                                type="button"
                                                                onClick={() => handleCopyLink(preorder.id)}
                                                                title="Kopieer betaallink"
                                                                aria-label="Kopieer betaallink"
                                                            >
                                                                <Copy size={16} />
                                                            </ActionIcon>
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                            {expandedId === preorder.id && (
                                                <Table.Tr>
                                                    <Table.Td colSpan={5}>
                                                        <Paper withBorder p="md">
                                                            <Stack gap="xs">
                                                                {preorder.lines.map((line) => (
                                                                    <Group
                                                                        key={line.id}
                                                                        justify="space-between"
                                                                        wrap="nowrap"
                                                                    >
                                                                        <Text size="sm" fw={500}>
                                                                            {line.product_name_snapshot}
                                                                            {line.variant_label_snapshot &&
                                                                                ` (${line.variant_label_snapshot})`}
                                                                            {formatCustomFieldValues(
                                                                                line.custom_field_values
                                                                            )}{' '}
                                                                            &times; {line.quantity}
                                                                        </Text>
                                                                        <Text size="sm" c="dimmed" ff="monospace">
                                                                            €
                                                                            {(
                                                                                Number(line.unit_price) *
                                                                                line.quantity
                                                                            ).toFixed(2)}
                                                                        </Text>
                                                                    </Group>
                                                                ))}
                                                                <Divider />
                                                                <Group justify="space-between">
                                                                    <Text size="sm" fw={600} c="dimmed">
                                                                        Betaald{' '}
                                                                        {preorder.deposit_paid ? '(ja)' : '(nog niet)'}
                                                                    </Text>
                                                                    <Text size="sm" fw={700} ff="monospace">
                                                                        €{Number(preorder.subtotal_amount).toFixed(2)}
                                                                    </Text>
                                                                </Group>
                                                                {preorder.pickup_notes && (
                                                                    <Text size="xs" c="dimmed" fs="italic">
                                                                        Opmerking: {preorder.pickup_notes}
                                                                    </Text>
                                                                )}
                                                                {preorder.phone_number && (
                                                                    <Text size="xs" c="dimmed">
                                                                        Telefoon: {preorder.phone_number}
                                                                    </Text>
                                                                )}
                                                            </Stack>
                                                        </Paper>
                                                    </Table.Td>
                                                </Table.Tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    )}
                </Card>
            </Container>
        </>
    );
}
