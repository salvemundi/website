import * as nextServer from 'next/server';
import Link from 'next/link';
import { ShieldCheck, MessageCircle, BookOpen, Newspaper, ArrowRight } from 'lucide-react';

import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import IntroConfidantCard from '@/components/ui/social/IntroConfidantCard';
import IntroGroupsAppButtons from '@/components/ui/social/IntroGroupsAppButtons';
import IntroPlanningLiveIsland from '@/components/islands/intro/IntroPlanningLiveIsland';
import DocumentAsset from '@/components/ui/media/DocumentAsset';
import { getImageUrl } from '@/lib/utils/image-utils';
import {
    getIntroPlanningPublic,
    getIntroConfidantsPublic,
    getIntroGroupsAppLinks,
    getIntroPlanningImagePublic,
    getIntroInfoBookletPublic,
    incrementIntroQrScanCount
} from '@/server/actions/public/intro.actions';

export const metadata = {
    title: 'QR Code | Salve Mundi Introductie',
    description: 'Hier vind je handige informatie tijdens de introductieweek.'
};

function BentoCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <section
            className={[
                'squircle sm:squircle-lg',
                'bg-bg-card border border-border-color dark:border-white/10',
                'shadow-lg sm:shadow-xl',
                'p-6 sm:p-8',
                className
            ].join(' ')}
        >
            {children}
        </section>
    );
}

export default async function QRCodePage() {
    await nextServer.connection();

    const [planning, confidants, groups, planningImage, infoBooklet, scanCount] = await Promise.all([
        getIntroPlanningPublic(),
        getIntroConfidantsPublic(),
        getIntroGroupsAppLinks(),
        getIntroPlanningImagePublic(),
        getIntroInfoBookletPublic(),
        incrementIntroQrScanCount()
    ]);

    const planningImageUrl = planningImage ? getImageUrl(planningImage, { width: 1600, fit: 'inside' }) : null;

    return (
        <PublicPageShell>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-20 space-y-10">
                <header className="text-center max-w-2xl mx-auto">
                    <p className="text-sm font-black uppercase tracking-widest text-purple-500">Salve Mundi Introductie</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-text-main tracking-tight">
                        Welkom bij de introweek!
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-text-muted font-medium">
                        Alles wat je nodig hebt tijdens de introweek: de planning, wie je kan aanspreken als er iets is,
                        en hoe je bij de groepsapp komt.
                    </p>
                </header>

                <IntroPlanningLiveIsland planning={planning} planningImageUrl={planningImageUrl} />

                {infoBooklet && (
                    <BentoCard className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                            <div className="h-12 w-12 sm:h-14 sm:w-14 squircle bg-purple-500/5 dark:bg-purple-400/5 text-purple-700 dark:text-purple-300 border border-purple-500/10 dark:border-purple-400/10 flex items-center justify-center shrink-0 shadow-sm">
                                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 wrap-break-word">Infoboekje</h2>
                                <p className="mt-1 text-sm text-text-muted">Alle praktische info voor de introweek op een rijtje.</p>
                            </div>
                        </div>
                        <DocumentAsset id={infoBooklet} label="Download infoboekje" className="shrink-0" />
                    </BentoCard>
                )}

                <BentoCard className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 squircle bg-purple-500/5 dark:bg-purple-400/5 text-purple-700 dark:text-purple-300 border border-purple-500/10 dark:border-purple-400/10 flex items-center justify-center shrink-0 shadow-sm">
                            <Newspaper className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 wrap-break-word">Nieuws &amp; updates</h2>
                            <p className="mt-1 text-sm text-text-muted">Blijf op de hoogte van het laatste nieuws over de introweek.</p>
                        </div>
                    </div>
                    <Link
                        href="/intro/blogs"
                        className="form-button shrink-0 inline-flex items-center justify-center gap-2 squircle bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                        Bekijk het laatste nieuws
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </BentoCard>

                <BentoCard>
                    <div className="flex items-start gap-4 sm:gap-6 mb-6">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 squircle bg-purple-500/5 dark:bg-purple-400/5 text-purple-700 dark:text-purple-300 border border-purple-500/10 dark:border-purple-400/10 flex items-center justify-center shrink-0 shadow-sm">
                            <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 wrap-break-word">Vertrouwenscontactpersonen</h2>
                            <p className="mt-2 text-sm sm:text-base text-text-muted">
                                Loopt iets niet lekker tijdens de introweek? Deze mensen staan voor je klaar en denken met je mee.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {confidants.length > 0 ? (
                            confidants.map(confidant => (
                                <IntroConfidantCard key={confidant.id} confidant={confidant} />
                            ))
                        ) : (
                            <div className="col-span-full squircle bg-bg-main/50 border border-dashed border-border-color p-10 text-center">
                                <ShieldCheck className="h-8 w-8 text-purple-500 mx-auto mb-4" />
                                <p className="text-lg font-bold text-text-main opacity-60">Wordt binnenkort aangevuld</p>
                            </div>
                        )}
                    </div>
                </BentoCard>

                <BentoCard>
                    <div className="flex items-start gap-4 sm:gap-6 mb-6">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 squircle bg-purple-500/5 dark:bg-purple-400/5 text-purple-700 dark:text-purple-300 border border-purple-500/10 dark:border-purple-400/10 flex items-center justify-center shrink-0 shadow-sm">
                            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-3xl font-black text-purple-700 dark:text-purple-300 wrap-break-word">Groepsapp</h2>
                            <p className="mt-2 text-sm sm:text-base text-text-muted">
                                Sluit je aan bij de groepsapp om op de hoogte te blijven en contact te leggen met je mede-introducees.
                            </p>
                        </div>
                    </div>

                    <IntroGroupsAppButtons groups={groups} />
                </BentoCard>

                <p className="text-center text-xs text-text-muted opacity-50">
                    {scanCount.toLocaleString('nl-NL')} keer bekeken
                </p>
            </div>
        </PublicPageShell>
    );
}
