import * as nextServer from 'next/server';
import { ShieldCheck, MessageCircle, BookOpen } from 'lucide-react';

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
            <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
                <header className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-black tracking-widest text-purple-500 uppercase">Salve Mundi Introductie</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-text-main sm:text-4xl lg:text-5xl">
                        Welkom bij de introweek!
                    </h1>
                    <p className="mt-4 text-base font-medium text-text-muted sm:text-lg">
                        Alles wat je nodig hebt tijdens de introweek: de planning, wie je kan aanspreken als er iets is,
                        en hoe je bij de groepsapp komt.
                    </p>
                </header>

                <IntroPlanningLiveIsland planning={planning} planningImageUrl={planningImageUrl} />

                {infoBooklet && (
                    <BentoCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
                            <div className="squircle flex size-12 shrink-0 items-center justify-center border border-purple-500/10 bg-purple-500/5 text-purple-700 shadow-sm sm:size-14 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                                <BookOpen className="size-6 text-purple-500 sm:size-7 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl font-black wrap-break-word text-purple-700 sm:text-2xl dark:text-purple-300">Infoboekje</h2>
                                <p className="mt-1 text-sm text-text-muted">Alle praktische info voor de introweek op een rijtje.</p>
                            </div>
                        </div>
                        <DocumentAsset id={infoBooklet} label="Download infoboekje" className="shrink-0" />
                    </BentoCard>
                )}

                <BentoCard>
                    <div className="mb-6 flex items-start gap-4 sm:gap-6">
                        <div className="squircle flex size-12 shrink-0 items-center justify-center border border-purple-500/10 bg-purple-500/5 text-purple-700 shadow-sm sm:size-14 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                            <MessageCircle className="size-6 text-purple-500 sm:size-7 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black wrap-break-word text-purple-700 sm:text-3xl dark:text-purple-300">Groepsapp</h2>
                            <p className="mt-2 text-sm text-text-muted sm:text-base">
                                Sluit je aan bij de groepsapp om op de hoogte te blijven en contact te leggen met je mede-introducees.
                            </p>
                        </div>
                    </div>

                    <IntroGroupsAppButtons groups={groups} />
                </BentoCard>

                <BentoCard>
                    <div className="mb-6 flex items-start gap-4 sm:gap-6">
                        <div className="squircle flex size-12 shrink-0 items-center justify-center border border-purple-500/10 bg-purple-500/5 text-purple-700 shadow-sm sm:size-14 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                            <ShieldCheck className="size-6 text-purple-500 sm:size-7 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black wrap-break-word text-purple-700 sm:text-3xl dark:text-purple-300">Vertrouwenscontactpersonen</h2>
                            <p className="mt-2 text-sm text-text-muted sm:text-base">
                                Loopt iets niet lekker tijdens de introweek? Deze mensen staan voor je klaar en denken met je mee.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                        {confidants.length > 0 ? (
                            confidants.map(confidant => (
                                <IntroConfidantCard key={confidant.id} confidant={confidant} />
                            ))
                        ) : (
                            <div className="squircle bg-bg-main/50 col-span-full border border-dashed border-border-color p-10 text-center">
                                <ShieldCheck className="mx-auto mb-4 size-8 text-purple-500" />
                                <p className="text-lg font-bold text-text-main opacity-60">Wordt binnenkort aangevuld</p>
                            </div>
                        )}
                    </div>
                </BentoCard>

                <p className="text-center text-xs text-text-muted opacity-50">
                    {scanCount.toLocaleString('nl-NL')} keer bekeken
                </p>
            </div>
        </PublicPageShell>
    );
}
