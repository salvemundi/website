import { connection } from 'next/server';
import Link from 'next/link';
import { CalendarClock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { hasParentSignup, getIntroBlogsPublic } from '@/server/actions/public/intro.actions';
import { IntroStudentIsland } from '@/components/islands/intro/IntroStudentIsland';
import { IntroParentIsland } from '@/components/islands/intro/IntroParentIsland';
import { IntroLightboxIsland } from '@/components/islands/intro/IntroLightboxIsland';
import { IntroBlogsIsland } from '@/components/islands/intro/IntroBlogsIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Introductie | Salve Mundi',
    description: 'Schrijf je in voor de gezelligste introductieweek bij Salve Mundi.'
};

const IntroInfoStudent = () => (
    <div className="space-y-6">
        <h2 className="text-3xl font-black mb-4 text-theme-purple tracking-tight">
            Klaar om je studententijd met een knal te beginnen?
        </h2>
        <p className="text-lg leading-relaxed text-text-muted font-medium">
            Voordat de boeken opengaan en de eerste regels code geschreven worden, is er maar één plek waar je moet zijn: de Salve Mundi Introductie!
        </p>

        <div className="space-y-4">
            <h3 className="font-bold text-sm text-purple-500 dark:text-purple-400">Waarom je dit niet wilt missen</h3>
            <ul className="grid gap-3">
                <li className="flex gap-3 text-text-muted font-medium">
                    <span className="text-purple-500 dark:text-purple-400 font-black">01</span>
                    <span><strong>Legendarische Feesten:</strong> Ontdek het Eindhovense nachtleven met mensen die dezelfde passie delen.</span>
                </li>
                <li className="flex gap-3 text-text-muted font-medium">
                    <span className="text-purple-500 dark:text-purple-400 font-black">02</span>
                    <span><strong>Connecties:</strong> Leer de ouderejaars kennen; zij weten precies hoe je die lastige vakken straks haalt.</span>
                </li>
                <li className="flex gap-3 text-text-muted font-medium">
                    <span className="text-purple-500 dark:text-purple-400 font-black">03</span>
                    <span><strong>Gezelligheid boven alles:</strong> Geen ontgroening, maar een warm welkom bij dè studievereniging van Fontys ICT.</span>
                </li>
            </ul>
        </div>

        <div className="p-6 bg-bg-soft squircle border border-border-color/20 shadow-inner">
            <p className="text-sm font-bold text-text-muted leading-relaxed italic">
                Of je nu een hardcore gamer bent, een toekomstige developer of gewoon houdt van een goed feestje: bij Salve Mundi hoor je erbij.
            </p>
        </div>
    </div>
);

const IntroInfoParent = () => (
    <div className="space-y-6">
        <h2 className="text-3xl font-black mb-4 text-theme-purple tracking-tight">
            Wat zijn Intro Ouders?
            <span className="block text-xl font-semibold text-text-muted mt-2">
                Begeleid de nieuwe lichting
            </span>
        </h2>
        <p className="text-lg leading-relaxed text-text-muted font-medium">
            Als ervaren Salve Mundi-lid kun je tijdens de Introweek het verschil maken. Als Intro Ouder begeleid je eerstejaars,
            help je ze wegwijs te worden in studie en stad, en zorg je dat ze zich welkom voelen.
        </p>

        <div className="space-y-4">
            <h3 className="font-bold text-sm text-purple-500 dark:text-purple-400">Wat doet een Intro Ouder?</h3>
            <ul className="grid gap-3">
                <li className="flex gap-3 text-text-muted font-medium">
                    <span className="text-purple-500 dark:text-purple-400 font-black">★</span>
                    <span><strong>Begeleiden:</strong> Help kleine groepjes nieuwe leden tijdens activiteiten and zorg voor een veilige sfeer.</span>
                </li>
                <li className="flex gap-3 text-text-muted font-medium">
                    <span className="text-purple-500 dark:text-purple-400 font-black">★</span>
                    <span><strong>Mentorschap:</strong> Geef tips over studie, rooster en het vinden van de weg in Eindhoven.</span>
                </li>
                <li className="flex gap-3 text-text-muted font-medium">
                    <span className="text-purple-500 dark:text-purple-400 font-black">★</span>
                    <span><strong>Gezelligheid:</strong> Organiseer leuke momenten binnen je groep – simpele spellen en samen eten doen wonderen.</span>
                </li>
            </ul>
        </div>

        <div className="p-6 bg-bg-soft squircle border border-border-color/20 shadow-inner">
            <p className="text-sm font-bold text-text-muted leading-relaxed italic">
                Heb je vragen? Neem contact op met de introcommissie.
            </p>
        </div>
    </div>
);

export default async function IntroPage() {
    await connection();

    const session = await getEnrichedSession();
    const user = session?.user;
    const isAlreadyParent = user ? await hasParentSignup() : false;
    const blogs = await getIntroBlogsPublic();

    return (
        <PublicPageShell>
            <h1 className="sr-only">Introductie</h1>

            <section className="px-fluid-md py-fluid-lg">
                <div className="max-w-7xl mx-auto w-full mb-8">
                    <Link
                        href="/qr-code"
                        className="group flex items-center justify-between gap-4 squircle-lg bg-purple-600 text-white px-6 py-5 sm:px-8 sm:py-6 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 sm:h-12 sm:w-12 squircle bg-white/15 flex items-center justify-center shrink-0">
                                <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div>
                                <p className="font-black text-base sm:text-lg leading-tight">Bekijk de planning van de introweek</p>
                                <p className="text-xs sm:text-sm text-white/80 font-medium">Live schema, contact en meer</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto w-full items-start lg:items-stretch">
                    <div className="flex-1 space-y-6 flex flex-col">
                        <div className="bg-bg-card dark:border dark:border-white/10 squircle-xl shadow-xl p-fluid-md sm:p-10 flex-1 flex flex-col">
                            {user ? <IntroInfoParent /> : <IntroInfoStudent />}
                        </div>
                        {!user && <IntroLightboxIsland />}
                    </div>

                    <div className="flex-1 w-full flex flex-col">
                        {user ? (
                            isAlreadyParent ? (
                                <div className="bg-bg-card dark:bg-gradient-theme border border-border-color squircle-xl p-10 shadow-xl text-center flex flex-col items-center justify-center min-h-[300px] flex-1">
                                    <div className="w-20 h-20 bg-purple-100 dark:bg-white/20 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-brand-primary dark:text-white" />
                                    </div>
                                    <h3 className="text-3xl font-black text-text-main dark:text-white mb-4 tracking-tight">Aangemeld!</h3>
                                    <p className="text-text-muted dark:text-white/80 font-medium max-w-sm">
                                        Bedankt! Je inschrijving als Intro Ouder is ontvangen. We nemen snel contact met je op.
                                    </p>
                                </div>
                            ) : (
                                <IntroParentIsland
                                    initialPhone={user.phone_number || ''}
                                    className="flex-1"
                                />
                            )
                        ) : (
                            <IntroStudentIsland className="flex-1" />
                        )}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto w-full mt-12">
                    <IntroBlogsIsland blogs={blogs} />
                </div>
            </section>
        </PublicPageShell>
    );
}
