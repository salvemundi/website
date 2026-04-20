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
import { motion, AnimatePresence } from 'framer-motion';
import QRDisplay from '@/shared/ui/QRDisplay';
import { formatDate } from '@/shared/lib/utils/date';

interface TicketListIslandProps {
    tickets: any[];
}

export default function TicketListIsland({ tickets }: TicketListIslandProps) {
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
    const [search, setSearch] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Scroll Lock when modal is open
    useEffect(() => {
        if (selectedTicket) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [selectedTicket]);

    const handleTicketSelect = (ticket: any) => setSelectedTicket(ticket);
    const handleCloseModal = () => setSelectedTicket(null);

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
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Totaal aantal tickets</p>
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
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{formatDate(ticket.date_created)}</p>
                                    <p className="text-[10px] font-black text-[var(--theme-purple)] uppercase tracking-widest">#{ticket.id}</p>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tighter italic mb-4 line-clamp-1">
                                {ticket.event_id?.name || 'Activiteit'}
                            </h3>

                            <div className="space-y-2 border-t border-[var(--border-color)]/30 pt-4">
                                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                    <Calendar className="h-3 w-3" />
                                    <span className="text-[10px] font-bold uppercase">{formatDate(ticket.event_id?.event_date)}</span>
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

            {/* Ticket Modal Integration via Portal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {selectedTicket && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 isolate">
                            {/* Backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleCloseModal}
                                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                            />
                            
                            {/* Modal Content */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-[var(--bg-card)] rounded-[3rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden relative z-10"
                            >
                                <button 
                                    onClick={handleCloseModal}
                                    className="absolute top-6 right-6 p-2 h-10 w-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors z-20 group"
                                >
                                    <X className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
                                </button>

                                <div className="p-8 md:p-12 space-y-8 flex flex-col items-center">
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

                                    <div className="w-full border-t border-[var(--border-color)]/50 pt-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Inschrijfdatum</p>
                                            <p className="text-sm font-bold text-[var(--text-main)] uppercase">{formatDate(selectedTicket.date_created)}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
