import type { Metadata } from 'next';
import { Suspense } from 'react';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import CommitteesList from '@/components/islands/committees/CommitteesList';

export const metadata: Metadata = {
    title: 'De Vereniging | SV Salve Mundi',
    description: 'Ontdek onze commissies en het team dat SV Salve Mundi draaiende houdt.',
};

import { getCommittees } from '@/server/actions/committees.actions';

export default async function VerenigingPage() {
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const committees = await getCommittees();

    return (
        <PublicPageShell
            title="COMMISSIES"
            backgroundImage="/img/backgrounds/commissies-banner.png"
            backgroundPosition="center 30%"
            imageFilter="brightness(0.65)"
            description="Ontdek onze commissies en word deel van het team"
        >
            <div className="mx-auto max-w-app px-4 py-8 sm:py-12 lg:py-16">
                <CommitteesList initialCommittees={committees} />
            </div>
        </PublicPageShell>
    );
}
