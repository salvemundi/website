'use client';

import { useState, useTransition, useEffect } from 'react';
import { 
    Plus, 
    Settings, 
    Loader2, 
    Beer, 
    ChevronLeft,
    AlertCircle,
    Users,
    Building2,
    RefreshCw
} from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    deletePubCrawlSignup, 
    toggleKroegentochtVisibility,
    getPubCrawlSignups
} from '@/server/actions/admin-kroegentocht.actions';
import EventDropdown from '@/components/admin/kroegentocht/EventDropdown';
import SignupList from '@/components/admin/kroegentocht/SignupList';
import { type PubCrawlEvent, type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

interface ExtendedSignup extends PubCrawlSignup {
    participants?: { name: string; initial: string }[];
}

interface KroegentochtManagementIslandProps {
    initialEvents?: PubCrawlEvent[];
    initialSettings?: { show: boolean };
    initialSignups?: ExtendedSignup[];
}

export default function KroegentochtManagementIsland({
    initialEvents = [],
    initialSettings = { show: false },
    initialSignups = [],
}: KroegentochtManagementIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [events] = useState(initialEvents);
    const [selectedEvent, setSelectedEvent] = useState<PubCrawlEvent | null>(
        initialEvents.find(e => e.date && new Date(e.date) >= new Date()) || initialEvents[0] || null
    );
    const [signups, setSignups] = useState<ExtendedSignup[]>(initialSignups);
    const [settings, setSettings] = useState(initialSettings);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Load signups when event changes
    const loadSignups = async (eventId: number | string) => {
        setError(null);
        startTransition(async () => {
            try {
                const data = await getPubCrawlSignups(Number(eventId));
                if (!data || data.length === 0) {
                    // No signups found
                }
                setSignups(data);
            } catch (err) {
                console.error('[Kroegentocht] Error loading signups:', err);
                showToast('Fout bij het laden van aanmeldingen. Probeer het opnieuw.', 'error');
                setError('Kon gegevens niet ophalen van de server.');
            }
        });
    };

    const handleRefresh = () => {
        if (selectedEvent) {
            loadSignups(selectedEvent.id);
            showToast('Gegevens worden ververst...', 'success');
        }
    };

    // NUCLEAR SSR: Effect only triggers on manual event change, not mount if initialSignups matches
    useEffect(() => {
        if (selectedEvent && signups.length === 0 && initialSignups.length === 0) {
            // This is just a fallback for edge cases where server might return empty but we want to be sure
            loadSignups(selectedEvent.id);
        }
    }, [selectedEvent?.id]);

    const handleEventSelect = (event: PubCrawlEvent) => {
        setSelectedEvent(event);
        loadSignups(event.id);
    };

    const handleToggleVisibility = () => {
        startTransition(async () => {
            try {
                const result = await toggleKroegentochtVisibility();
                if (result.success) {
                    setSettings({ show: result.show ?? false });
                    showToast(`Kroegentocht is nu ${result.show ? 'zichtbaar' : 'verborgen'}`, 'success');
                    router.refresh(); // Force re-fetch of layout data (like navbar)
                }
            } catch (err) {
                
                showToast('Fout bij bijwerken zichtbaarheid', 'error');
            }
        });
    };

    const handleDeleteSignup = async (id: number | string) => {
        if (!selectedEvent) return;
        if (!confirm('Weet je zeker dat je deze inschrijving wilt verwijderen?')) return;
        
        try {
            await deletePubCrawlSignup(Number(id), Number(selectedEvent.id));
            setSignups(prev => prev.filter(s => s.id !== id));
            showToast('Inschrijving succesvol verwijderd', 'success');
        } catch (err) {
            showToast('Fout bij verwijderen: ' + err, 'error');
        }
    };

    const paidSignups = signups.filter(s => s.payment_status === 'paid');
    const adminStats = [
        { label: 'Tickets', value: paidSignups.reduce((sum, s) => sum + (s.amount_tickets || 0), 0), icon: Beer, trend: 'Totaal verkocht' },
        { label: 'Groepen', value: paidSignups.length, icon: Users, trend: 'Aanmeldingen' },
        { label: 'Verenigingen', value: [...new Set(paidSignups.map(s => s.association).filter(Boolean))].length, icon: Building2, trend: 'Deelnemend' },
    ];

    return (
        <>
            <AdminToolbar 
                title="Kroegentocht"
                subtitle={selectedEvent ? `Beheer: ${selectedEvent.name}` : "Aanmeldingen, tickets & event instellingen"}
                backHref="/beheer"
                actions={
                    <>
                        <EventDropdown 
                            events={events}
                            selectedEventId={selectedEvent?.id || null}
                            onSelect={handleEventSelect}
                        />

                        <button
                            onClick={handleRefresh}
                            disabled={isPending}
                            className="p-2.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] hover:border-[var(--beheer-accent)]/30 transition-all active:scale-90 disabled:opacity-50"
                            title="Vernieuwen"
                        >
                            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                        </button>

                        <AdminVisibilityToggle 
                            isVisible={settings.show}
                            onToggle={handleToggleVisibility}
                            isPending={isPending}
                        />

                        <Link 
                            href="/beheer/kroegentocht/nieuw"
                            className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Nieuw Event
                        </Link>
                    </>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-[var(--beheer-radius)] text-red-500 text-sm font-bold flex items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                        <button onClick={handleRefresh} className="ml-auto underline">Probeer opnieuw</button>
                    </div>
                )}

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

                    <AdminStatsBar stats={adminStats} />

                    <div className={`transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <SignupList 
                            signups={signups}
                            eventId={selectedEvent.id}
                            eventName={selectedEvent.name}
                            onDelete={handleDeleteSignup}
                            onEdit={(id) => router.push(`/beheer/kroegentocht/deelnemer/${id}`)}
                        />
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-[var(--bg-card)]/40 rounded-[var(--radius-2xl)] border-2 border-dashed border-[var(--border-color)]/30">
                    <AlertCircle className="h-16 w-16 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Geen Event Geselecteerd</h2>
                    <p className="text-sm text-[var(--text-subtle)] mt-2">Kies een event hierboven om de data te bekijken.</p>
                </div>
            )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
