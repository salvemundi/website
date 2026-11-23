'use client';

import { Pen, Trash, X, CheckCircle, XCircle } from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Button,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { type PubCrawlTicket } from '@salvemundi/validations/schema/pub-crawl.zod';

interface SignupTicketCardProps {
    ticket: PubCrawlTicket;
    idx: number;
    editingTicketId: number | null;
    setEditingTicketId: (id: number | null) => void;
    togglingId: number | null;
    handleToggleCheckIn: (id: number, status: boolean) => void;
    handleDeleteTicket: (id: number) => void;
    handleTicketChange: (id: number, field: 'name' | 'initial', value: string) => void;
}

export default function SignupTicketCard({
    ticket,
    idx,
    editingTicketId,
    setEditingTicketId,
    togglingId,
    handleToggleCheckIn,
    handleDeleteTicket,
    handleTicketChange,
}: SignupTicketCardProps) {
    const isEditing = editingTicketId === ticket.id;

    return (
        <Paper withBorder p="md">
            <Stack gap="sm">
                <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                        <Badge size="sm">
                            {idx + 1}
                        </Badge>
                        {!isEditing ? (
                            <Group gap={4}>
                                <ActionIcon
                                    type="button"
                                    size="sm"
                                    onClick={() => setEditingTicketId(Number(ticket.id))}
                                    title="Naam aanpassen"
                                    aria-label="Naam aanpassen"
                                >
                                    <Pen size={12} />
                                </ActionIcon>
                                <ActionIcon
                                    type="button"
                                    color="error"
                                    size="sm"
                                    onClick={() => handleDeleteTicket(Number(ticket.id))}
                                    title="Ticket verwijderen"
                                    aria-label="Ticket verwijderen"
                                >
                                    <Trash size={12} />
                                </ActionIcon>
                            </Group>
                        ) : (
                            <ActionIcon
                                type="button"
                                size="sm"
                                onClick={() => setEditingTicketId(null)}
                                title="Sluiten"
                                aria-label="Sluiten"
                            >
                                <X size={12} />
                            </ActionIcon>
                        )}
                    </Group>

                    <Button
                        type="button"
                        size="compact-xs"
                        color={ticket.checked_in ? 'success' : 'error'}
                        onClick={() =>
                            handleToggleCheckIn(Number(ticket.id), !!ticket.checked_in)
                        }
                        disabled={!!togglingId}
                        leftSection={
                            togglingId === ticket.id ? (
                                <Loader size={12} />
                            ) : ticket.checked_in ? (
                                <CheckCircle size={12} />
                            ) : (
                                <XCircle size={12} />
                            )
                        }
                    >
                        {ticket.checked_in ? 'Ingecheckt' : 'Inchecken'}
                    </Button>
                </Group>

                {isEditing ? (
                    <Group gap="xs" align="flex-end" wrap="nowrap">
                        <TextInput
                            label="Naam"
                            size="xs"
                            flex={1}
                            value={ticket.name}
                            onChange={(e) =>
                                handleTicketChange(Number(ticket.id), 'name', e.target.value)
                            }
                            autoFocus
                            autoComplete="off"
                        />
                        <TextInput
                            label="Init."
                            size="xs"
                            w={64}
                            value={ticket.initial}
                            onChange={(e) =>
                                handleTicketChange(Number(ticket.id), 'initial', e.target.value)
                            }
                            maxLength={1}
                            autoComplete="off"
                            styles={{ input: { textAlign: 'center' } }}
                        />
                    </Group>
                ) : (
                    <Text
                        size="sm"
                        fw={700}
                        onClick={() => setEditingTicketId(Number(ticket.id))}
                        style={{ cursor: 'pointer' }}
                    >
                        {ticket.name}{' '}
                        {ticket.initial && (
                            <Text span size="xs" c="dimmed" tt="uppercase">
                                {ticket.initial}.
                            </Text>
                        )}
                    </Text>
                )}
            </Stack>
        </Paper>
    );
}
