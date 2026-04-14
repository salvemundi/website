import { Suspense } from 'react';
import type { Metadata } from 'next';
import {
    Shield,
    Lock,
    AlertTriangle,
    UserX,
    Users,
    MessageSquare,
    MapPin,
    ExternalLink,
    Phone
} from 'lucide-react';

import { getSafeHavens } from '@/server/actions/safe-haven.actions';
import SafeHavenCard from '@/components/ui/social/SafeHavenCard';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

export const metadata: Metadata = {
    title: 'Safe Havens',
    description: 'Een veilig aanspreekpunt waar je terechtkunt met zorgen, vragen of problemen. Wij luisteren zonder te oordelen.',
};

function BentoCard({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={[
                'rounded-2xl sm:rounded-3xl',
                'bg-[var(--bg-card)] dark:border dark:border-white/10',
                'shadow-lg',
                'p-5 sm:p-7 md:p-8',
                'transition-all duration-300 hover:shadow-xl',
                className,
            ].join(' ')}
        >
            {children}
        </section>
    );
}

export default async function SafeHavensPage() {
    const topics = [
        { Icon: AlertTriangle, text: 'Agressie & geweld', color: 'from-slate-600 to-slate-700' },
        { Icon: Shield, text: 'Seksuele intimidatie', color: 'from-slate-600 to-slate-700' },
        { Icon: UserX, text: 'Pesten & uitsluiting', color: 'from-slate-600 to-slate-700' },
        { Icon: Users, text: 'Discriminatie', color: 'from-slate-600 to-slate-700' },
        { Icon: MessageSquare, text: 'Persoonlijke situaties', color: 'from-slate-600 to-slate-700' },
    ];

    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const safeHavens = await getSafeHavens();

    return (
        <PublicPageShell
            title="Safe Havens"
            description="Een veilig aanspreekpunt waar je terechtkunt met zorgen, vragen of problemen. Wij luisteren zonder te oordelen."
        >
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
                        {/* Intro section */}
                        <BentoCard className="lg:col-span-8 lg:row-span-2">
                             <div className="flex flex-col gap-6">
                                <div className="flex items-start gap-4 sm:gap-6">
                                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-slate-600 dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-lg">
                                        <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme">Wat zijn Safe Havens?</h2>
                                        <p className="mt-3 text-base sm:text-lg text-theme-muted leading-relaxed">
                                            Binnen Salve Mundi vinden wij een veilige omgeving essentieel. Safe Havens zijn zorgvuldig geselecteerde personen die voor jou klaarstaan om te luisteren zonder te oordelen.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/30 p-5">
                                        <Lock className="h-5 w-5 text-slate-500 mb-2" />
                                        <p className="text-sm font-bold text-theme">Volledige vertrouwelijkheid</p>
                                        <p className="mt-2 text-xs text-theme-muted leading-relaxed">
                                            Alles wat je deelt blijft vertrouwelijk tussen jou en de contactpersoon. Niets wordt gedeeld zonder jouw expliciete toestemming.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/30 p-5">
                                        <Users className="h-5 w-5 text-slate-500 mb-2" />
                                        <p className="text-sm font-bold text-theme">Diverse achtergronden</p>
                                        <p className="mt-2 text-xs text-theme-muted leading-relaxed">
                                            Onze Safe Havens hebben verschillende achtergronden en zijn er voor iedereen, ongeacht de aard van je vraag.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>

                        {/* Topics */}
                        <BentoCard className="lg:col-span-4 lg:row-span-2">
                            <h2 className="text-xl font-bold text-theme mb-5">Waar kun je terecht?</h2>
                            <ul className="space-y-2.5">
                                {topics.map((topic, index) => (
                                    <li key={index} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/20 p-3 border border-transparent hover:border-slate-200 transition-all">
                                        <div className="h-8 w-8 rounded-lg bg-slate-600 flex items-center justify-center text-white text-xs">
                                            <topic.Icon className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-theme">{topic.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </BentoCard>

                        {/* Safe Havens list (Consolidated) */}
                        <BentoCard className="lg:col-span-8 lg:row-span-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-theme">Onze Safe Havens</h2>
                            <p className="mt-2 text-sm text-theme-muted mb-6">Kies een persoon waarbij jij je comfortabel voelt.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-5 mt-6">
                                {safeHavens.length > 0 ? (
                                    safeHavens.map((safeHaven) => (
                                        <SafeHavenCard key={safeHaven.id} safeHaven={safeHaven} />
                                    ))
                                ) : (
                                    <div className="col-span-full rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 p-10 text-center">
                                        <Shield className="h-8 w-8 text-[var(--color-purple-500)] mx-auto mb-4" />
                                        <p className="text-lg font-bold text-theme">Binnenkort beschikbaar</p>
                                    </div>
                                )}
                            </div>
                        </BentoCard>

                        {/* External help */}
                        <BentoCard className="lg:col-span-4 lg:row-span-4">
                            <div className="text-center mb-8">
                                <MapPin className="h-10 w-10 text-[var(--color-purple-500)] mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-theme">Externe hulp</h2>
                                <p className="mt-2 text-xs text-theme-muted px-4">
                                    Zoek je professionele hulp buiten de vereniging? Hier vind je belangrijke contactgegevens voor externe ondersteuning.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <a href="https://www.fontys.nl/fontyshelpt.htm" target="_blank" className="flex items-center justify-between p-4 bg-slate-600 text-white rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
                                    <span className="font-bold text-sm">Fontys Safe Haven</span>
                                    <ExternalLink className="h-4 w-4 opacity-50" />
                                </a>
                                <ObfuscatedEmail email="bestuur@salvemundi.nl" className="flex justify-center p-4 bg-slate-700 text-white rounded-xl shadow-lg" />
                                
                                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 text-center">
                                    <Phone className="h-5 w-5 text-red-600 mx-auto mb-2" />
                                    <p className="font-bold text-red-900 dark:text-red-200 text-sm">Noodgeval? Bel 112</p>
                                </div>
                            </div>
                        </BentoCard>

                    </div>
        </PublicPageShell>
    );
}
