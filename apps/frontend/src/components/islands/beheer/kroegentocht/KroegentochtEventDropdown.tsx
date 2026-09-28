'use client';

import { Calendar, ChevronDown, Beer } from 'lucide-react';
import { type PubCrawlEvent } from '@salvemundi/validations/schema/pub-crawl.zod';
import { useState, useRef, useEffect } from 'react';

interface KroegentochtEventDropdownProps {
    events: PubCrawlEvent[];
    selectedEventId: string | number | null;
    onSelect: (event: PubCrawlEvent) => void;
}

const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);

export default function KroegentochtEventDropdown({
    events,
    selectedEventId,
    onSelect }: KroegentochtEventDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const selectedEvent = events.find(e => e.id === selectedEventId);

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

    const sortedEvents = [...events].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group beheer-button flex min-w-50 items-center gap-3 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2.5 text-(--beheer-text) transition-all hover:border-(--beheer-accent)/50 active:scale-95"
            >
                <div className="rounded-lg bg-(--beheer-accent)/10 p-1.5 text-(--beheer-accent)">
                    <Beer className="size-4" />
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="mb-0.5 text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Selecteer Event</span>
                    <span className="w-full truncate text-sm font-semibold">
                        {selectedEvent?.name || 'Geen event'}
                    </span>
                </div>
                <ChevronDown className={`ml-auto size-4 text-(--beheer-text-muted) transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-(--shadow-card-elevated) duration-200 ease-out"
                >
                    <div className="custom-scrollbar max-h-75 space-y-1 overflow-y-auto p-2">
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
                                    className={`group/item beheer-button flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${isSelected
                                        ? 'bg-(--beheer-accent)/10 text-(--beheer-accent)'
                                        : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) hover:text-(--beheer-text)'
                                        }`}
                                >
                                    <div className={`rounded-lg p-2 transition-colors ${isSelected ? 'bg-(--beheer-accent) text-white' : 'bg-(--beheer-border)/50 group-hover/item:bg-(--beheer-accent)/10 group-hover/item:text-(--beheer-accent)'}`}>
                                        <Calendar className="size-3.5" />
                                    </div>
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-semibold">{event.name}</span>
                                        <div className="flex items-center gap-2 text-[10px] opacity-60">
                                            <span>{formatDate(eventDate)}</span>
                                            {isUpcoming && <span className="font-semibold tracking-tighter text-green-500">Live</span>}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}