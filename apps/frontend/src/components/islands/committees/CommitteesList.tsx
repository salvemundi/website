import React from 'react';
import { getCommittees } from '@/server/actions/committees.actions';
import { CommitteeCard } from '@/components/ui/committees/CommitteeCard';

// Helper to clean committee names
function cleanCommitteeName(name: string): string {
    return name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

interface CommitteesListProps {
    initialCommittees?: any[]; // Using any for simplicity as it matches original logic
}

/**
 * CommitteesList: Zero-Drift Modernization.
 */
export default function CommitteesList({ initialCommittees = [] }: CommitteesListProps) {
    const sortedCommittees = [...initialCommittees].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');
        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    if (sortedCommittees.length === 0) {
        return (
            <div className="rounded-3xl bg-[var(--bg-card)]/80 dark:border dark:border-white/10 p-12 text-center shadow-lg">
                <p className="text-lg text-[var(--text-muted)] italic">Geen commissies gevonden.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sortedCommittees.map((committee, idx) => (
                <CommitteeCard key={committee.id} committee={committee} index={idx} />
            ))}
        </div>
    );
}
