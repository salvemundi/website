'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Ticket,
    Calendar,
    MapPin,
    QrCode,
    Search,
    X
} from 'lucide-react';
import QRDisplay from '@/shared/ui/QRDisplay';
import { formatDate } from '@/shared/lib/utils/date';

interface TicketData {
    id: number | string;
    qr_token: string;
    participant_name?: string;
    date_created?: string | Date;
    event_id?: {
        name?: string;
        event_date?: string | Date;
        location?: string;
    };
}

interface TicketListIslandProps {
    tickets: TicketData[];
}

export default function TicketListIsland({ tickets }: TicketListIslandProps) {
    const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
    const [search, setSearch] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (selectedTicket) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [selectedTicket]);

    const handleTicketSelect = (ticket: TicketData) => setSelectedTicket(ticket);
    const handleCloseModal = () => setSelectedTicket(null);

    const filteredTickets = tickets.filter(ticket =>
        (ticket.event_id?.name || 'Activiteit').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                <div className="squircle group flex h-14 w-full items-center gap-3 border border-(--border-color) bg-(--bg-card) px-4 transition-all focus-within:border-(--theme-purple) focus-within:ring-4 focus-within:ring-(--theme-purple)/10 md:w-96">
                    <Search className="size-5 shrink-0 text-(--text-muted) transition-colors group-focus-within:text-(--theme-purple)" />
                    <input
                        type="text"
                        placeholder="Tickets zoeken..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="form-input w-full border-none bg-transparent p-0 text-sm font-black tracking-widest uppercase outline-none"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="squircle flex items-center gap-3 border border-(--border-color) bg-(--bg-card) px-6 py-3">
                        <div className="rounded-lg bg-(--theme-purple)/10 p-2 text-(--theme-purple)">
                            <Ticket className="size-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-(--text-muted) uppercase">Totaal aantal tickets</p>
                            <p className="text-sm font-black text-(--text-main)">{tickets.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <div className="squircle-xl border border-dashed border-(--border-color) bg-(--bg-card) py-32 text-center">
                    <Ticket className="mx-auto mb-4 size-16 text-(--text-muted) opacity-20" />
                    <h3 className="text-xl font-black tracking-tight text-(--text-main) uppercase italic">Geen tickets <span className="text-(--theme-purple)">gevonden</span></h3>
                    <p className="mt-2 font-medium text-(--text-muted)">Je hebt nog geen tickets voor aankomende activiteiten.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => handleTicketSelect(ticket)}
                            className="group squircle-lg relative cursor-pointer border border-(--border-color) bg-(--bg-card) p-6 transition-all duration-300 hover:-translate-y-1 hover:border-(--theme-purple)/50 hover:shadow-(--theme-purple)/5 hover:shadow-2xl"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="squircle bg-(--theme-purple)/5 p-3 text-(--theme-purple) transition-all duration-500 group-hover:bg-(--theme-purple) group-hover:text-white">
                                    <QrCode className="size-6" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black tracking-widest text-(--text-muted) uppercase">{formatDate(ticket.date_created)}</p>
                                    <p className="text-[10px] font-black tracking-widest text-(--theme-purple) uppercase">#{ticket.id}</p>
                                </div>
                            </div>

                            <h3 className="mb-4 line-clamp-1 text-xl font-black tracking-tighter text-(--text-main) uppercase italic">
                                {ticket.event_id?.name || 'Activiteit'}
                            </h3>

                            <div className="space-y-2 border-t border-(--border-color)/30 pt-4">
                                <div className="flex items-center gap-2 text-(--text-muted)">
                                    <Calendar className="size-3" />
                                    <span className="text-[10px] font-bold uppercase">{formatDate(ticket.event_id?.event_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-(--text-muted)">
                                    <MapPin className="size-3" />
                                    <span className="truncate text-[10px] font-bold uppercase">{ticket.event_id?.location || 'Strijp-S'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {mounted && createPortal(
                selectedTicket && (
                    <div className="fixed inset-0 isolate z-9999 flex items-center justify-center p-4">
                        <div
                            onClick={handleCloseModal}
                            className="animate-in fade-in absolute inset-0 bg-black/60 backdrop-blur-xl duration-300"
                        />

                        <div
                            className="squircle-xl animate-in fade-in zoom-in-[0.98] slide-in-from-bottom-4 relative z-10 w-full max-w-lg overflow-hidden border border-white/10 bg-(--bg-card) shadow-2xl duration-300 ease-out"
                        >
                            <button
                                onClick={handleCloseModal}
                                className="group absolute top-6 right-6 z-20 icon-button flex size-10 items-center justify-center rounded-full bg-black/5 p-2 transition-colors hover:bg-black/10"
                            >
                                <X className="size-5 text-(--text-muted) transition-colors group-hover:text-(--text-main)" />
                            </button>

                            <div className="flex flex-col items-center space-y-8 p-8 md:p-12">
                                <div className="space-y-2 text-center">
                                    <p className="text-[10px] font-black tracking-[0.3em] text-(--theme-purple) uppercase">Jouw Digitale Ticket</p>
                                    <h2 className="text-3xl font-black tracking-tighter text-(--text-main) uppercase italic">
                                        {selectedTicket.event_id?.name || 'Activiteit'}
                                    </h2>
                                </div>

                                <div className="squircle-lg bg-white p-6 shadow-2xl ring-1 ring-black/5">
                                    <QRDisplay qrToken={selectedTicket.qr_token} size={240} />
                                </div>

                                <div className="space-y-1 text-center">
                                    <p className="text-lg font-black tracking-tight text-(--text-main) uppercase italic">{selectedTicket.participant_name}</p>
                                    <p className="text-xs font-bold tracking-widest text-(--text-muted) uppercase italic opacity-60">Toon deze code bij de entree</p>
                                </div>

                                <div className="w-full border-t border-(--border-color)/50 pt-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black tracking-widest text-(--text-muted) uppercase">Inschrijfdatum</p>
                                        <p className="text-sm font-bold text-(--text-main) uppercase">{formatDate(selectedTicket.date_created)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ),
                document.body
            )}
        </div>
    );
}