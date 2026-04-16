import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
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

    return (
        <PublicPageShell>
             <div className="mx-auto max-w-app px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* MAIN COLUMN (LEFT) - Committee Details */}
                        <div className="lg:col-span-8 space-y-6">
                            <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] dark:border-white/10 shadow-lg p-6 sm:p-8">
                                <CommitteeDetailDisplay committee={committee} />
                            </section>
                        </div>

                        {/* SIDE COLUMN (RIGHT) - Quick Actions / Context */}
                        <div className="lg:col-span-4 space-y-6">
                            <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] dark:border-white/10 shadow-lg p-6 sm:p-8">
                                <h3 className="text-xl font-bold text-theme mb-4">Interesse?</h3>
                                <p className="text-theme-muted text-sm leading-relaxed mb-6">
                                    Lijkt het je leuk om onderdeel te worden van deze commissie? 
                                    Stuur ons een berichtje of kom langs op de kamer!
                                </p>
                                <div className="space-y-3">
                                    <a 
                                        href="/contact" 
                                        className="flex items-center justify-center gap-2 w-full bg-[var(--color-purple-600)] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all"
                                    >
                                        Neem contact op
                                    </a>
                                </div>
                            </section>

                            <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-main)] border border-dashed border-[var(--border-color)] p-6 sm:p-8">
                                <p className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2">Plek</p>
                                <p className="text-sm text-theme mb-4">Rachelsmolen R1, Kamer 1.48</p>
                                
                                <p className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-2">Commissies</p>
                                <p className="text-sm text-theme italic">SV Salve Mundi</p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </PublicPageShell>
    );
}
