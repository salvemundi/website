'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';

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

    const displayedEvents = pageSize === -1 ? filteredEvents : filteredEvents.slice(0, pageSize);
    const canEdit = !!permissions?.canAccessActivitiesEdit;

    return (
        <div className="flex flex-col">

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
