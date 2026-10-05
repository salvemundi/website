import type { Metadata } from 'next';
import {
    Shield,
    ExternalLink,
    Phone
} from 'lucide-react';

import { getSafeHavens } from '@/server/actions/public/safe-haven.actions';
import SafeHavenCard from '@/components/ui/social/SafeHavenCard';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

export const metadata: Metadata = {
    title: 'Safe Havens',
    description: 'Een veilig aanspreekpunt waar je terechtkunt met zorgen, vragen of problemen. Wij luisteren zonder te oordelen.' };



export default async function SafeHavensPage() {
    return (
        <PublicPageShell>
            <SafeHavensContent />
        </PublicPageShell>
    );
}

async function SafeHavensContent() {
    const topics = [
        'Agressie & geweld',
        'Seksuele intimidatie',
        'Pesten & uitsluiting',
        'Discriminatie',
        'Grensoverschrijdend gedrag',
        'Persoonlijke situaties',
    ];

    const safeHavens = await getSafeHavens();

    return (
        <div className="mx-auto max-w-app px-fluid-md py-fluid-lg">
            <div className="mx-auto max-w-7xl">
                {/* 2-Column Layout Grid (No dark background cards around sections) */}
                <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
                    
                    {/* MAIN COLUMN (LEFT) */}
                    <div className="space-y-12 lg:col-span-8">
                        
                        {/* Intro Section */}
                        <section className="space-y-6">
                            <div>
                                <h1 className="text-3xl font-black text-theme-purple sm:text-4xl">
                                    Wat zijn Safe Havens?
                                </h1>
                                <p className="mt-3 text-base leading-relaxed text-text-muted sm:text-lg">
                                    Binnen Salve Mundi vinden wij een veilige en respectvolle omgeving essentieel.
                                    Safe Havens zijn zorgvuldig geselecteerde personen die voor jou klaarstaan:
                                    ze luisteren zonder te oordelen, denken met je mee en helpen je een passende vervolgstap te vinden.
                                </p>
                            </div>

                            <div className="grid gap-6 pt-2 sm:grid-cols-2">
                                <div>
                                    <p className="text-base font-bold text-text-main">
                                        Volledige vertrouwelijkheid
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                                        Safe Havens hebben geheimhoudingsplicht. Wat je deelt blijft tussen jullie,
                                        tenzij jij expliciet toestemming geeft om informatie te delen.
                                    </p>
                                </div>

                                <div>
                                    <p className="text-base font-bold text-text-main">
                                        Diverse achtergronden
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                                        We streven naar Safe Havens met verschillende achtergronden,
                                        zodat er sneller iemand is waarbij jij je comfortabel voelt.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <hr className="border-border-color/30" />

                        {/* Safe Havens list */}
                        <section className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-theme-purple sm:text-3xl">
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
                                    <div className="col-span-full squircle border border-dashed border-border-color/60 bg-bg-card p-10 text-center">
                                        <Shield className="mx-auto mb-4 size-8 text-theme-purple opacity-60" />
                                        <p className="text-lg font-bold text-text-main opacity-60">Wordt binnenkort aangevuld</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* SIDE COLUMN (RIGHT) */}
                    <div className="space-y-10 lg:col-span-4">
                        
                        {/* Topics section */}
                        <section className="space-y-4">
                            <div>
                                <h2 className="text-xl font-black text-theme-purple sm:text-2xl">
                                    Onderwerpen
                                </h2>
                                <p className="mt-1 text-sm text-text-muted">
                                    Onder andere bij de volgende thema&apos;s:
                                </p>
                            </div>

                            <ul className="space-y-2">
                                {topics.map((topic, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-3 py-1.5 text-sm font-medium text-text-main"
                                    >
                                        <span>{topic}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <hr className="border-border-color/30" />

                        <section className="space-y-4">
                            <div>
                                <h2 className="text-xl font-black text-theme-purple sm:text-2xl">
                                    Externe hulp
                                </h2>

                                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                                    Hulp buiten onze vereniging nodig? Hier vind je belangrijke contactgegevens.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href="https://www.fontys.nl/fontyshelpt.htm"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="beheer-button form-button justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield className="size-4" />
                                        <span>Fontys Safe Haven</span>
                                    </div>
                                    <ExternalLink className="size-4 opacity-70" />
                                </a>

                                <div className="btn-secondary">
                                    <ObfuscatedEmail
                                        email="bestuur@salvemundi.nl"
                                        showIcon={false}
                                    />
                                </div>

                                <div className="mt-4 squircle border border-red-500/20 bg-red-500/5 p-4">
                                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                                        <Phone className="size-4" />
                                        <p className="text-center text-sm font-bold">Noodgeval? Bel 112</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
