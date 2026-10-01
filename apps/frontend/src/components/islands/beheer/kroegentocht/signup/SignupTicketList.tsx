'use client';

import { Ticket } from 'lucide-react';
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
    handleTicketChange
}: SignupTicketListProps) {
    return (
        <div className="border-t border-(--border-color)/30 pt-8">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-(--text-main)">
                    <Ticket className="size-4 text-(--theme-purple)" />
                    Tickets ({tickets.length})
                </h3>
                <span className="rounded-full bg-(--theme-purple)/10 px-3 py-1 text-[9px] font-semibold text-(--theme-purple) ring-1 ring-(--theme-purple)/20">
                    {amountTickets} Gereserveerd
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <div className="rounded-xl border-2 border-dashed border-(--border-color)/30 bg-(--bg-main)/30 py-8 text-center">
                        <p className="text-xs font-medium text-(--text-subtle) italic">Geen tickets gegenereerd. Deze verschijnen zodra de betaling op &quot;Betaald&quot; staat.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
