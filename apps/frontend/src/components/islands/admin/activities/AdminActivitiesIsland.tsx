'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Calendar, 
    Users, 
    Plus, 
    Clock, 
    Loader2 
} from 'lucide-react';
import { 
    deleteActivity, 
    sendActivityReminder, 
    sendActivityCustomNotification 
} from '@/server/actions/activiteiten.actions';
import { isSuperAdmin } from '@/lib/auth';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import ActivityCard from './ActivityCard';
import ActivityFilters from './ActivityFilters';
import ActivityNotificationModal from './ActivityNotificationModal';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

function cleanCommitteeName(name: string): string {
    return name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

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
    committee_name?: string | null;
    status?: 'published' | 'draft' | 'archived' | 'scheduled' | null;
    publish_date?: string | null;
    signup_count?: number;
}

interface Props {
    initialEvents?: AdminActivity[];
    committees?: any[];
    userId?: string;
    userCommittees?: any[];
}

export default function AdminActivitiesIsland({
    initialEvents = [],
    committees = [],
    userCommittees = [],
}: Props) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [events, setEvents] = useState(initialEvents);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
    const [pageSize, setPageSize] = useState<number | -1>(10);
    const [showModal, setShowModal] = useState(false);
    const [customNotification, setCustomNotification] = useState({ title: '', body: '', eventId: 0 });
    const [isSending, setIsSending] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleFilterChange = (newFilter: 'all' | 'upcoming' | 'past') => setFilter(newFilter);

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen?`)) return;
        startTransition(async () => {
            const res = await deleteActivity(id);
            if (res.success) {
                setEvents(prev => prev.filter(e => e.id !== id));
                showToast(`"${name}" is verwijderd`, 'success');
            } else {
                showToast(res.error || 'Fout bij verwijderen', 'error');
            }
        });
    };

    const handleReminder = async (id: number, name: string) => {
        if (!confirm(`Herinnering sturen naar deelnemers van "${name}"?`)) return;
        setIsSending(true);
        const res = await sendActivityReminder(id);
        setIsSending(false);
        if (res.success) showToast(`Herinnering verstuurd naar ${res.sent} deelnemers!`, 'success');
        else showToast(res.error || 'Fout bij versturen', 'error');
    };

    const handleSendCustomNotify = async () => {
        setIsSending(true);
        const res = await sendActivityCustomNotification(customNotification.eventId, customNotification.title, customNotification.body);
        setIsSending(false);
        if (res.success) {
            showToast(`Notificatie verstuurd!`, 'success');
            setShowModal(false);
        } else {
            showToast(res.error || 'Fout bij versturen', 'error');
        }
    };

    const availableCommittees = useMemo(() => {
        return committees
            .map(c => ({ id: String(c.id), name: cleanCommitteeName(c.name || '') }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [committees]);

    const filteredEvents = useMemo(() => {
        let result = events;
        const now = new Date();
        if (filter === 'upcoming') result = result.filter(e => new Date(e.event_date) >= now);
        else if (filter === 'past') result = result.filter(e => new Date(e.event_date) < now);
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(e => e.name.toLowerCase().includes(query) || e.location?.toLowerCase().includes(query));
        }
        if (selectedCommittee !== 'all') result = result.filter(e => String(e.committee_id) === selectedCommittee);
        return result;
    }, [events, filter, searchQuery, selectedCommittee]);

    const displayedEvents = pageSize === -1 ? filteredEvents : filteredEvents.slice(0, pageSize);
    const superAdmin = useMemo(() => isSuperAdmin(userCommittees), [userCommittees]);

    const stats = useMemo(() => {
        const upcomingCount = filteredEvents.filter(e => new Date(e.event_date) >= new Date()).length;
        const totalSignups = filteredEvents.reduce((acc, curr) => acc + (curr.signup_count || 0), 0);
        return [
            { label: 'Upcoming', value: upcomingCount, icon: Clock, trend: 'Activities' },
            { label: 'Total', value: filteredEvents.length, icon: Calendar, trend: 'Events' },
            { label: 'Sign-ups', value: totalSignups, icon: Users, trend: 'Registrations' },
        ];
    }, [filteredEvents]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-end mb-8">
                <button
                    onClick={() => router.push('/beheer/activiteiten/nieuw')}
                    className="bg-[var(--beheer-accent)] text-white px-8 py-2 rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-[10px] shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-95 flex items-center gap-2 group disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Nieuw
                </button>
            </div>

            <AdminStatsBar stats={stats} />

            <ActivityFilters 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filter={filter}
                onFilterChange={handleFilterChange}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                selectedCommittee={selectedCommittee}
                committees={availableCommittees}
                onCommitteeChange={setSelectedCommittee}
            />

            <div className="grid grid-cols-1 gap-8 mt-10">
                {displayedEvents.map((event) => (
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
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
