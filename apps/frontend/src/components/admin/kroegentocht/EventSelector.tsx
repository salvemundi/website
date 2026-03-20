'use client';

import { Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface EventSelectorProps {
    events: any[];
    selectedEventId: number | null;
    onSelect: (event: any) => void;
    showPastEvents: boolean;
    setShowPastEvents: (val: boolean) => void;
}

export default function EventSelector({
    events,
    selectedEventId,
    onSelect,
    showPastEvents,
    setShowPastEvents
}: EventSelectorProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredEvents = showPastEvents 
        ? events 
        : events.filter(e => new Date(e.date) >= today);

    return (
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight uppercase">Selecteer <span className="text-[var(--theme-purple)]">Event</span></h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Kies een kroegentocht om te beheren</p>
                </div>
                <button
                    onClick={() => setShowPastEvents(!showPastEvents)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-black rounded-[var(--radius-lg)] border-2 transition-all active:scale-95 ${
                        showPastEvents
                        ? 'bg-[var(--theme-purple)]/10 border-[var(--theme-purple)] text-[var(--theme-purple)]'
                        : 'bg-[var(--bg-main)]/50 border-[var(--border-color)] text-[var(--text-light)] hover:border-[var(--theme-purple)]/30'
                    }`}
                >
                    {showPastEvents ? '✅ Oude events getoond' : '👁️ Toon oude events'}
                </button>
            </div>

            {filteredEvents.length === 0 ? (
                <div className="text-center py-10 bg-[var(--bg-main)]/30 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border-color)]/50">
                    <Calendar className="h-10 w-10 text-[var(--text-muted)] opacity-20 mx-auto mb-3" />
                    <p className="text-sm text-[var(--text-subtle)] italic font-medium">Geen evenementen gevonden.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEvents.map(event => {
                        const eventDate = new Date(event.date);
                        const isUpcoming = eventDate >= today;
                        const isSelected = selectedEventId === event.id;

                        return (
                            <button
                                key={event.id}
                                onClick={() => onSelect(event)}
                                className={`group p-4 rounded-[var(--radius-xl)] border-2 transition-all text-left relative overflow-hidden active:scale-[0.98] ${
                                    isSelected
                                    ? 'border-[var(--theme-purple)] bg-[var(--theme-purple)]/5 shadow-[var(--shadow-glow)]'
                                    : 'border-[var(--border-color)]/50 bg-[var(--bg-card)] hover:border-[var(--theme-purple)]/30 hover:bg-[var(--bg-main)]/30'
                                }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--theme-purple)]/10 rounded-bl-full flex items-center justify-end pr-2 pb-2">
                                        <ChevronRight className="h-5 w-5 text-[var(--theme-purple)]" />
                                    </div>
                                )}
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className={`font-black uppercase tracking-tight truncate pr-6 ${isSelected ? 'text-[var(--theme-purple)]' : 'text-[var(--text-main)]'}`}>
                                        {event.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-subtle)]">
                                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                                    {format(eventDate, 'd MMMM yyyy', { locale: nl })}
                                    {isUpcoming && <span className="ml-auto px-2 py-0.5 bg-green-500/10 text-green-500 text-[9px] rounded-full uppercase">Live</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
