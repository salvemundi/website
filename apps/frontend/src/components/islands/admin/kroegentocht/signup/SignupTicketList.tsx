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
        <div className="border-t border-[var(--border-color)]/30 pt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-[var(--theme-purple)]" />
                    Tickets ({tickets.length})
                </h3>
                <span className="px-3 py-1 bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] text-[9px] font-semibold rounded-full ring-1 ring-[var(--theme-purple)]/20">
                    {amountTickets} Gereserveerd
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="text-center py-8 bg-[var(--bg-main)]/30 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border-color)]/30">
                        <p className="text-xs text-[var(--text-subtle)] font-medium italic">Geen tickets gegenereerd. Deze verschijnen zodra de betaling op &quot;Betaald&quot; staat.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
