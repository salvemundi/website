import { Suspense } from 'react';
import type { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import CommitteeDetailDisplay from '@/components/islands/CommitteeDetailDisplay';
import { CommitteeDetailSkeleton } from '@/components/ui/CommitteeDetailSkeleton';
import { getCommitteeBySlug } from '@/server/actions/committees.actions';

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

export default async function CommitteePage({ params }: PageProps) {
    const { slug } = await params;
    
    // We renderen de header statisch met de slug als titel (fallback) 
    // terwijl de data streamt.
    const displayTitle = slug.replace(/-/g, ' ').toUpperCase();

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader
                title={displayTitle}
                backgroundImage="/img/backgrounds/commissies-banner.png"
                imageFilter="brightness(0.65)"
            />

            <main className="mx-auto max-w-app px-4 py-12 md:py-20">
                <Suspense fallback={<CommitteeDetailSkeleton />}>
                    <CommitteeDetailDisplay slug={slug} />
                </Suspense>
            </main>
        </div>
    );
}
