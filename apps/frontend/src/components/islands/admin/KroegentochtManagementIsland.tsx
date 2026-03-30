'use client';

import { useState, useTransition, useEffect } from 'react';
import { 
    Plus, 
    Settings, 
    Loader2, 
    Beer, 
    ChevronLeft,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    deletePubCrawlSignup, 
    toggleKroegentochtVisibility,
    getPubCrawlSignups
} from '@/server/actions/admin-kroegentocht.actions';

import EventSelector from '@/components/admin/kroegentocht/EventSelector';
import KroegStats from '@/components/admin/kroegentocht/KroegStats';
import SignupList from '@/components/admin/kroegentocht/SignupList';

interface KroegentochtManagementIslandProps {
    initialEvents: any[];
    initialSettings: { show: boolean };
}

export default function KroegentochtManagementIsland({
    initialEvents,
    initialSettings
}: KroegentochtManagementIslandProps) {
    const router = useRouter();
    const [events] = useState(initialEvents);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(
        initialEvents.find(e => new Date(e.date) >= new Date()) || initialEvents[0] || null
    );
    const [signups, setSignups] = useState<any[]>([]);
    const [isLoadingSignups, setIsLoadingSignups] = useState(false);
    const [showPastEvents, setShowPastEvents] = useState(false);
    const [settings, setSettings] = useState(initialSettings);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Load signups when event changes
    const loadSignups = async (eventId: number) => {
        setIsLoadingSignups(true);
        setError(null);
        try {
            const data = await getPubCrawlSignups(eventId);
            setSignups(data);
        } catch (err) {
            console.error(err);
            setError('Kon aanmeldingen niet laden. Controleer je verbinding of probeer het later opnieuw.');
        } finally {
            setIsLoadingSignups(false);
        }
    };

    // Trigger initial load or on change
    useEffect(() => {
        if (selectedEvent) loadSignups(selectedEvent.id);
    }, [selectedEvent?.id]);

    const handleEventSelect = (event: any) => {
        setSelectedEvent(event);
        loadSignups(event.id);
    };

    const handleToggleVisibility = () => {
        startTransition(async () => {
            try {
                const result = await toggleKroegentochtVisibility();
                if (result.success) {
                    setSettings({ show: result.show ?? false });
                    router.refresh(); // Force re-fetch of layout data (like navbar)
                }
            } catch (err) {
                console.error(err);
            }
        });
    };

    const handleDeleteSignup = async (id: number) => {
        if (!selectedEvent) return;
        if (!confirm('Weet je zeker dat je deze inschrijving wilt verwijderen?')) return;
        
        try {
            await deletePubCrawlSignup(id, selectedEvent.id);
            setSignups(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert('Fout bij verwijderen: ' + err);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/beheer" 
                        className="p-3 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-all active:scale-90"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--beheer-text)] tracking-tighter uppercase">Kroegentocht <span className="text-[var(--beheer-accent)]">Beheer</span></h1>
                        <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest">Aanmeldingen, tickets & event instellingen</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Zichtbaarheid</span>
                        <button
                            onClick={handleToggleVisibility}
                            disabled={isPending}
                            className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${settings.show ? 'bg-[var(--beheer-active)]' : 'bg-[var(--beheer-inactive)]'} disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all`}
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" />
                            ) : (
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.show ? 'translate-x-[1.5rem]' : 'translate-x-0'} shadow-sm`} />
                            )}
                        </button>
                    </div>

                    <Link 
                        href="/beheer/kroegentocht/nieuw"
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Nieuw Event
                    </Link>
                </div>
            </div>

            {/* Event Selector Section */}
            <div className="mb-10">
                <EventSelector 
                    events={events}
                    selectedEventId={selectedEvent?.id || null}
                    onSelect={handleEventSelect}
                    showPastEvents={showPastEvents}
                    setShowPastEvents={setShowPastEvents}
                />
            </div>

            {selectedEvent ? (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Beer className="h-6 w-6 text-[var(--theme-purple)]" />
                            <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">
                                {selectedEvent.name}
                            </h2>
                        </div>
                        <Link 
                            href={`/beheer/kroegentocht/bewerk/${selectedEvent.id}`}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-main)]/50 border border-[var(--border-color)] rounded-[var(--radius-xl)] text-xs font-bold text-[var(--text-subtle)] hover:border-[var(--theme-purple)]/50 transition-all"
                        >
                            <Settings className="h-4 w-4" />
                            Event Details
                        </Link>
                    </div>

                    <KroegStats signups={signups} />

                    {error && (
                        <div className="flex flex-col items-center justify-center py-16 bg-red-50 dark:bg-red-900/10 rounded-[var(--radius-2xl)] border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 mb-8">
                            <AlertCircle className="h-10 w-10 mb-3" />
                            <p className="text-sm font-bold uppercase tracking-wider">{error}</p>
                            <button 
                                onClick={() => selectedEvent && loadSignups(selectedEvent.id)}
                                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition"
                            >
                                Opnieuw Proberen
                            </button>
                        </div>
                    )}

                    {isLoadingSignups ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-[var(--bg-card)]/40 rounded-[var(--radius-2xl)] border-2 border-dashed border-[var(--border-color)]/30">
                            <Loader2 className="h-10 w-10 animate-spin text-[var(--theme-purple)] mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Aanmeldingen laden...</p>
                        </div>
                    ) : (
                        <SignupList 
                            signups={signups}
                            eventId={selectedEvent.id}
                            eventName={selectedEvent.name}
                            onDelete={handleDeleteSignup}
                            onEdit={(id) => router.push(`/beheer/kroegentocht/deelnemer/${id}`)}
                        />
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-card)]/40 rounded-[var(--radius-2xl)] border-2 border-dashed border-[var(--border-color)]/30">
                    <AlertCircle className="h-16 w-16 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Geen Event Geselecteerd</h2>
                    <p className="text-sm text-[var(--text-subtle)] mt-2">Kies een event hierboven om de data te bekijken.</p>
                </div>
            )}
        </div>
    );
}
