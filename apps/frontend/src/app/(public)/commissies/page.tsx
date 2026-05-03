import type { Metadata } from 'next';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import CommitteesList from '@/components/islands/committees/CommitteesList';

export const metadata: Metadata = {
    title: 'Commissies | SV Salve Mundi',
    description: 'Ontdek onze commissies en het team dat SV Salve Mundi draaiende houdt.',
};

import { getCommittees } from '@/server/actions/committees.actions';

import { connection } from 'next/server';
import { Suspense } from 'react';

export default async function CommissiesPage() {
    return (
        <PublicPageShell
            title="COMMISSIES"
            backgroundImage="/img/backgrounds/commissies-banner.png"
            backgroundPosition="center 30%"
            imageFilter="brightness(0.65)"
            description="Ontdek onze commissies en word deel van het team"
        >
            <Suspense fallback={<CommitteesSkeleton />}>
                <CommitteesContent />
            </Suspense>
        </PublicPageShell>
    );
}

function CommitteesSkeleton() {
    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:py-12 lg:py-16 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 bg-[var(--bg-card)] rounded-3xl" />
                ))}
            </div>
        </div>
    );
}

async function CommitteesContent() {
    await connection();
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const committees = await getCommittees();

    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:py-12 lg:py-16">
            <CommitteesList initialCommittees={committees} />
        </div>
    );
}
