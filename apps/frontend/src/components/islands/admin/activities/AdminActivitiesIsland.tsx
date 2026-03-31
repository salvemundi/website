'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Calendar, 
    Users, 
    Plus, 
    Euro, 
    Clock, 
    Loader2 
} from 'lucide-react';
import { 
    deleteActivity, 
    sendActivityReminder, 
    sendActivityCustomNotification 
} from '@/server/actions/activiteiten.actions';
import { isSuperAdmin } from '@/lib/auth-utils';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';

import ActivityCard from './ActivityCard';
import ActivityFilters from './ActivityFilters';
import ActivityNotificationModal from './ActivityNotificationModal';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface AdminActivity {
    id: number;
    name: string;
    event_date: string;
    event_date_end?: string | null;
    description?: string | null;
    location?: string | null;
    max_sign_ups?: number | null;
    price_members?: number | null;
    price_non_members?: number | null;
    registration_deadline?: string | null;
    contact?: string | null;
    image?: any;
    committee_id?: number | null;
    status?: 'published' | 'draft' | 'archived' | 'scheduled' | null;
    publish_date?: string | null;
    signup_count?: number;
}

interface Props {
    initialEvents: AdminActivity[];
    userId?: string;
    userCommittees?: any[];
    initialSearch?: string;
    initialFilter?: 'all' | 'upcoming' | 'past';
}

export default function AdminActivitiesIsland({
    initialEvents,
    userCommittees = [],
    initialSearch = '',
    initialFilter = 'all'
}: Props) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [events, setEvents] = useState(initialEvents);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>(initialFilter);
    const [pageSize, setPageSize] = useState<number | -1>(10);

    // Notification states
    const [showModal, setShowModal] = useState(false);
    const [customNotification, setCustomNotification] = useState({ title: '', body: '', eventId: 0 });
    const [isSending, setIsSending] = useState(false);

    const [isPending, startTransition] = useTransition();

    // Sync state with props
    useEffect(() => {
        setEvents(initialEvents);
        setSearchQuery(initialSearch);
        setFilter(initialFilter);
    }, [initialEvents, initialSearch, initialFilter]);

    // Search debounce logic (handled by URL updates)
    useEffect(() => {
        if (searchQuery === initialSearch) return;
        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (filter !== 'all') params.set('filter', filter);
            router.push(`/beheer/activiteiten?${params.toString()}`);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleFilterChange = (newFilter: 'all' | 'upcoming' | 'past') => {
        setFilter(newFilter);
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (newFilter !== 'all') params.set('filter', newFilter);
        router.push(`/beheer/activiteiten?${params.toString()}`);
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) return;
        startTransition(async () => {
            const res = await deleteActivity(id);
            if (res.success) {
                setEvents(prev => prev.filter(e => e.id !== id));
                showToast(`"${name}" is succesvol verwijderd`, 'success');
            } else {
                showToast(res.error || 'Fout bij verwijderen', 'error');
            }
        });
    };

    const handleReminder = async (id: number, name: string) => {
        if (!confirm(`Wil je een herinnering sturen naar alle deelnemers van "${name}"?`)) return;
        setIsSending(true);
        const res = await sendActivityReminder(id);
        setIsSending(false);
        if (res.success) showToast(`Herinnering verstuurd naar ${res.sent} deelnemers!`, 'success');
        else showToast(res.error || 'Fout bij versturen reminder', 'error');
    };

    const handleSendCustomNotify = async () => {
        setIsSending(true);
        const res = await sendActivityCustomNotification(
            customNotification.eventId,
            customNotification.title,
            customNotification.body
        );
        setIsSending(false);
        if (res.success) {
            showToast(`Notificatie verstuurd naar ${res.sent} deelnemers!`, 'success');
            setShowModal(false);
        } else {
            showToast(res.error || 'Fout bij versturen notificatie', 'error');
        }
    };

    const displayedEvents = pageSize === -1 ? events : events.slice(0, pageSize);
    const superAdmin = useMemo(() => isSuperAdmin(userCommittees), [userCommittees]);

    const stats = useMemo(() => {
        const upcomingCount = events.filter(e => new Date(e.event_date) >= new Date()).length;
        const totalSignups = events.reduce((acc, curr) => acc + (curr.signup_count || 0), 0);
        const avgPrice = events.length > 0 ? (events.reduce((acc, curr) => acc + (curr.price_members || 0), 0) / events.length).toFixed(2) : '0.00';
        
        return [
            { label: 'Activiteiten', value: events.length, icon: Calendar, theme: 'blue' },
            { label: 'Aankomend', value: upcomingCount, icon: Clock, theme: 'emerald' },
            { label: 'Aanmeldingen', value: totalSignups, icon: Users, theme: 'indigo' },
            { label: 'Gem. Prijs Member', value: `€${avgPrice}`, icon: Euro, theme: 'amber' },
        ];
    }, [events]);

    return (
        <>
            <AdminToolbar 
                title="Activiteiten Beheer"
                subtitle="Organiseer en beheer alle evenementen van Salve Mundi"
                backHref="/beheer"
                actions={
                    <button
                        onClick={() => router.push('/beheer/activiteiten/nieuw')}
                        className="bg-[var(--beheer-accent)] text-white px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-95 flex items-center gap-2 cursor-pointer group"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nieuw</span>
                    </button>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <AdminStatsBar stats={stats} />

                <ActivityFilters 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                />

                <div className="grid grid-cols-1 gap-8">
                    {displayedEvents.map(event => (
                        <ActivityCard 
                            key={event.id}
                            event={event}
                            canEdit={superAdmin || (event.committee_id !== null && userCommittees.some(c => String(c.id) === String(event.committee_id)))}
                            isSuperAdmin={superAdmin}
                            isPending={isPending}
                            isSending={isSending}
                            onViewSignups={(id) => router.push(`/beheer/activiteiten/${id}/aanmeldingen`)}
                            onReminder={handleReminder}
                            onCustomNotify={(e) => {
                                setCustomNotification({ title: `Update: ${e.name}`, body: '', eventId: e.id });
                                setShowModal(true);
                            }}
                            onEdit={(id) => router.push(`/beheer/activiteiten/${id}/bewerken`)}
                            onDelete={handleDelete}
                        />
                    ))}
                    {displayedEvents.length === 0 && (
                        <div className="py-24 text-center bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border-2 border-dashed border-[var(--beheer-border)]">
                            <Calendar className="h-12 w-12 text-[var(--beheer-text-muted)] mx-auto mb-4 opacity-20" />
                            <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px] opacity-60">Geen activiteiten gevonden</p>
                        </div>
                    )}
                </div>

                <ActivityNotificationModal 
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={customNotification.title}
                    body={customNotification.body}
                    onTitleChange={(v) => setCustomNotification(prev => ({ ...prev, title: v }))}
                    onBodyChange={(v) => setCustomNotification(prev => ({ ...prev, body: v }))}
                    onSend={handleSendCustomNotify}
                    isSending={isSending}
                />
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
