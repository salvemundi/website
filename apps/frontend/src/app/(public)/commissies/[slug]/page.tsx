import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { CommitteeDetail } from '@/components/ui/commissies/CommitteeDetail';
import { getCommitteeBySlug } from '@/server/actions/public/committees.actions';
import BackButton from '@/components/ui/navigation/BackButton';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const committee = await getCommitteeBySlug(slug);

    if (!committee) {
        return {
            title: 'Commissie niet gevonden | Salve Mundi'
        };
    }

    return {
        title: `${committee.name} | Salve Mundi`,
        description: committee.description || 'Ontdek deze commissie en wat zij doen voor de vereniging.'
    };
}

export default async function CommitteePage(props: { params: Promise<{ slug: string }> }) {
    const { slug } = await props.params;

    const committee = await getCommitteeBySlug(slug);

    if (!committee) {
        notFound();
    }

    return (
        <PublicPageShell>
            <div className="container px-fluid-md max-w-7xl pt-fluid-md pb-4">
                <BackButton href="/commissies" title="Terug naar overzicht" />
            </div>
            <main className="mx-auto max-w-app px-fluid-md pb-fluid-lg">
                <CommitteeDetail committee={committee} />
            </main>
        </PublicPageShell>
    );
}
