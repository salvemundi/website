'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ClipboardCheck, CheckCircle2, ChevronLeft } from 'lucide-react';
import {
    Box,
    Button,
    Card,
    Center,
    Container,
    Group,
    Paper,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { toggleOrderPickedUp } from '@/server/actions/beheer/webshop/beheer-webshop-preorders.actions';
import { formatDate } from '@/shared/lib/utils/date';
import { formatCustomFieldValues, type AdminPickupOrder } from './webshop-admin-types';

interface Props {
    initialPreorders: AdminPickupOrder[];
}

export default function AdminWebshopPickupIsland({ initialPreorders }: Props) {
    const { showToast } = useAdminToast();
    const [preorders, setPreorders] = useState(initialPreorders);
    const [isPending, startTransition] = useTransition();
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const handleToggle = (id: number, pickedUp: boolean) => {
        setUpdatingId(id);
        startTransition(async () => {
            const res = await toggleOrderPickedUp(id, pickedUp);
            if (res.success) {
                setPreorders((prev) =>
                    prev.map((p) =>
                        p.id === id
                            ? {
                                  ...p,
                                  picked_up: pickedUp,
                                  picked_up_at: pickedUp ? new Date().toISOString() : null,
                              }
                            : p
                    )
                );
                showToast(
                    pickedUp ? 'Gemarkeerd als opgehaald' : 'Markering ongedaan gemaakt',
                    'success'
                );
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
            setUpdatingId(null);
        });
    };

    const openCount = preorders.filter((p) => !p.picked_up).length;

    return (
        <>
            <Paper radius={0} shadow="xs" py="md">
                <Container size="xl" py={0}>
                    <Group gap="md">
                        <Button
                            component={Link}
                            href="/beheer/webshop"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h3" c="brand">
                            Afhaallijst
                        </Title>
                    </Group>
                </Container>
            </Paper>

            <Container size="xl" py="lg">
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        {openCount} van de {preorders.length} bestellingen nog niet opgehaald.
                    </Text>

                    <Card p={0} shadow="md" style={{ overflow: 'hidden' }}>
                        {preorders.length === 0 ? (
                            <Center py={80}>
                                <Stack align="center" gap="xs">
                                    <Text span c="dimmed" lh={1}>
                                        <ClipboardCheck size={40} />
                                    </Text>
                                    <Text size="sm" fw={600} c="dimmed">
                                        Nog geen betaalde bestellingen
                                    </Text>
                                </Stack>
                            </Center>
                        ) : (
                            <Table.ScrollContainer minWidth={600}>
                                <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Lid</Table.Th>
                                            <Table.Th>Bestelling</Table.Th>
                                            <Table.Th visibleFrom="sm">Opgehaald op</Table.Th>
                                            <Table.Th ta="right">Opgehaald</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {preorders.map((preorder) => (
                                            <Table.Tr
                                                key={preorder.id}
                                                style={preorder.picked_up ? { opacity: 0.6 } : undefined}
                                            >
                                                <Table.Td>
                                                    <Box>
                                                        <Text size="sm" fw={600}>
                                                            {preorder.first_name} {preorder.last_name}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            {preorder.email}
                                                        </Text>
                                                    </Box>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Stack gap={2}>
                                                        {preorder.lines.map((line) => (
                                                            <Text key={line.id} size="sm">
                                                                {line.product_name_snapshot}
                                                                {line.variant_label_snapshot &&
                                                                    ` (${line.variant_label_snapshot})`}
                                                                {formatCustomFieldValues(line.custom_field_values)} &times;{' '}
                                                                {line.quantity}
                                                            </Text>
                                                        ))}
                                                    </Stack>
                                                </Table.Td>
                                                <Table.Td visibleFrom="sm">
                                                    <Text size="sm" c="dimmed">
                                                        {preorder.picked_up_at
                                                            ? formatDate(
                                                                  new Date(preorder.picked_up_at),
                                                                  'd MMM yyyy HH:mm'
                                                              )
                                                            : '-'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group justify="flex-end">
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            variant="light"
                                                            color={preorder.picked_up ? 'success' : 'brand'}
                                                            disabled={isPending && updatingId === preorder.id}
                                                            onClick={() =>
                                                                handleToggle(preorder.id, !preorder.picked_up)
                                                            }
                                                            leftSection={<CheckCircle2 size={14} />}
                                                        >
                                                            {preorder.picked_up
                                                                ? 'Opgehaald'
                                                                : 'Markeer als opgehaald'}
                                                        </Button>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>
                        )}
                    </Card>
                </Stack>
            </Container>
        </>
    );
}
