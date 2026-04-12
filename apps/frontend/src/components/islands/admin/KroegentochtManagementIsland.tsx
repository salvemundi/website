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
    Building2
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
import { Skeleton } from '@/components/ui/Skeleton';

import EventSelector from '@/components/admin/kroegentocht/EventSelector';
import SignupList from '@/components/admin/kroegentocht/SignupList';
import { type PubCrawlEvent, type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

interface ExtendedSignup extends PubCrawlSignup {
    participants?: { name: string; initial: string }[];
}

interface KroegentochtManagementIslandProps {
    initialEvents?: PubCrawlEvent[];
    initialSettings?: { show: boolean };
    isLoading?: boolean;
}

export default function KroegentochtManagementIsland({
    initialEvents = [],
    initialSettings = { show: false },
    isLoading = false
}: KroegentochtManagementIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [events] = useState(initialEvents);
    const [selectedEvent, setSelectedEvent] = useState<PubCrawlEvent | null>(
        initialEvents.find(e => e.date && new Date(e.date) >= new Date()) || initialEvents[0] || null
    );
    const [signups, setSignups] = useState<ExtendedSignup[]>([]);
    const [isLoadingSignups, setIsLoadingSignups] = useState(false);
    const [showPastEvents, setShowPastEvents] = useState(false);
    const [settings, setSettings] = useState(initialSettings);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Load signups when event changes
    const loadSignups = async (eventId: number | string) => {
        setIsLoadingSignups(true);
        setError(null);
        try {
            const data = await getPubCrawlSignups(Number(eventId));
            setSignups(data);
        } catch (err) {
            
            showToast('Kon aanmeldingen niet laden. Controleer je verbinding.', 'error');
        } finally {
            setIsLoadingSignups(false);
        }
    };

    // Trigger initial load or on change
    useEffect(() => {
        if (selectedEvent) loadSignups(selectedEvent.id);
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
        { label: 'Aanmeldingen', value: paidSignups.length, icon: Users, trend: 'Groepen' },
        { label: 'Tickets', value: paidSignups.reduce((sum, s) => sum + (s.amount_tickets || 0), 0), icon: Beer, trend: 'Totaal' },
        { label: 'Verenigingen', value: [...new Set(paidSignups.map(s => s.association).filter(Boolean))].length, icon: Building2, trend: 'Uniek' },
        { label: 'Onbetaald', value: signups.filter(s => s.payment_status !== 'paid').length, icon: AlertCircle, trend: 'Open' },
    ];

    return (
        <>
            <AdminToolbar 
                isLoading={isLoading}
                title={isLoading ? "" : "Kroegentocht"}
                subtitle={isLoading ? "" : "Aanmeldingen, tickets & event instellingen"}
                backHref="/beheer"
                actions={
                    isLoading ? (
                        <Skeleton className="h-[var(--beheer-btn-height)] w-24" />
                    ) : (
                        <>
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
                    )
                }
            />

            <div className={`container mx-auto px-4 py-8 max-w-7xl ${isLoading ? 'animate-pulse' : 'animate-in fade-in slide-in-from-bottom-4 duration-700'}`}>
                <AdminStatsBar stats={adminStats} isLoading={isLoading} />

            {/* Event Selector Section */}
            <div className="mb-10">
                {isLoading ? (
                    <div className="flex flex-wrap gap-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-40 rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <EventSelector 
                        events={events}
                        selectedEventId={selectedEvent?.id || null}
                        onSelect={handleEventSelect}
                        showPastEvents={showPastEvents}
                        setShowPastEvents={setShowPastEvents}
                    />
                )}
            </div>

            {isLoading ? (
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-48" />
                    </div>
                    {[...Array(2)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                    ))}
                </div>
            ) : selectedEvent ? (
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
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
