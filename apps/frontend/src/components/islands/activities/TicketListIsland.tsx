'use client';

import { useState } from 'react';
import { 
    Ticket, 
    Calendar, 
    MapPin, 
    QrCode, 
    ChevronRight,
    Search,
    Download
} from 'lucide-react';
import QRDisplay from '@/shared/ui/QRDisplay';

interface TicketListIslandProps {
    tickets: any[];
}

export default function TicketListIsland({ tickets }: TicketListIslandProps) {
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [search, setSearch] = useState('');

    const handleTicketSelect = (ticket: any) => setSelectedTicket(ticket);
    const handleCloseModal = () => setSelectedTicket(null);

    /**
     * Users can search for specific events by name to quickly find their QR 
     * in a long list of historical tickets.
     */
    const filteredTickets = tickets.filter(ticket => 
        (ticket.event_id?.name || 'Activiteit').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Search & Stats Section */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-[var(--theme-purple)] transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Tickets zoeken..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm font-black uppercase tracking-widest focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all outline-none"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[var(--theme-purple)]/10 text-[var(--theme-purple)]">
                            <Ticket className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Totaal</p>
                            <p className="text-sm font-black text-[var(--text-main)]">{tickets.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <div className="py-32 text-center bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border-color)]">
                    <Ticket className="h-16 w-16 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight italic">Geen tickets <span className="text-[var(--theme-purple)]">gevonden</span></h3>
                    <p className="text-[var(--text-muted)] mt-2 font-medium">Je hebt nog geen tickets voor aankomende activiteiten.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTickets.map((ticket) => (
                        <div 
                            key={ticket.id}
                            onClick={() => handleTicketSelect(ticket)}
                            className="group relative bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] hover:border-[var(--theme-purple)]/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-[var(--theme-purple)]/5 hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-2xl bg-[var(--theme-purple)]/5 text-[var(--theme-purple)] group-hover:bg-[var(--theme-purple)] group-hover:text-white transition-all duration-500">
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{new Date(ticket.date_created).toLocaleDateString('nl-NL')}</p>
                                    <p className="text-[10px] font-black text-[var(--theme-purple)] uppercase tracking-widest">#{ticket.id}</p>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter italic mb-4 line-clamp-1">
                                {ticket.event_id?.name || 'Activiteit'}
                            </h3>

                            <div className="space-y-2 border-t border-[var(--border-color)]/30 pt-4">
                                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                    <Calendar className="h-3 w-3" />
                                    <span className="text-[10px] font-bold uppercase">{new Date(ticket.event_id?.event_date).toLocaleDateString('nl-NL')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                    <MapPin className="h-3 w-3" />
                                    <span className="text-[10px] font-bold uppercase truncate">{ticket.event_id?.location || 'Strijp-S'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Ticket Modal Integration */}
            {selectedTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] rounded-[3rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden relative group">
                        <button 
                            onClick={handleCloseModal}
                            className="absolute top-6 right-6 p-2 h-10 w-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors z-20"
                        >
                            <ChevronRight className="h-6 w-6 rotate-90" />
                        </button>

                        <div className="p-12 space-y-8 flex flex-col items-center">
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-black text-[var(--theme-purple)] uppercase tracking-[0.3em]">Jouw Digitale Ticket</p>
                                <h2 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter italic">
                                    {selectedTicket.event_id?.name || 'Activiteit'}
                                </h2>
                            </div>

                            <div className="p-6 bg-white rounded-[3rem] shadow-2xl ring-1 ring-black/5">
                                <QRDisplay qrToken={selectedTicket.qr_token} size={240} />
                            </div>

                            <div className="text-center space-y-1">
                                <p className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight italic">{selectedTicket.participant_name}</p>
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60 italic">Toon deze code bij de entree</p>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 border-t border-[var(--border-color)]/50 pt-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Inschrijfdatum</p>
                                    <p className="text-sm font-bold text-[var(--text-main)] uppercase">{new Date(selectedTicket.date_created).toLocaleDateString('nl-NL')}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Status</p>
                                    <p className="text-sm font-bold text-green-500 uppercase italic">GELIDIGEERT</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
