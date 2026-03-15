import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import CommitteesList from '@/components/islands/committees/CommitteesList';
import { CommitteeGridSkeleton } from '@/components/ui/committees/CommitteeGridSkeleton';

export const metadata: Metadata = {
    title: 'De Vereniging | SV Salve Mundi',
    description: 'Ontdek onze commissies en het team dat SV Salve Mundi draaiende houdt.',
};

export default function VerenigingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            {/* 
                Hoisted Static Header:
                Wordt direct gerenderd voor minimale LCP.
            */}
            <PageHeader
                title="COMMISSIES"
                backgroundImage="/img/backgrounds/commissies-banner.png"
                backgroundPosition="center 30%"
                imageFilter="brightness(0.65)"
                description="Ontdek onze commissies en word deel van het team"
            />

            <main className="mx-auto max-w-app px-4 py-8 sm:py-12 lg:py-16">
                {/* 
                    Granular Streaming Grid:
                    De lijst wordt asynchroon ingeladen terwijl de skeleton 
                    exact dezelfde afmetingen behoudt (Zero CLS).
                */}
                <Suspense fallback={<CommitteeGridSkeleton />}>
                    <CommitteesList />
                </Suspense>
            </main>
        </div>
    );
}
