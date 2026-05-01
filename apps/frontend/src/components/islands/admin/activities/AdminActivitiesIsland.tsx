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
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import ActivityCard from './ActivityCard';
import ActivityFilters from './ActivityFilters';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import type { UserPermissions } from '@/shared/lib/permissions';

function cleanCommitteeName(name: string): string {
    return name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

import { type AdminActivity } from '@salvemundi/validations/schema/admin.zod';
import { type DbCommittee } from '@salvemundi/validations/directus/schema';

interface Props {
    initialEvents?: AdminActivity[];
    committees?: DbCommittee[];
    userId?: string;
    userCommittees?: DbCommittee[];
    permissions?: UserPermissions;
}

export default function AdminActivitiesIsland({
    initialEvents = [],
    committees = [],
    userCommittees = [],
    permissions
}: Props) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [events, setEvents] = useState(initialEvents);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
    const [pageSize, setPageSize] = useState<number | -1>(10);
    const [isPending, startTransition] = useTransition();

    const handleFilterChange = (newFilter: 'all' | 'upcoming' | 'past') => setFilter(newFilter);

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
    const canEdit = !!permissions?.canAccessActivitiesEdit;

    const stats = useMemo(() => {
        const upcomingCount = filteredEvents.filter(e => new Date(e.event_date) >= new Date()).length;
        const totalSignups = filteredEvents.reduce((acc, curr) => acc + (curr.signup_count || 0), 0);
        return [
            { label: 'Aankomende activiteiten', value: upcomingCount, icon: Clock },
            { label: 'Totale activiteiten', value: filteredEvents.length, icon: Calendar },
            { label: 'Totale aanmeldingen', value: totalSignups, icon: Users },
        ];
    }, [filteredEvents]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {canEdit && (
                <div className="flex justify-end mb-8">
                    <button
                        onClick={() => router.push('/beheer/activiteiten/nieuw')}
                        className="bg-[var(--beheer-accent)] text-white px-8 py-2 rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-[10px] shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-95 flex items-center gap-2 group disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        Nieuw
                    </button>
                </div>
            )}

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
                        canEdit={canEdit}
                        isPending={isPending}
                        onViewSignups={(id) => router.push(`/beheer/activiteiten/${id}/aanmeldingen`)}
                        onEdit={(id) => router.push(`/beheer/activiteiten/${id}/bewerken`)}
                    />
                ))}
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
