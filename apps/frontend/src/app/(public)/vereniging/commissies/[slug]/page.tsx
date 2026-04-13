import { Suspense } from 'react';
import type { Metadata } from 'next';
import CommitteeDetailDisplay from '@/components/islands/committees/CommitteeDetailDisplay';
import { getCommitteeBySlug } from '@/server/actions/committees.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import PageHeader from '@/components/ui/layout/PageHeader';
import { CommitteeDetail } from '@/components/ui/committees/CommitteeDetail';

interface PageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Dynamische metadata op basis van de commissie.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const committee = await getCommitteeBySlug(slug);
    
    if (!committee) {
        return { title: 'Commissie niet gevonden' };
    }

    const cleanedName = committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
    return {
        title: `${cleanedName} | SV Salve Mundi`,
        description: committee.short_description || `Lees meer over de ${cleanedName} van SV Salve Mundi.`,
    };
}

/**
 * CommitteePage: Zero-Drift Modernization.
 * Migrated to PublicPageShell for consistent header/footer rendering.
 * Uses CommitteeDetail with masked loading state to prevent layout shift during data fetching.
 */
export default async function CommitteePage({ params }: PageProps) {
    const { slug } = await params;
    
    // NUCLEAR SSR: Fetch committee data before flushing the shell
    const committee = await getCommitteeBySlug(slug);

    if (!committee) {
        return (
            <PublicPageShell title="Commissie niet gevonden">
                <main className="mx-auto max-w-app px-4 py-20 text-center">
                    <h1 className="text-2xl font-bold">Deze commissie kon niet worden gevonden.</h1>
                </main>
            </PublicPageShell>
        );
    }

    const cleanedName = committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim().toUpperCase();

    return (
        <PublicPageShell 
            title={cleanedName}
            backgroundImage="/img/backgrounds/commissies-banner.png"
            imageFilter="brightness(0.65)"
        >
            <main className="mx-auto max-w-app px-4 py-12 md:py-20">
                <CommitteeDetailDisplay committee={committee} />
            </main>
        </PublicPageShell>
    );
}
