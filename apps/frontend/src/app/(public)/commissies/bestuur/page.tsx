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

                {/* History CTA Section */}
                <div className="mt-24 pt-16 border-t border-[var(--border-color)]/10">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[var(--color-purple-900)] to-[#1a141b] p-8 md:p-12 shadow-2xl group">
                        {/* Decorative Glows */}
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--color-purple-500)]/20 blur-3xl transition-all duration-700 group-hover:scale-110" />
                        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[var(--color-purple-500)]/10 blur-3xl transition-all duration-700 group-hover:scale-110" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-2xl text-center md:text-left">
                                <h3 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                                    Een rijke <span className="text-[var(--color-purple-400)]">geschiedenis</span>
                                </h3>
                                <p className="text-white/70 text-lg font-medium leading-relaxed">
                                    Salve Mundi is gebouwd op de inzet van vele voorgaande besturen. 
                                    Benieuwd wie er in voorgaande jaren aan het roer stonden? Ontdek het in onze eregalerij.
                                </p>
                            </div>
                            
                            <a 
                                href="/commissies/oud-besturen"
                                className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-lg font-black text-black shadow-xl transition-all hover:scale-105 active:scale-95 group/btn"
                            >
                                Bekijk archief
                                <svg className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </PublicPageShell>
    );
}
