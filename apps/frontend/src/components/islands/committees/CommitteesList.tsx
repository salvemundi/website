import React from 'react';
import { getCommittees } from '@/server/actions/committees.actions';
import { CommitteeCard } from '@/components/ui/committees/CommitteeCard';

// Helper to clean committee names (identical to card for consistency)
function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

/**
 * Async Server Component die de commissies ophaalt en rendert.
 */
export default async function CommitteesList() {
    const committeesData = await getCommittees();

    if (!committeesData || committeesData.length === 0) {
        return (
            <div className="rounded-3xl bg-[var(--bg-card)]/80 dark:border dark:border-white/10 p-12 text-center shadow-lg">
                <p className="text-lg text-[var(--text-muted)]">Geen commissies gevonden</p>
            </div>
        );
    }

    // Sorteren: Bestuur altijd eerst
    const sortedCommittees = [...committeesData].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');

        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sortedCommittees.map((committee) => (
                <CommitteeCard key={committee.id} committee={committee} />
            ))}
        </div>
    );
}
