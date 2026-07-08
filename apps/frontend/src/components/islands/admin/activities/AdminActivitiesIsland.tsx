'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import ActivityCard from './ActivityCard';
import ActivityFilters from './ActivityFilters';
import AdminToast from '@/components/ui/admin/AdminToast';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { useAdminToast } from '@/hooks/use-admin-toast';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

import { type AdminActivity } from '@salvemundi/validations/schema/admin.zod';
import { type Committee } from '@salvemundi/validations/directus/schema';

interface Props {
    initialEvents?: AdminActivity[];
    committees?: Committee[];
    userId?: string;
    userCommittees?: Committee[];
    permissions?: string[];
}

export default function AdminActivitiesIsland({
    initialEvents = [],
    committees = [],
    permissions
}: Props) {
    const router = useRouter();
    const { toast, hideToast } = useAdminToast();
    const [events] = useState(initialEvents);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
    const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
    const [pageSize, setPageSize] = useState<number | -1>(10);
    const [isPending] = useTransition();

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

    const displayedEvents = useMemo(() => {
        return pageSize === -1 ? filteredEvents : filteredEvents.slice(0, pageSize);
    }, [filteredEvents, pageSize]);

    const stats = useMemo(() => {
        const upcoming = displayedEvents.filter(e => e.event_date && new Date(e.event_date) >= new Date()).length;
        const signups = displayedEvents.reduce((acc, curr) => acc + (curr.signup_count || 0), 0);
        return {
            upcoming,
            total: displayedEvents.length,
            signups
        };
    }, [displayedEvents]);
    const canEdit = !!permissions?.includes('activiteiten:edit');

    return (
        <div className="w-full">
            <AdminToolbar
                title="Activiteiten Beheer"
                backHref="/beheer"
                actions={
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-4 bg-bg-soft px-4 py-2 rounded-2xl border border-border-color/50 shadow-sm">
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Aankomend</span>
                                <span className="text-sm font-bold text-text-main leading-none">{stats.upcoming}</span>
                            </div>
                            <div className="w-px h-6 bg-border-color/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Totale activiteiten</span>
                                <span className="text-sm font-bold text-text-main leading-none">{stats.total}</span>
                            </div>
                            <div className="w-px h-6 bg-border-color/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Aanmeldingen</span>
                                <span className="text-sm font-bold text-text-main leading-none">{stats.signups}</span>
                            </div>
                        </div>

                        <Link
                            href="/beheer/activiteiten/nieuw"
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-theme-purple text-white rounded-xl squircle text-xs font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 border border-white/10 whitespace-nowrap"
                        >
                            <Plus className="h-4 w-4" />
                            Nieuwe Activiteit
                        </Link>
                    </div>
                }
            />

            <div className="admin-container py-4 md:py-8 flex flex-col">
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
                            onViewAttendance={(id) => router.push(`/beheer/activiteiten/${id}/aanwezigheid`)}
                            onEdit={(id) => router.push(`/beheer/activiteiten/${id}/bewerken`)}
                        />
                    ))}
                </div>
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}