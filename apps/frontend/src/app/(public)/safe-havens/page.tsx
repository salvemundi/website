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

import { getSafeHavens } from '@/server/actions/public/safe-haven.actions';
import SafeHavenCard from '@/components/ui/social/SafeHavenCard';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

export const metadata: Metadata = {
    title: 'Safe Havens',
    description: 'Een veilig aanspreekpunt waar je terechtkunt met zorgen, vragen of problemen. Wij luisteren zonder te oordelen.' };

function BentoCard({
    children,
    className = '' }: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section
            className={[
                'squircle sm:squircle-lg',
                'bg-bg-card border border-border-color dark:border-white/10',
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

export default async function SafeHavensPage() {
    return (
        <PublicPageShell>
            <SafeHavensContent />
        </PublicPageShell>
    );
}

async function SafeHavensContent() {
    await connection();
    const topics = [
        { Icon: AlertTriangle, text: 'Agressie & geweld', color: 'from-purple-600 to-purple-800' },
        { Icon: Heart, text: 'Seksuele intimidatie', color: 'from-purple-600 to-purple-800' },
        { Icon: UserX, text: 'Pesten & uitsluiting', color: 'from-purple-600 to-purple-800' },
        { Icon: Users, text: 'Discriminatie', color: 'from-purple-600 to-purple-800' },
        { Icon: Shield, text: 'Grensoverschrijdend gedrag', color: 'from-purple-600 to-purple-800' },
        { Icon: MessageSquare, text: 'Persoonlijke situaties', color: 'from-purple-600 to-purple-800' },
    ];

    // NUCLEAR SSR: Fetch all data at the page level for zero-drift hydration
    const safeHavens = await getSafeHavens();

    return (
        <div className="max-w-app mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <div className="mx-auto max-w-7xl">
                {/* Industrial Columnar Bento Grid - Solves empty space issues on desktop */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    
                    {/* MAIN COLUMN (LEFT) */}
                    <div className="space-y-6 lg:col-span-8">
                        
                        {/* Intro Section */}
                        <BentoCard>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-start gap-4 sm:gap-6">
                                    <div className="squircle flex size-14 shrink-0 items-center justify-center bg-purple-600 shadow-lg sm:size-16">
                                        <Shield className="size-7 text-white sm:size-8" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-2xl font-black text-theme-purple sm:text-3xl lg:text-4xl">
                                            Wat zijn Safe Havens?
                                        </h2>
                                        <p className="mt-3 text-base leading-relaxed text-text-muted sm:text-lg">
                                            Binnen Salve Mundi vinden wij een veilige en respectvolle omgeving essentieel.
                                            Safe Havens zijn zorgvuldig geselecteerde personen die voor jou klaarstaan:
                                            ze luisteren zonder te oordelen, denken met je mee en helpen je een passende vervolgstap te vinden.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="squircle bg-bg-main/50 hover:bg-bg-main border border-border-color p-5 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <Lock className="mt-0.5 size-5 shrink-0 text-purple-500" />
                                            <div>
                                                <p className="text-base font-bold text-text-main">
                                                    Volledige vertrouwelijkheid
                                                </p>
                                                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
                                                    Safe Havens hebben geheimhoudingsplicht. Wat je deelt blijft tussen jullie,
                                                    tenzij jij expliciet toestemming geeft om informatie te delen.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="squircle bg-bg-main/50 hover:bg-bg-main border border-border-color p-5 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <Users className="mt-0.5 size-5 shrink-0 text-purple-500" />
                                            <div>
                                                <p className="text-base font-bold text-text-main">
                                                    Diverse achtergronden
                                                </p>
                                                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
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
                                    <h2 className="text-2xl font-black text-theme-purple sm:text-3xl lg:text-4xl">
                                        Onze Safe Havens
                                    </h2>
                                    <p className="mt-2 text-sm text-text-muted sm:text-base">
                                        Kies een persoon waarbij jij je het meest comfortabel voelt.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {safeHavens.length > 0 ? (
                                        safeHavens.map((safeHaven) => (
                                            <SafeHavenCard key={safeHaven.id} safeHaven={safeHaven} />
                                        ))
                                    ) : (
                                        <div className="squircle bg-bg-main/50 col-span-full border border-dashed border-border-color p-10 text-center">
                                            <Shield className="mx-auto mb-4 size-8 text-purple-500" />
                                            <p className="text-lg font-bold text-text-main opacity-60">Wordt binnenkort aangevuld</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </BentoCard>
                    </div>

                    {/* SIDE COLUMN (RIGHT) */}
                    <div className="space-y-6 lg:col-span-4">
                        
                        {/* Topics section */}
                        <BentoCard>
                            <div>
                                <h2 className="text-xl font-black text-theme-purple sm:text-2xl">
                                    Onderwerpen
                                </h2>
                                <p className="mt-2 text-sm text-text-muted">
                                    Onder andere bij de volgende thema&apos;s:
                                </p>
                            </div>

                            <ul className="mt-5 space-y-2.5">
                                {topics.map((topic, index) => (
                                    <li
                                        key={index}
                                        className="group bg-bg-main/40 hover:bg-bg-main flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-border-color"
                                    >
                                        <div className={`size-9 rounded-lg bg-linear-to-br ${topic.color} flex shrink-0 items-center justify-center shadow-sm transition-shadow group-hover:shadow-md`}>
                                            <topic.Icon className="size-4 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-text-main">
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
                                    <div className="squircle mx-auto mb-5 flex size-14 items-center justify-center bg-purple-600 shadow-lg">
                                        <MapPin className="size-7 text-white" />
                                    </div>

                                    <h2 className="text-xl font-black text-theme-purple sm:text-2xl">
                                        Externe hulp
                                    </h2>

                                    <p className="mt-3 text-sm leading-relaxed text-text-muted">
                                        Hulp buiten onze vereniging nodig? Hier vind je belangrijke contactgegevens.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href="https://www.fontys.nl/fontyshelpt.htm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group squircle hover:scale-1.02 flex items-center justify-between gap-3 bg-purple-600 px-5 py-4 text-white shadow-lg transition-all hover:shadow-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Shield className="size-5" />
                                            <span className="text-sm font-semibold">
                                                Fontys Safe Haven
                                            </span>
                                        </div>
                                        <ExternalLink className="size-4 opacity-70 group-hover:opacity-100" />
                                    </a>

                                    <div className="group squircle flex items-center justify-center gap-2 bg-purple-800 px-5 py-4 text-white shadow-lg transition-all hover:shadow-xl">
                                        <ObfuscatedEmail
                                            email="bestuur@salvemundi.nl"
                                            className="text-white hover:text-white"
                                            showIcon={false}
                                        />
                                    </div>

                                    <div className="squircle mt-4 border-2 border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                                        <div className="mb-2 flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                                            <Phone className="size-4" />
                                            <p className="text-center text-sm font-bold">Noodgeval? Bel 112</p>
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
