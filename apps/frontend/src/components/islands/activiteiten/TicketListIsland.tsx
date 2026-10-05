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
            <div className="ticket-header-row">
                <div className="group ticket-search-bar">
                    <Search className="ticket-search-icon" />
                    <input
                        type="text"
                        placeholder="Tickets zoeken..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="ticket-search-input"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="ticket-stat-box">
                        <div className="rounded-lg bg-theme-purple/10 p-2 text-theme-purple">
                            <Ticket className="size-4" />
                        </div>
                        <div>
                            <p className="text-caption-muted-bold">Totaal aantal tickets</p>
                            <p className="text-sm font-black text-text-main">{tickets.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <div className="ticket-empty-state">
                    <Ticket className="ticket-empty-icon" />
                    <h3 className="ticket-empty-title">Geen tickets <span className="text-theme-purple">gevonden</span></h3>
                    <p className="mt-2 font-medium text-text-muted">Je hebt nog geen tickets voor aankomende activiteiten.</p>
                </div>
            ) : (
                <div className="ticket-grid-layout">
                    {filteredTickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => handleTicketSelect(ticket)}
                            className="group ticket-grid-card"
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div className="ticket-card-icon-box group-hover:bg-theme-purple group-hover:text-wit-paars">
                                    <QrCode className="size-6" />
                                </div>
                                <div className="text-right">
                                    <p className="text-caption-muted-bold">{formatDate(ticket.date_created)}</p>
                                    <p className="text-caption-purple-bold">#{ticket.id}</p>
                                </div>
                            </div>

                            <h3 className="ticket-card-title">
                                {ticket.event_id?.name || 'Activiteit'}
                            </h3>

                            <div className="space-y-2 border-t border-border-color/30 pt-4">
                                <div className="flex items-center gap-2 text-text-muted">
                                    <Calendar className="size-3" />
                                    <span className="text-2xs font-bold uppercase">{formatDate(ticket.event_id?.event_date)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-text-muted">
                                    <MapPin className="size-3" />
                                    <span className="truncate text-2xs font-bold uppercase">{ticket.event_id?.location || 'Strijp-S'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {mounted && createPortal(
                selectedTicket && (
                    <div className="ticket-modal-backdrop" onClick={handleCloseModal}>
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="ticket-modal-card"
                        >
                            <button
                                onClick={handleCloseModal}
                                className="group btn-modal-close-ticket"
                                type="button">
                                <X className="icon-close-muted" />
                            </button>

                            <div className="flex flex-col items-center space-y-8 p-8 md:p-12">
                                <div className="space-y-2 text-center">
                                    <p className="text-caption-purple-bold">Jouw Digitale Ticket</p>
                                    <h2 className="ticket-modal-title">
                                        {selectedTicket.event_id?.name || 'Activiteit'}
                                    </h2>
                                </div>

                                <div className="ticket-qr-box">
                                    <QRDisplay qrToken={selectedTicket.qr_token} size={240} />
                                </div>

                                <div className="space-y-1 text-center">
                                    <p className="ticket-participant-name">{selectedTicket.participant_name}</p>
                                    <p className="ticket-hint-caption">Toon deze code bij de entree</p>
                                </div>

                                <div className="w-full border-t border-border-color/50 pt-8">
                                    <div className="space-y-1">
                                        <p className="text-caption-muted-bold">Inschrijfdatum</p>
                                        <p className="text-sm font-bold text-text-main uppercase">{formatDate(selectedTicket.date_created)}</p>
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