'use client';

import { Edit2, Trash2, X, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
    handleTicketChange
}: SignupTicketCardProps) {
    const isEditing = editingTicketId === ticket.id;

    return (
        <div className="p-4 bg-[var(--bg-main)]/30 rounded-[var(--radius-xl)] border border-[var(--border-color)]/50 flex flex-col gap-3 group hover:border-[var(--theme-purple)]/30 transition-all relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[var(--bg-card)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-muted)] border border-[var(--border-color)] select-none group-hover:bg-[var(--theme-purple)] group-hover:text-white group-hover:border-[var(--theme-purple)] transition-all">
                        {idx + 1}
                    </div>
                    {!isEditing ? (
                        <div className="flex items-center gap-1 transition-all">
                            <button
                                type="button"
                                onClick={() => setEditingTicketId(Number(ticket.id))}
                                className="p-1 text-[var(--text-muted)] hover:text-[var(--theme-purple)]"
                                title="Naam aanpassen"
                            >
                                <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteTicket(Number(ticket.id))}
                                className="p-1 text-[var(--text-muted)] hover:text-red-500"
                                title="Ticket verwijderen"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditingTicketId(null)}
                            className="p-1 text-[var(--theme-purple)] hover:text-[var(--text-main)] transition-all"
                            title="Sluiten"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => handleToggleCheckIn(Number(ticket.id), !!ticket.checked_in)}
                    disabled={!!togglingId}
                    className="transition-all active:scale-95 disabled:opacity-50"
                >
                    {ticket.checked_in ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-semibold rounded-full ring-1 ring-green-500/20 hover:bg-green-500/20 transition-all">
                            {togglingId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            Ingecheckt
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 text-[9px] font-semibold rounded-full ring-1 ring-red-500/20 hover:bg-red-500/20 transition-all">
                            {togglingId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3 opacity-50" />}
                            Inchecken
                        </span>
                    )}
                </button>
            </div>

            {isEditing ? (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex-1">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1 block">Naam</label>
                        <input
                            type="text"
                            value={ticket.name}
                            onChange={(e) => handleTicketChange(Number(ticket.id), 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] focus:border-[var(--theme-purple)] transition-all"
                            autoFocus
                            autoComplete="off"
                        />
                    </div>
                    <div className="w-16">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-1 block">Init.</label>
                        <input
                            type="text"
                            value={ticket.initial}
                            onChange={(e) => handleTicketChange(Number(ticket.id), 'initial', e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] text-center focus:border-[var(--theme-purple)] transition-all"
                            maxLength={1}
                            autoComplete="off"
                        />
                    </div>
                </div>
            ) : (
                <div
                    className="cursor-pointer group/name"
                    onClick={() => setEditingTicketId(Number(ticket.id))}
                >
                    <p className="text-sm font-bold text-[var(--text-main)] group-hover/name:text-[var(--theme-purple)] transition-colors">
                        {ticket.name} {ticket.initial && <span className="opacity-50 text-[10px] uppercase">{ticket.initial}.</span>}
                    </p>
                </div>
            )}
        </div>
    );
}
