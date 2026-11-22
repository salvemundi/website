'use client';

import { Mail, Clock, Trash, CheckCircle2, Circle } from 'lucide-react';
import { ActionIcon, Anchor, Button, Group, Paper, Stack, Table, Text } from '@mantine/core';
import { type Signup } from '@/components/islands/beheer/activities/ActiviteitAanmeldingenIsland';
import {
    getSignupName,
    getSignupEmail,
    getSignupPhone,
    MemberBadge,
    PaymentBadge
} from '@/lib/activities/activity-signup.utils';

const formatDateTime = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);

const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);

interface ActivitySignupTableProps {
    signups: Signup[];
    canAccessEdit: boolean;
    onToggleCheckIn: (id: number, current: boolean) => void;
    onDelete: (id: number, email: string) => void;
    isDeletingId: number | null;
}

export default function ActivitySignupTable({
    signups,
    canAccessEdit,
    onToggleCheckIn,
    onDelete,
    isDeletingId
}: ActivitySignupTableProps) {
    return (
        <Paper withBorder style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={800}>
                <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Inchecken</Table.Th>
                            <Table.Th>Deelnemer</Table.Th>
                            <Table.Th>Contact</Table.Th>
                            <Table.Th>Lidmaatschap &amp; Datum</Table.Th>
                            <Table.Th ta="right">Acties</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {signups.map(signup => {
                            const name = getSignupName(signup);
                            const email = getSignupEmail(signup);
                            const phone = getSignupPhone(signup);
                            const isRowDeleting = isDeletingId === signup.id;

                            const createdAt = signup.created_at ? new Date(signup.created_at) : null;
                            const checkedInAt = signup.checked_in_at ? new Date(signup.checked_in_at) : null;

                            return (
                                <Table.Tr
                                    key={signup.id}
                                    style={{
                                        opacity: isRowDeleting ? 0.5 : 1,
                                        pointerEvents: isRowDeleting ? 'none' : undefined,
                                    }}
                                >
                                    <Table.Td>
                                        <Stack gap={4} align="flex-start">
                                            <Button
                                                type="button"
                                                size="xs"
                                                variant={signup.checked_in ? 'light' : 'default'}
                                                color={signup.checked_in ? 'success' : undefined}
                                                disabled={!canAccessEdit}
                                                onClick={() => onToggleCheckIn(signup.id, !!signup.checked_in)}
                                                leftSection={signup.checked_in ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                            >
                                                {signup.checked_in ? 'Ingecheckt' : 'Inchecken'}
                                            </Button>
                                            {signup.checked_in && checkedInAt && !isNaN(checkedInAt.getTime()) && (
                                                <Group gap={4} ml={4}>
                                                    <Clock size={12} />
                                                    <Text size="xs" c="dimmed">
                                                        {formatTime(checkedInAt)}
                                                    </Text>
                                                </Group>
                                            )}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" fw={600}>{name}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={4}>
                                            <Group gap={6} wrap="nowrap">
                                                <Mail size={14} opacity={0.6} />
                                                <Anchor href={`mailto:${email}`} size="xs">
                                                    {email}
                                                </Anchor>
                                            </Group>
                                            {phone && phone !== '-' && (
                                                <Anchor href={`tel:${phone}`} size="xs">
                                                    {phone}
                                                </Anchor>
                                            )}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap="xs">
                                            <Group gap="xs" wrap="wrap">
                                                <MemberBadge signup={signup} />
                                                <PaymentBadge status={signup.payment_status || 'open'} amount={signup.amount_paid} />
                                            </Group>
                                            <Text size="xs" c="dimmed" fw={600}>
                                                {createdAt && !isNaN(createdAt.getTime())
                                                    ? formatDateTime(createdAt)
                                                    : 'Datum onbekend'}
                                            </Text>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        {canAccessEdit && (
                                            <ActionIcon
                                                type="button"
                                                color="error"
                                                size="lg"
                                                onClick={() => onDelete(signup.id, email)}
                                                disabled={isRowDeleting}
                                                loading={isRowDeleting}
                                                title="Verwijder aanmelding"
                                                aria-label="Verwijder aanmelding"
                                            >
                                                <Trash size={16} />
                                            </ActionIcon>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Paper>
    );
}
