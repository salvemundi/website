'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Card, Stack } from '@mantine/core';
import {
    updatePubCrawlSignup,
    togglePubCrawlTicketCheckIn,
    updatePubCrawlTickets,
    deletePubCrawlSignup,
} from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import SignupHeader from './signup/SignupHeader';
import SignupPersonalDetails from './signup/SignupPersonalDetails';
import SignupTicketList from './signup/SignupTicketList';
import SignupFormActions from './signup/SignupFormActions';

import { type EnrichedPubCrawlSignup } from '@/server/internal/kroegentocht/kroegentocht-types';

interface SignupFormProps {
    signup: EnrichedPubCrawlSignup;
    eventGroups?: string[];
}

export default function SignupForm({ signup, eventGroups = [] }: SignupFormProps) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: signup.name,
        email: signup.email ?? '',
        association: signup.association || '',
        payment_status: signup.payment_status as 'paid' | 'open' | 'failed' | 'canceled' | 'expired',
        amount_tickets: signup.amount_tickets,
        group_name: signup.group_name || null,
    });
    const [ticketsData, setTicketsData] = useState(signup.tickets || []);
    const [editingTicketId, setEditingTicketId] = useState<number | null>(null);

    const tickets = signup.tickets || [];

    const handleToggleCheckIn = async (ticketId: number, currentStatus: boolean) => {
        if (togglingId) return;
        setTogglingId(ticketId);
        try {
            await togglePubCrawlTicketCheckIn(
                ticketId,
                currentStatus,
                Number(signup.pub_crawl_event_id.id)
            );
            setTicketsData((prev) =>
                prev.map((t) => (t.id === ticketId ? { ...t, checked_in: !currentStatus } : t))
            );
            showToast('Kaart status bijgewerkt', 'success');
            router.refresh();
        } catch (error) {
            showToast(`Fout bij bijwerken: ${String(error)}`, 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleToggleCheckInSync = (ticketId: number, currentStatus: boolean) => {
        void handleToggleCheckIn(ticketId, currentStatus);
    };

    const handleTicketChange = (id: number, field: 'name' | 'initial', value: string) => {
        setTicketsData((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, [field]: field === 'initial' ? value.slice(0, 1).toUpperCase() : value }
                    : t
            )
        );
    };

    const handleDeleteSignup = async () => {
        if (
            !window.confirm(
                'Weet je zeker dat je deze volledige aanmelding wilt verwijderen? Dit kan niet ongedaan worden gemaakt.'
            )
        )
            return;

        startTransition(async () => {
            try {
                await deletePubCrawlSignup(Number(signup.id), Number(signup.pub_crawl_event_id.id));
                showToast('Aanmelding verwijderd', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (error) {
                showToast(`Fout bij verwijderen: ${String(error)}`, 'error');
            }
        });
    };

    const handleDeleteSignupSync = () => {
        void handleDeleteSignup();
    };

    const handleDeleteTicket = async (ticketId: number) => {
        if (!window.confirm('Weet je zeker dat je dit ticket wilt verwijderen?')) return;

        const { deletePubCrawlTicket } = await import(
            '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions'
        );

        startTransition(async () => {
            try {
                await deletePubCrawlTicket(
                    ticketId,
                    Number(signup.id),
                    Number(signup.pub_crawl_event_id.id)
                );
                showToast('Ticket verwijderd', 'success');
                router.refresh();
            } catch (error) {
                showToast(`Fout bij verwijderen ticket: ${String(error)}`, 'error');
            }
        });
    };

    const handleDeleteTicketSync = (ticketId: number) => {
        void handleDeleteTicket(ticketId);
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                const eventId = Number(signup.pub_crawl_event_id.id);
                await Promise.all([
                    updatePubCrawlSignup(Number(signup.id), eventId, formData),
                    updatePubCrawlTickets(
                        Number(signup.id),
                        eventId,
                        ticketsData.map((t) => ({
                            id: Number(t.id),
                            name: t.name,
                            initial: t.initial,
                        }))
                    ),
                ]);

                showToast('Aanmelding en tickets succesvol bijgewerkt', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (error) {
                showToast(`Fout bij opslaan: ${String(error)}`, 'error');
            }
        });
    };

    const handleReset = () => {
        type PaymentStatus = 'paid' | 'open' | 'failed' | 'canceled' | 'expired';
        setFormData({
            name: signup.name,
            email: signup.email ?? '',
            association: signup.association || '',
            payment_status: signup.payment_status as PaymentStatus,
            amount_tickets: signup.amount_tickets,
            group_name: signup.group_name || null,
        });
        setTicketsData(signup.tickets || []);
    };

    return (
        <Box maw={768} mx="auto">
            <Box component="form" onSubmit={handleSubmit} autoComplete="off">
                <Stack gap="lg">
                    <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
                        <SignupHeader />

                        <Stack gap="lg" p="xl">
                            <SignupPersonalDetails
                                formData={formData}
                                setFormData={setFormData}
                                eventGroups={eventGroups}
                            />

                            <SignupTicketList
                                tickets={tickets}
                                ticketsData={ticketsData}
                                amountTickets={formData.amount_tickets}
                                editingTicketId={editingTicketId}
                                setEditingTicketId={setEditingTicketId}
                                togglingId={togglingId}
                                handleToggleCheckIn={handleToggleCheckInSync}
                                handleDeleteTicket={handleDeleteTicketSync}
                                handleTicketChange={handleTicketChange}
                            />
                        </Stack>
                    </Card>

                    <SignupFormActions
                        isPending={isPending}
                        onReset={handleReset}
                        onDelete={handleDeleteSignupSync}
                    />
                </Stack>
            </Box>
        </Box>
    );
}
