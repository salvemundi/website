'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import {
    Plus,
    Settings,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    deletePubCrawlSignup,
    toggleKroegentochtVisibility,
    getPubCrawlSignups,
    updatePubCrawlSignup
} from '@/server/actions/admin/admin-kroegentocht.actions';
import EventDropdown from '@/components/islands/admin/kroegentocht/EventDropdown';
import SignupList from '@/components/islands/admin/kroegentocht/SignupList';
import { type PubCrawlEvent, type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { safeConsoleError } from '@/server/utils/logger';

interface ExtendedSignup extends PubCrawlSignup {
    participants?: { name: string; initial: string }[];
    created_at: string;
}

interface KroegentochtManagementIslandProps {
    initialEvents?: PubCrawlEvent[];
    initialSettings?: { show: boolean };
    initialSignups?: ExtendedSignup[];
}

export default function KroegentochtManagementIsland({
    initialEvents = [],
    initialSettings = { show: false },
    initialSignups = []
}: KroegentochtManagementIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const events = initialEvents;
    const [selectedEvent, setSelectedEvent] = useState<PubCrawlEvent | null>(
        initialEvents.find(e => e.date && new Date(e.date) >= new Date()) || initialEvents[0] || null
    );
    const [signups, setSignups] = useState<ExtendedSignup[]>(initialSignups);

    useEffect(() => {
        if (selectedEvent) {
            const updated = initialEvents.find(e => Number(e.id) === Number(selectedEvent.id));
            if (updated && updated !== selectedEvent) {
                setSelectedEvent(updated);
            }
        }
    }, [initialEvents, selectedEvent]);
    const [settings, setSettings] = useState(initialSettings);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const loadSignups = useCallback((eventId: number | string) => {
        setError(null);
        startTransition(() => {
            void (async () => {
                try {
                    const data = await getPubCrawlSignups(Number(eventId));
                    setSignups(data);
                } catch (error) {
                    safeConsoleError('[KroegentochtManagementIsland.tsx][KroegentochtManagementIsland] ', error);
                    showToast('Fout bij het laden van aanmeldingen. Probeer het opnieuw.', 'error');
                    setError('Kon gegevens niet ophalen van de server.');
                }
            })();
        });
    }, [showToast]);

    const handleRefresh = () => {
        if (selectedEvent) {
            loadSignups(selectedEvent.id);
            showToast('Gegevens worden ververst...', 'success');
        }
    };

    useEffect(() => {
        if (selectedEvent && signups.length === 0 && initialSignups.length === 0) {
            loadSignups(selectedEvent.id);
        }
    }, [selectedEvent, signups.length, initialSignups.length, loadSignups]);

    useEffect(() => {
        setSignups(initialSignups);
    }, [initialSignups]);

    const handleEventSelect = (event: PubCrawlEvent) => {
        setSelectedEvent(event);
        loadSignups(event.id);
    };

    const handleToggleVisibility = () => {
        startTransition(() => {
            void (async () => {
                try {
                    const result = await toggleKroegentochtVisibility();
                    if (result.success) {
                        setSettings({ show: result.show ?? false });
                        showToast(`Kroegentocht is nu ${result.show ? 'zichtbaar' : 'verborgen'}`, 'success');
                        router.refresh();
                    }
                } catch (error) {
                    safeConsoleError('[KroegentochtManagementIsland.tsx][KroegentochtManagementIsland] ', error);
                    showToast('Fout bij bijwerken zichtbaarheid', 'error');
                }
            })();
        });
    };

    const handleDeleteSignup = async (id: number | string) => {
        if (!selectedEvent) return;
        if (!confirm('Weet je zeker dat je deze inschrijving wilt verwijderen?')) return;

        try {
            await deletePubCrawlSignup(Number(id), Number(selectedEvent.id));
            setSignups(prev => prev.filter(s => s.id !== id));
            showToast('Inschrijving succesvol verwijderd', 'success');
        } catch (error) {
            safeConsoleError('[KroegentochtManagementIsland.tsx][KroegentochtManagementIsland] ', error);
            showToast('Fout bij verwijderen: ' + String(error), 'error');
        }
    };

    const handleUpdateGroup = async (signupId: number, newGroupName: string | null) => {
        try {
            await updatePubCrawlSignup(signupId, Number(selectedEvent?.id), { group_name: newGroupName });
            setSignups(prev => prev.map(s => s.id === signupId ? { ...s, group_name: newGroupName } : s));
            showToast('Groep succesvol bijgewerkt', 'success');
        } catch (error) {
            showToast('Fout bij bijwerken groep: ' + String(error), 'error');
        }
    };



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

                        {selectedEvent && (
                            <Link
                                href={`/beheer/kroegentocht/bewerk/${selectedEvent.id}`}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-(--beheer-radius) text-(--beheer-text-muted) hover:text-(--beheer-accent) hover:border-(--beheer-accent)/30 transition-all active:scale-90 text-sm font-semibold shadow-sm"
                                title="Event Details"
                            >
                                <Settings className="h-4 w-4" />
                                <span className="hidden sm:inline">Details</span>
                            </Link>
                        )}

                        <button
                            onClick={handleRefresh}
                            disabled={isPending}
                            className="p-2.5 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-(--beheer-radius) text-(--beheer-text-muted) hover:text-(--beheer-accent) hover:border-(--beheer-accent)/30 transition-all active:scale-90 disabled:opacity-50"
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
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-(--beheer-accent) text-white font-semibold text-base rounded-(--beheer-radius) shadow-lg hover:opacity-90 transition-all active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Nieuw Event
                        </Link>
                    </>
                }
            />

            <div className="w-full py-4 md:py-8">
                <div className="flex flex-col">

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-(--beheer-radius) text-red-500 text-base font-semibold flex items-center gap-3">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                            <button
                                onClick={handleRefresh}
                                className="ml-auto underline"
                            >
                                Probeer opnieuw
                            </button>
                        </div>
                    )}

                    {selectedEvent ? (
                        <div className="space-y-8">
                            <div className={`transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <SignupList
                                    signups={signups}
                                    eventId={selectedEvent.id}
                                    eventName={selectedEvent.name}
                                    onDelete={(id) => {
                                        void handleDeleteSignup(id);
                                    }}
                                    onEdit={(id) => router.push(`/beheer/kroegentocht/deelnemer/${id}`)}
                                    eventGroups={((selectedEvent.groups || []) as unknown[])}
                                    onUpdateGroup={handleUpdateGroup}
                                    onRefresh={handleRefresh}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-(--bg-card)/40 rounded-2xl border-2 border-dashed border-(--border-color)/30">
                            <AlertCircle className="h-16 w-16 text-(--text-muted) opacity-20 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-(--text-main) tracking-tight">Geen Event Geselecteerd</h2>
                            <p className="text-base text-(--text-subtle) mt-2">Kies een event hierboven om de data te bekijken.</p>
                        </div>
                    )}
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}



