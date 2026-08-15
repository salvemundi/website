import * as nextServer from 'next/server';
import { ShieldCheck, MessageCircle } from 'lucide-react';

import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import IntroConfidantCard from '@/components/ui/social/IntroConfidantCard';
import IntroGroupsAppButtons from '@/components/ui/social/IntroGroupsAppButtons';
import IntroPlanningLiveIsland from '@/components/islands/intro/IntroPlanningLiveIsland';
import { getImageUrl } from '@/lib/utils/image-utils';
import {
    getIntroPlanningPublic,
    getIntroConfidantsPublic,
    getIntroGroupsAppLinks,
    getIntroPlanningImagePublic
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

    const [planning, confidants, groups, planningImage] = await Promise.all([
        getIntroPlanningPublic(),
        getIntroConfidantsPublic(),
        getIntroGroupsAppLinks(),
        getIntroPlanningImagePublic()
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

                <BentoCard>
                    <div className="flex items-start gap-4 sm:gap-6 mb-6">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 squircle bg-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                            <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-3xl font-black text-theme-purple break-words">Vertrouwenspersonen</h2>
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
                        <div className="h-12 w-12 sm:h-14 sm:w-14 squircle bg-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                            <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-3xl font-black text-theme-purple break-words">Groepsapp</h2>
                            <p className="mt-2 text-sm sm:text-base text-text-muted">
                                Sluit je aan bij de groepsapp om op de hoogte te blijven en contact te leggen met je mede-introducees.
                            </p>
                        </div>
                    </div>

                    <IntroGroupsAppButtons groups={groups} />
                </BentoCard>
            </div>
        </PublicPageShell>
    );
}
