'use client';

import { Pen, Trash, X, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
        <div className="group relative flex flex-col gap-3 rounded-xl border border-(--border-color)/50 bg-(--bg-main)/30 p-4 transition-all hover:border-(--theme-purple)/30">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-lg border border-(--border-color) bg-(--bg-card) text-[10px] font-semibold text-(--text-muted) transition-all select-none group-hover:border-(--theme-purple) group-hover:bg-(--theme-purple) group-hover:text-white">
                        {idx + 1}
                    </div>
                    {!isEditing ? (
                        <div className="flex items-center gap-1 transition-all">
                            <button
                                type="button"
                                onClick={() => setEditingTicketId(Number(ticket.id))}
                                className="icon-button p-1 text-(--text-muted) hover:text-(--theme-purple)"
                                title="Naam aanpassen"
                            >
                                <Pen className="size-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDeleteTicket(Number(ticket.id))}
                                className="icon-button p-1 text-(--text-muted) hover:text-red-500"
                                title="Ticket verwijderen"
                            >
                                <Trash className="size-3" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setEditingTicketId(null)}
                            className="icon-button p-1 text-(--theme-purple) transition-all hover:text-(--text-main)"
                            title="Sluiten"
                        >
                            <X className="size-3" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => handleToggleCheckIn(Number(ticket.id), !!ticket.checked_in)}
                    disabled={!!togglingId}
                    className="beheer-button transition-all active:scale-95 disabled:opacity-50"
                >
                    {ticket.checked_in ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-[9px] font-semibold text-green-500 ring-1 ring-green-500/20 transition-all hover:bg-green-500/20">
                            {togglingId === ticket.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
                            Ingecheckt
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[9px] font-semibold text-red-500 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20">
                            {togglingId === ticket.id ? <Loader2 className="size-3 animate-spin" /> : <XCircle className="size-3 opacity-50" />}
                            Inchecken
                        </span>
                    )}
                </button>
            </div>

            {isEditing ? (
                <div className="animate-in fade-in slide-in-from-top-1 flex gap-2 duration-200">
                    <div className="flex-1">
                        <label className="mb-1 block text-[9px] font-bold text-(--text-muted) uppercase">Naam</label>
                        <input
                            type="text"
                            value={ticket.name}
                            onChange={(e) => handleTicketChange(Number(ticket.id), 'name', e.target.value)}
                            className="beheer-input w-full rounded-lg border border-(--border-color) bg-(--bg-card) px-3 py-2 text-xs font-semibold text-(--text-main) transition-all focus:border-(--theme-purple)"
                            autoFocus
                            autoComplete="off"
                        />
                    </div>
                    <div className="w-16">
                        <label className="mb-1 block text-[9px] font-bold text-(--text-muted) uppercase">Init.</label>
                        <input
                            type="text"
                            value={ticket.initial}
                            onChange={(e) => handleTicketChange(Number(ticket.id), 'initial', e.target.value)}
                            className="beheer-input w-full rounded-lg border border-(--border-color) bg-(--bg-card) px-3 py-2 text-center text-xs font-semibold text-(--text-main) transition-all focus:border-(--theme-purple)"
                            maxLength={1}
                            autoComplete="off"
                        />
                    </div>
                </div>
            ) : (
                <div
                    className="group/name cursor-pointer"
                    onClick={() => setEditingTicketId(Number(ticket.id))}
                >
                    <p className="text-sm font-bold text-(--text-main) transition-colors group-hover/name:text-(--theme-purple)">
                        {ticket.name} {ticket.initial && <span className="text-[10px] uppercase opacity-50">{ticket.initial}.</span>}
                    </p>
                </div>
            )}
        </div>
    );
}
