import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import PageHeader from '@/components/ui/layout/PageHeader';
import CommitteeDetailDisplay from '@/components/islands/committees/CommitteeDetailDisplay';
import { getCommitteeBySlug } from '@/server/actions/committees.actions';

export const metadata: Metadata = {
    title: 'Commissie Detail | SV Salve Mundi',
    description: 'Ontdek deze commissie en wat zij doen voor de vereniging.',
};

export default async function CommitteePage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;

    const committee = await getCommitteeBySlug(slug);

    if (!committee) {
        return (
            <PublicPageShell>
                <div className="mx-auto max-w-app px-4 py-16 text-center">
                    <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-12 shadow-xl border-t-8 border-red-500">
                        <h1 className="text-4xl font-black text-theme mb-4">404</h1>
                        <p className="text-xl text-theme-muted mb-8 italic uppercase tracking-widest font-bold">Commissie niet gevonden</p>
                        <p className="text-theme-muted max-w-md mx-auto leading-relaxed">
                            De opgevraagde commissie bestaat niet of is momenteel niet actief op onze website.
                        </p>
                        <a href="/commissies" className="mt-6 inline-block text-[var(--color-purple-600)] font-semibold hover:underline">
                            Terug naar overzicht
                        </a>
                    </div>
                </div>
            </PublicPageShell>
        );
    }

    const cleanedName = committee.name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || 'Commissie';

    return (
        <PublicPageShell>
            <PageHeader
                title={cleanedName.toUpperCase()}
                // Removed missing banner image to fix 404
                contentPadding="py-10 md:py-16"
                backLink="/commissies"
            />
            
            <main className="mx-auto max-w-app px-4 pb-24 sm:px-6 lg:px-8">
                <CommitteeDetailDisplay committee={committee} />
            </main>
        </PublicPageShell>
    );
}
