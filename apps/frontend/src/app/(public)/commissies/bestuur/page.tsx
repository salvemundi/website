import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { getCommitteeBySlug } from '@/server/actions/committees.actions';
import { BoardDetail } from '@/components/ui/committees/BoardDetail';
import BackButton from '@/components/ui/navigation/BackButton';

export const metadata: Metadata = {
    title: 'Bestuur | SV Salve Mundi',
    description: 'Het bestuur van SV Salve Mundi',
};

export default async function BestuurPage() {
    const committee = await getCommitteeBySlug('bestuur');

    if (!committee) {
        notFound();
    }

    const cleanedName = committee.name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || 'Bestuur';

    return (
        <PublicPageShell>
            <div className="container mx-auto px-4 max-w-7xl pt-8 pb-4">
                <BackButton href="/commissies" title="Terug naar overzicht" />
            </div>
            <main className="mx-auto max-w-app px-4 pb-24 sm:px-6 lg:px-8">
                <BoardDetail committee={committee} />
            </main>
        </PublicPageShell>
    );
}
