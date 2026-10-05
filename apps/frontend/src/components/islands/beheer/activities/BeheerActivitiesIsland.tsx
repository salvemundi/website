'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import ActivityCard from './ActivityCard';
import ActivityFilters from './ActivityFilters';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import BeheerToolbar from '@/components/ui/beheer/BeheerToolbar';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { isEventPast } from '@/shared/lib/utils/date';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

import { type BeheerActivity } from '@salvemundi/validations';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';

interface Props {
    initialEvents?: BeheerActivity[];
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
        const eventIsPast = (e: BeheerActivity) => isEventPast(
            e.event_date_end || e.event_date,
            e.event_time_end || e.event_time,
            !!e.event_time_end
        );
        if (filter === 'upcoming') result = result.filter(e => !eventIsPast(e));
        else if (filter === 'past') result = result.filter(e => eventIsPast(e));
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
        const upcoming = displayedEvents.filter(e => e.event_date && !isEventPast(
            e.event_date_end || e.event_date,
            e.event_time_end || e.event_time,
            !!e.event_time_end
        )).length;
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
            <BeheerToolbar
                title="Activiteiten Beheer"
                backHref="/beheer"
                actions={
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="beheer-stat-strip">
                            <div className="stat-col-hidden">
                                <span className="stat-label-muted">Aankomend</span>
                                <span className="text-sm leading-none font-bold text-text-main">{stats.upcoming}</span>
                            </div>
                            <div className="v-divider-sm" />
                            <div className="stat-col-hidden">
                                <span className="stat-label-muted">Totale activiteiten</span>
                                <span className="text-sm leading-none font-bold text-text-main">{stats.total}</span>
                            </div>
                            <div className="v-divider-sm" />
                            <div className="stat-col-hidden">
                                <span className="stat-label-muted">Aanmeldingen</span>
                                <span className="text-sm leading-none font-bold text-text-main">{stats.signups}</span>
                            </div>
                        </div>

                        <Link
                            href="/beheer/activiteiten/nieuw"
                            className="beheer-button-secondary squircle whitespace-nowrap"
                        >
                            <Plus className="size-4" />
                            Nieuwe Activiteit
                        </Link>
                    </div>
                }
            />

            <div className="admin-container-padded">
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

                <div className="mt-10 grid grid-cols-1 gap-8">
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

            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}