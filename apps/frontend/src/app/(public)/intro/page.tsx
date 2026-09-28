import { connection } from 'next/server';
import Link from 'next/link';
import { CalendarClock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { hasParentSignup, getIntroSignupStatusPublic } from '@/server/actions/public/intro.actions';
import { IntroStudentIsland } from '@/components/islands/intro/IntroStudentIsland';
import { IntroParentIsland } from '@/components/islands/intro/IntroParentIsland';
import { IntroLightboxIsland } from '@/components/islands/intro/IntroLightboxIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Introductie | Salve Mundi',
    description: 'Schrijf je in voor de gezelligste introductieweek bij Salve Mundi.'
};

const IntroInfoStudent = () => (
    <div className="space-y-6">
        <h2 className="mb-4 text-3xl font-black tracking-tight text-theme-purple">
            Klaar om je studententijd met een knal te beginnen?
        </h2>
        <p className="text-lg leading-relaxed font-medium text-text-muted">
            Voordat de boeken opengaan en de eerste regels code geschreven worden, is er maar één plek waar je moet zijn: de Salve Mundi Introductie!
        </p>

        <div className="space-y-4">
            <h3 className="text-sm font-bold text-purple-500 dark:text-purple-400">Waarom je dit niet wilt missen</h3>
            <ul className="grid gap-3">
                <li className="flex gap-3 font-medium text-text-muted">
                    <span className="font-black text-purple-500 dark:text-purple-400">01</span>
                    <span><strong>Legendarische Feesten:</strong> Ontdek het Eindhovense nachtleven met mensen die dezelfde passie delen.</span>
                </li>
                <li className="flex gap-3 font-medium text-text-muted">
                    <span className="font-black text-purple-500 dark:text-purple-400">02</span>
                    <span><strong>Connecties:</strong> Leer de ouderejaars kennen; zij weten precies hoe je die lastige vakken straks haalt.</span>
                </li>
                <li className="flex gap-3 font-medium text-text-muted">
                    <span className="font-black text-purple-500 dark:text-purple-400">03</span>
                    <span><strong>Gezelligheid boven alles:</strong> Geen ontgroening, maar een warm welkom bij dè studievereniging van Fontys ICT.</span>
                </li>
            </ul>
        </div>

        <div className="squircle border border-border-color/20 bg-bg-soft p-6 shadow-inner">
            <p className="text-sm leading-relaxed font-bold text-text-muted italic">
                Of je nu een hardcore gamer bent, een toekomstige developer of gewoon houdt van een goed feestje: bij Salve Mundi hoor je erbij.
            </p>
        </div>
    </div>
);

const IntroInfoParent = () => (
    <div className="space-y-6">
        <h2 className="mb-4 text-3xl font-black tracking-tight text-theme-purple">
            Wat zijn Intro Ouders?
            <span className="mt-2 block text-xl font-semibold text-text-muted">
                Begeleid de nieuwe lichting
            </span>
        </h2>
        <p className="text-lg leading-relaxed font-medium text-text-muted">
            Als ervaren Salve Mundi-lid kun je tijdens de Introweek het verschil maken. Als Intro Ouder begeleid je eerstejaars,
            help je ze wegwijs te worden in studie en stad, en zorg je dat ze zich welkom voelen.
        </p>

        <div className="space-y-4">
            <h3 className="text-sm font-bold text-purple-500 dark:text-purple-400">Wat doet een Intro Ouder?</h3>
            <ul className="grid gap-3">
                <li className="flex gap-3 font-medium text-text-muted">
                    <span className="font-black text-purple-500 dark:text-purple-400">★</span>
                    <span><strong>Begeleiden:</strong> Help kleine groepjes nieuwe leden tijdens activiteiten and zorg voor een veilige sfeer.</span>
                </li>
                <li className="flex gap-3 font-medium text-text-muted">
                    <span className="font-black text-purple-500 dark:text-purple-400">★</span>
                    <span><strong>Mentorschap:</strong> Geef tips over studie, rooster en het vinden van de weg in Eindhoven.</span>
                </li>
                <li className="flex gap-3 font-medium text-text-muted">
                    <span className="font-black text-purple-500 dark:text-purple-400">★</span>
                    <span><strong>Gezelligheid:</strong> Organiseer leuke momenten binnen je groep – simpele spellen en samen eten doen wonderen.</span>
                </li>
            </ul>
        </div>

        <div className="squircle border border-border-color/20 bg-bg-soft p-6 shadow-inner">
            <p className="text-sm leading-relaxed font-bold text-text-muted italic">
                Heb je vragen? Neem contact op met de introcommissie.
            </p>
        </div>
    </div>
);

export default async function IntroPage() {
    await connection();

    const session = await getEnrichedSession();
    const user = session?.user;
    const [isAlreadyParent, signupStatus] = await Promise.all([
        user ? hasParentSignup() : Promise.resolve(false),
        getIntroSignupStatusPublic()
    ]);

    return (
        <PublicPageShell>
            <h1 className="sr-only">Introductie</h1>

            <section className="px-fluid-md py-fluid-lg">
                <div className="mx-auto mb-8 w-full max-w-7xl">
                    <Link
                        href="/qr-code"
                        className="group squircle-lg hover:scale-1.01 flex items-center justify-between gap-4 bg-purple-600 px-6 py-5 text-white shadow-lg transition-all hover:shadow-xl sm:px-8 sm:py-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="squircle flex size-11 shrink-0 items-center justify-center bg-white/15 sm:size-12">
                                <CalendarClock className="size-5 sm:size-6" />
                            </div>
                            <div>
                                <p className="text-base leading-tight font-black sm:text-lg">Bekijk de planning van de introweek</p>
                                <p className="text-xs font-medium text-white/80 sm:text-sm">Live schema, contact en meer</p>
                            </div>
                        </div>
                        <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 lg:flex-row lg:items-stretch lg:gap-10">
                    <div className="flex flex-1 flex-col space-y-6">
                        <div className="squircle-xl flex flex-1 flex-col bg-bg-card p-fluid-md shadow-xl sm:p-10 dark:border dark:border-white/10">
                            {user ? <IntroInfoParent /> : <IntroInfoStudent />}
                        </div>
                        {!user && <IntroLightboxIsland />}
                    </div>

                    <div className="flex w-full flex-1 flex-col">
                        {user ? (
                            isAlreadyParent ? (
                                <div className="dark:bg-gradient-theme squircle-xl flex min-h-75 flex-1 flex-col items-center justify-center border border-border-color bg-bg-card p-10 text-center shadow-xl">
                                    <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-purple-100 dark:bg-white/20">
                                        <CheckCircle2 className="size-10 text-brand-primary dark:text-white" />
                                    </div>
                                    <h3 className="mb-4 text-3xl font-black tracking-tight text-text-main dark:text-white">Aangemeld!</h3>
                                    <p className="max-w-sm font-medium text-text-muted dark:text-white/80">
                                        Bedankt! Je inschrijving als Intro Ouder is ontvangen. We nemen snel contact met je op.
                                    </p>
                                </div>
                            ) : (
                                <IntroParentIsland
                                    isOpen={signupStatus.parentSignupsOpen}
                                    initialPhone={user.phone_number || ''}
                                    className="flex-1"
                                />
                            )
                        ) : (
                            <IntroStudentIsland
                                isOpen={signupStatus.studentSignupsOpen}
                                className="flex-1"
                            />
                        )}
                    </div>
                </div>
            </section>
        </PublicPageShell>
    );
}
