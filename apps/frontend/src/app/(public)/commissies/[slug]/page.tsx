import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import CommitteeDetailDisplay from '@/components/islands/committees/CommitteeDetailDisplay';
import { getCommitteeBySlug } from '@/server/actions/committees.actions';
import BackButton from '@/components/ui/navigation/BackButton';

export const metadata: Metadata = {
    title: 'Commissie Detail | SV Salve Mundi',
    description: 'Ontdek deze commissie en wat zij doen voor de vereniging.',
};

export default async function CommitteePage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;

    const committee = await getCommitteeBySlug(slug);

    if (!committee) {
        notFound();
    }

    const cleanedName = committee.name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || 'Commissie';

    return (
        <PublicPageShell>
            <div className="container mx-auto px-4 max-w-7xl pt-8 pb-4">
                <BackButton href="/commissies" title="Terug naar overzicht" />
            </div>
            <main className="mx-auto max-w-app px-4 pb-24 sm:px-6 lg:px-8">
                <CommitteeDetailDisplay committee={committee} />
            </main>
        </PublicPageShell>
    );
}
