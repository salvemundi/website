'use client';

import { Ticket } from 'lucide-react';
import {
    Badge,
    Divider,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { type PubCrawlTicket } from '@salvemundi/validations/schema/pub-crawl.zod';
import SignupTicketCard from './SignupTicketCard';

interface SignupTicketListProps {
    tickets: PubCrawlTicket[];
    ticketsData: PubCrawlTicket[];
    amountTickets: number;
    editingTicketId: number | null;
    setEditingTicketId: (id: number | null) => void;
    togglingId: number | null;
    handleToggleCheckIn: (id: number, status: boolean) => void;
    handleDeleteTicket: (id: number) => void;
    handleTicketChange: (id: number, field: 'name' | 'initial', value: string) => void;
}

export default function SignupTicketList({
    tickets,
    ticketsData,
    amountTickets,
    editingTicketId,
    setEditingTicketId,
    togglingId,
    handleToggleCheckIn,
    handleDeleteTicket,
    handleTicketChange,
}: SignupTicketListProps) {
    return (
        <>
            <Divider />
            <Stack gap="md">
                <Group justify="space-between">
                    <Group gap="xs">
                        <Text span c="brand" lh={1}>
                            <Ticket size={16} />
                        </Text>
                        <Title order={3} size="h5">
                            Tickets ({tickets.length})
                        </Title>
                    </Group>
                    <Badge variant="light" color="brand" size="sm">
                        {amountTickets} Gereserveerd
                    </Badge>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {ticketsData.map((ticket, idx) => (
                        <SignupTicketCard
                            key={ticket.id}
                            ticket={ticket}
                            idx={idx}
                            editingTicketId={editingTicketId}
                            setEditingTicketId={setEditingTicketId}
                            togglingId={togglingId}
                            handleToggleCheckIn={handleToggleCheckIn}
                            handleDeleteTicket={handleDeleteTicket}
                            handleTicketChange={handleTicketChange}
                        />
                    ))}
                    {tickets.length === 0 && (
                        <Paper
                            withBorder
                            p="lg"
                            radius="md"
                            ta="center"
                            style={{ borderStyle: 'dashed', gridColumn: '1 / -1' }}
                        >
                            <Text size="xs" c="dimmed" fs="italic">
                                Geen tickets gegenereerd. Deze verschijnen zodra de betaling op &quot;Betaald&quot; staat.
                            </Text>
                        </Paper>
                    )}
                </SimpleGrid>
            </Stack>
        </>
    );
}
