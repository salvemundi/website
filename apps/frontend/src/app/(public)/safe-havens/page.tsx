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
    Heart,
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
                'bg-[var(--bg-card)] border border-[var(--border-color)] dark:border-white/10',
                'shadow-lg sm:shadow-xl',
                'p-6 sm:p-8',
                'transition-all duration-300 hover:shadow-2xl',
                className,
            ].join(' ')}
        >
            {children}
        </section>
    );
}

import { connection } from 'next/server';
import { Suspense } from 'react';

export default async function SafeHavensPage() {
    return (
        <PublicPageShell>
            <Suspense fallback={<SafeHavensSkeleton />}>
                <SafeHavensContent />
            </Suspense>
        </PublicPageShell>
    );
}

function SafeHavensSkeleton() {
    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16 animate-pulse">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 h-[800px] bg-[var(--bg-card)] rounded-3xl" />
                    <div className="lg:col-span-4 h-[400px] bg-[var(--bg-card)] rounded-3xl" />
                </div>
            </div>
        </div>
    );
}

async function SafeHavensContent() {
    await connection();
    const topics = [
        { Icon: AlertTriangle, text: 'Agressie & geweld', color: 'from-[var(--color-purple-600)] to-[var(--color-purple-800)]' },
        { Icon: Heart, text: 'Seksuele intimidatie', color: 'from-[var(--color-purple-600)] to-[var(--color-purple-800)]' },
        { Icon: UserX, text: 'Pesten & uitsluiting', color: 'from-[var(--color-purple-600)] to-[var(--color-purple-800)]' },
        { Icon: Users, text: 'Discriminatie', color: 'from-[var(--color-purple-600)] to-[var(--color-purple-800)]' },
        { Icon: Shield, text: 'Grensoverschrijdend gedrag', color: 'from-[var(--color-purple-600)] to-[var(--color-purple-800)]' },
        { Icon: MessageSquare, text: 'Persoonlijke situaties', color: 'from-[var(--color-purple-600)] to-[var(--color-purple-800)]' },
    ];

    // NUCLEAR SSR: Fetch all data at the page level for zero-drift hydration
    const safeHavens = await getSafeHavens();

    return (
        <div className="mx-auto max-w-app px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <div className="mx-auto max-w-7xl">
                {/* Industrial Columnar Bento Grid - Solves empty space issues on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* MAIN COLUMN (LEFT) */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Intro Section */}
                        <BentoCard>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-start gap-4 sm:gap-6">
                                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[var(--color-purple-600)] flex items-center justify-center shrink-0 shadow-lg">
                                        <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme">
                                            Wat zijn Safe Havens?
                                        </h2>
                                        <p className="mt-3 text-base sm:text-lg text-theme-muted leading-relaxed">
                                            Binnen Salve Mundi vinden wij een veilige en respectvolle omgeving essentieel.
                                            Safe Havens zijn zorgvuldig geselecteerde personen die voor jou klaarstaan:
                                            ze luisteren zonder te oordelen, denken met je mee, en helpen je een passende vervolgstap te vinden.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] p-5 transition-colors hover:bg-[var(--bg-main)]">
                                        <div className="flex items-start gap-3">
                                            <Lock className="mt-0.5 h-5 w-5 text-[var(--color-purple-500)] shrink-0" />
                                            <div>
                                                <p className="text-base font-bold text-theme">
                                                    Volledige vertrouwelijkheid
                                                </p>
                                                <p className="mt-1.5 text-sm text-theme-muted leading-relaxed">
                                                    Safe Havens hebben geheimhoudingsplicht. Wat je deelt blijft tussen jullie,
                                                    tenzij jij expliciet toestemming geeft om informatie te delen.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] p-5 transition-colors hover:bg-[var(--bg-main)]">
                                        <div className="flex items-start gap-3">
                                            <Users className="mt-0.5 h-5 w-5 text-[var(--color-purple-500)] shrink-0" />
                                            <div>
                                                <p className="text-base font-bold text-theme">
                                                    Diverse achtergronden
                                                </p>
                                                <p className="mt-1.5 text-sm text-theme-muted leading-relaxed">
                                                    We streven naar Safe Havens met verschillende achtergronden,
                                                    zodat er sneller iemand is waarbij jij je comfortabel voelt.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>

                        {/* Safe Havens list */}
                        <BentoCard>
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-theme">
                                        Onze Safe Havens
                                    </h2>
                                    <p className="mt-2 text-sm sm:text-base text-theme-muted">
                                        Kies een persoon waarbij jij je het meest comfortabel voelt.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {safeHavens.length > 0 ? (
                                        safeHavens.map((safeHaven) => (
                                            <SafeHavenCard key={safeHaven.id} safeHaven={safeHaven} />
                                        ))
                                    ) : (
                                        <div className="col-span-full rounded-2xl bg-[var(--bg-main)]/50 border border-dashed border-[var(--border-color)] p-10 text-center">
                                            <Shield className="h-8 w-8 text-[var(--color-purple-500)] mx-auto mb-4" />
                                            <p className="text-lg font-bold text-theme opacity-60">Wordt binnenkort aangevuld</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </BentoCard>
                    </div>

                    {/* SIDE COLUMN (RIGHT) */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Topics section */}
                        <BentoCard>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-theme">
                                    Onderwerpen
                                </h2>
                                <p className="mt-2 text-sm text-theme-muted">
                                    Onder andere bij de volgende thema's:
                                </p>
                            </div>

                            <ul className="mt-5 space-y-2.5">
                                {topics.map((topic, index) => (
                                    <li
                                        key={index}
                                        className="group flex items-center gap-3 rounded-xl bg-[var(--bg-main)]/40 border border-transparent p-3 hover:bg-[var(--bg-main)] hover:border-[var(--border-color)] transition-all duration-200"
                                    >
                                        <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${topic.color} flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
                                            <topic.Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-theme">
                                            {topic.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </BentoCard>

                        {/* External help section */}
                        <BentoCard>
                            <div className="flex flex-col gap-6">
                                <div className="text-center">
                                    <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-[var(--color-purple-600)] flex items-center justify-center shadow-lg">
                                        <MapPin className="h-7 w-7 text-white" />
                                    </div>

                                    <h2 className="text-xl sm:text-2xl font-bold text-theme">
                                        Externe hulp
                                    </h2>

                                    <p className="mt-3 text-sm text-theme-muted leading-relaxed">
                                        Hulp buiten onze vereniging nodig? Hier vind je belangrijke contactgegevens.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href="https://www.fontys.nl/fontyshelpt.htm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between gap-3 rounded-xl bg-[var(--color-purple-600)] px-5 py-4 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-5 w-5" />
                                            <span className="font-semibold text-sm">
                                                Fontys Safe Haven
                                            </span>
                                        </div>
                                        <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
                                    </a>

                                    <div className="group flex items-center justify-center gap-2 rounded-xl bg-[var(--color-purple-800)] px-5 py-4 text-white shadow-lg transition-all hover:shadow-xl">
                                        <ObfuscatedEmail
                                            email="bestuur@salvemundi.nl"
                                            className="text-white hover:text-white"
                                            showIcon={false}
                                        />
                                    </div>

                                    <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900/50 p-4">
                                        <div className="flex items-center justify-center gap-2 mb-2 text-red-600 dark:text-red-400">
                                            <Phone className="h-4 w-4" />
                                            <p className="font-bold text-sm text-center">Noodgeval? Bel 112</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </BentoCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
