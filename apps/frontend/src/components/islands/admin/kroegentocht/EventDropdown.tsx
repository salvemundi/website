'use client';

import { Calendar, ChevronDown, Beer } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { type PubCrawlEvent } from '@salvemundi/validations/schema/pub-crawl.zod';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EventDropdownProps {
    events: PubCrawlEvent[];
    selectedEventId: string | number | null;
    onSelect: (event: PubCrawlEvent) => void;
}

export default function EventDropdown({
    events,
    selectedEventId,
    onSelect,
}: EventDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedEvent = events.find(e => e.id === selectedEventId);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort events: upcoming first, then past
    const sortedEvents = [...events].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] text-[var(--beheer-text)] hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 group min-w-[200px]"
            >
                <div className="p-1.5 rounded-lg bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)]">
                    <Beer className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] leading-none mb-0.5">Selecteer Event</span>
                    <span className="text-sm font-bold truncate w-full">
                        {selectedEvent?.name || 'Geen event'}
                    </span>
                </div>
                <ChevronDown className={`h-4 w-4 ml-auto text-[var(--beheer-text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-72 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-[var(--shadow-card-elevated)] z-50 overflow-hidden"
                    >
                        <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {sortedEvents.map((event) => {
                                const eventDate = event.date ? new Date(event.date) : new Date(0);
                                const isUpcoming = event.date ? eventDate >= today : false;
                                const isSelected = selectedEventId === event.id;

                                return (
                                    <button
                                        key={event.id}
                                        onClick={() => {
                                            onSelect(event);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group/item ${
                                            isSelected 
                                                ? 'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)]' 
                                                : 'hover:bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-[var(--beheer-accent)] text-white' : 'bg-[var(--beheer-border)]/50 group-hover/item:bg-[var(--beheer-accent)]/10 group-hover/item:text-[var(--beheer-accent)]'}`}>
                                            <Calendar className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold truncate">{event.name}</span>
                                            <div className="flex items-center gap-2 text-[10px] opacity-60">
                                                <span>{format(eventDate, 'd MMM yyyy', { locale: nl })}</span>
                                                {isUpcoming && <span className="text-green-500 font-black tracking-tighter uppercase">Live</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
