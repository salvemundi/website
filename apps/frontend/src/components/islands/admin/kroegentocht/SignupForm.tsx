'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    updatePubCrawlSignup,
    togglePubCrawlTicketCheckIn,
    updatePubCrawlTickets,
    deletePubCrawlSignup
} from '@/server/actions/admin/admin-kroegentocht.actions';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import SignupHeader from './signup/SignupHeader';
import SignupPersonalDetails from './signup/SignupPersonalDetails';
import SignupTicketList from './signup/SignupTicketList';
import SignupFormActions from './signup/SignupFormActions';

import { type EnrichedPubCrawlSignup } from '@/server/internal/kroegentocht-db.utils';

interface SignupFormProps {
    signup: EnrichedPubCrawlSignup;
    eventGroups?: string[];
}

export default function SignupForm({ signup, eventGroups = [] }: SignupFormProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: signup.name,
        email: signup.email,
        association: signup.association || '',
        payment_status: signup.payment_status as "paid" | "open" | "failed" | "canceled" | "expired",
        amount_tickets: signup.amount_tickets,
        group_name: signup.group_name || null
    });
    const [ticketsData, setTicketsData] = useState(signup.tickets || []);
    const [editingTicketId, setEditingTicketId] = useState<number | null>(null);

    const tickets = signup.tickets || [];

    const handleToggleCheckIn = async (ticketId: number, currentStatus: boolean) => {
        if (togglingId) return;
        setTogglingId(ticketId);
        try {
            await togglePubCrawlTicketCheckIn(ticketId, currentStatus, Number(signup.pub_crawl_event_id.id));
            setTicketsData(prev => prev.map(t =>
                t.id === ticketId ? { ...t, checked_in: !currentStatus } : t
            ));
            showToast('Kaart status bijgewerkt', 'success');
            router.refresh();
        } catch (error) {
            showToast(`Fout bij bijwerken: ${error}`, 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const handleToggleCheckInSync = (ticketId: number, currentStatus: boolean) => {
        void handleToggleCheckIn(ticketId, currentStatus);
    };

    const handleTicketChange = (id: number, field: 'name' | 'initial', value: string) => {
        setTicketsData(prev => prev.map(t =>
            t.id === id ? { ...t, [field]: field === 'initial' ? value.slice(0, 1).toUpperCase() : value } : t
        ));
    };

    const handleDeleteSignup = async () => {
        if (!window.confirm('Weet je zeker dat je deze volledige aanmelding wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;

        startTransition(async () => {
            try {
                await deletePubCrawlSignup(Number(signup.id), Number(signup.pub_crawl_event_id.id));
                showToast('Aanmelding verwijderd', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (error) {
                showToast(`Fout bij verwijderen: ${error}`, 'error');
            }
        });
    };

    const handleDeleteSignupSync = () => {
        void handleDeleteSignup();
    };

    const handleDeleteTicket = async (ticketId: number) => {
        if (!window.confirm('Weet je zeker dat je dit ticket wilt verwijderen?')) return;

        const { deletePubCrawlTicket } = await import('@/server/actions/admin/admin-kroegentocht.actions');

        startTransition(async () => {
            try {
                await deletePubCrawlTicket(ticketId, Number(signup.id), Number(signup.pub_crawl_event_id.id));
                showToast('Ticket verwijderd', 'success');
                router.refresh();
            } catch (error) {
                showToast(`Fout bij verwijderen ticket: ${error}`, 'error');
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
                    updatePubCrawlTickets(Number(signup.id), eventId, ticketsData.map(t => ({
                        id: Number(t.id),
                        name: t.name,
                        initial: t.initial
                    })))
                ]);

                showToast('Aanmelding en tickets succesvol bijgewerkt', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (error) {
                showToast(`Fout bij opslaan: ${error}`, 'error');
            }
        });
    };

    const handleReset = () => {
        type PaymentStatus = "paid" | "open" | "failed" | "canceled" | "expired";
        setFormData({
            name: signup.name,
            email: signup.email,
            association: signup.association || '',
            payment_status: signup.payment_status as PaymentStatus,
            amount_tickets: signup.amount_tickets,
            group_name: signup.group_name || null
        });
        setTicketsData(signup.tickets || []);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto" autoComplete="off">
                <div className="bg-(--bg-card) rounded-2xl shadow-(--shadow-card) ring-1 ring-(--border-color)/30">
                    <SignupHeader />

                    <div className="p-8 space-y-6">
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
                    </div>
                </div>

                <SignupFormActions
                    isPending={isPending}
                    onReset={handleReset}
                    onDelete={handleDeleteSignupSync}
                />
            </form>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
