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
        return (
            <PublicPageShell>
                <div className="mx-auto max-w-app px-4 py-16 text-center">
                    <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-12 shadow-xl border-t-8 border-red-500">
                        <h1 className="text-4xl font-black text-theme mb-4">404</h1>
                        <p className="text-xl text-theme-muted mb-8 italic uppercase tracking-widest font-bold">Bestuur niet gevonden</p>
                        <p className="text-theme-muted max-w-md mx-auto leading-relaxed">
                            De opgevraagde pagina bestaat niet of is momenteel niet actief op onze website.
                        </p>
                        <a href="/commissies" className="mt-6 inline-block text-[var(--color-purple-600)] font-semibold hover:underline">
                            Terug naar overzicht
                        </a>
                    </div>
                </div>
            </PublicPageShell>
        );
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
