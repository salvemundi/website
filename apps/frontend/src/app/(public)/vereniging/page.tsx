import type { Metadata } from 'next';
import { Suspense } from 'react';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import CommitteesList from '@/components/islands/committees/CommitteesList';

export const metadata: Metadata = {
    title: 'De Vereniging | SV Salve Mundi',
    description: 'Ontdek onze commissies en het team dat SV Salve Mundi draaiende houdt.',
};

/**
 * VerenigingPage: Ultra-PPR Modernization.
 * Wrapped in PublicPageShell for instant header rendering.
 * Uses Zero-Drift masking for the committee grid.
 */
export default function VerenigingPage() {
    return (
        <PublicPageShell
            title="COMMISSIES"
            backgroundImage="/img/backgrounds/commissies-banner.png"
            backgroundPosition="center 30%"
            imageFilter="brightness(0.65)"
            description="Ontdek onze commissies en word deel van het team"
        >
            <main className="mx-auto max-w-app px-4 py-8 sm:py-12 lg:py-16">
                {/* 
                    Granular Streaming Grid:
                    Masked loading ensures Zero Cumulative Layout Shift (CLS).
                */}
                <Suspense fallback={<CommitteesList isLoading />}>
                    <CommitteesList />
                </Suspense>
            </main>
        </PublicPageShell>
    );
}
