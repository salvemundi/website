import React, { Suspense } from 'react';
import { hasParentSignup } from '@/server/actions/intro.actions';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { IntroStudentIsland } from '@/components/islands/intro/IntroStudentIsland';
import { IntroParentIsland } from '@/components/islands/intro/IntroParentIsland';
import { IntroLightboxIsland } from '@/components/islands/intro/IntroLightboxIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Introductie | Salve Mundi',
    description: 'Schrijf je in voor de gezelligste introductieweek bij Salve Mundi.',
};

const IntroInfoStudent = () => (
    <div className="animate-in fade-in duration-700">
        <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-theme dark:text-white">
            Klaar om je studententijd met een knal te beginnen?
        </h2>
        <p className="text-base lg:text-lg leading-relaxed mb-4 text-theme dark:text-white">
            Voordat de boeken opengaan en de eerste regels code geschreven worden, is er maar één plek waar je moet zijn: de Salve Mundi Introductie!
        </p>

        <h3 className="font-semibold mb-2 text-theme dark:text-white">Waarom je dit niet wilt missen</h3>
        <ul className="list-disc list-inside mb-4 text-base lg:text-lg text-theme dark:text-white">
            <li className="mb-1"><strong>Legendarische Feesten:</strong> Ontdek het Eindhovense nachtleven met mensen die dezelfde passie delen.</li>
            <li className="mb-1"><strong>Connecties:</strong> Leer de ouderejaars kennen; zij weten precies hoe je die lastige vakken straks haalt.</li>
            <li className="mb-1"><strong>Gezelligheid boven alles:</strong> Geen ontgroening, maar een warm welkom bij dè studievereniging van Fontys ICT.</li>
        </ul>

        <h3 className="font-semibold text-theme dark:text-white">Schrijf je nu in!</h3>
        <p className="text-base lg:text-lg leading-relaxed mb-2 text-theme dark:text-white">
            Ben jij erbij? Vul het onderstaande formulier in om je plek te reserveren voor de gezelligste week van het jaar.
            Of je nu een hardcore gamer bent, een toekomstige developer of gewoon houdt van een goed feestje: bij Salve Mundi hoor je erbij.
        </p>
        <p className="text-sm text-theme-muted">Let op: De plaatsen zijn beperkt, dus wacht niet te lang met aanmelden!</p>
    </div>
);

const IntroInfoParent = () => (
    <div className="animate-in fade-in duration-700">
        <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-theme dark:text-white">
            Word Intro Ouder — begeleid de nieuwe lichting
        </h2>
        <p className="text-base lg:text-lg leading-relaxed mb-4 text-theme dark:text-white">
            Als ervaren Salve Mundi-lid kun je tijdens de Introweek het verschil maken. Als Intro Ouder begeleid je eerstejaars,
            help je ze wegwijs te worden in studie en stad, en zorg je dat ze zich welkom voelen. Het is gezellig, laagdrempelig en
            een mooie kans om jouw ervaring door te geven.
        </p>

        <h3 className="font-semibold mb-2 text-theme dark:text-white">Wat doet een Intro Ouder?</h3>
        <ul className="list-disc list-inside mb-4 text-base lg:text-lg text-theme dark:text-white">
            <li className="mb-1"><strong>Begeleiden:</strong> Help kleine groepjes nieuwe leden tijdens activiteiten en zorg voor een veilige sfeer.</li>
            <li className="mb-1"><strong>Mentorschap:</strong> Geef tips over studie, rooster en het vinden van de weg in Eindhoven.</li>
            <li className="mb-1"><strong>Gezelligheid:</strong> Organiseer leuke momenten binnen je groep — simpele spellen, gesprekken en samen eten doen wonderen.</li>
        </ul>

        <h3 className="font-semibold text-theme dark:text-white">Waarom meedoen?</h3>
        <ul className="list-disc list-inside mb-4 text-base lg:text-lg text-theme dark:text-white">
            <li className="mb-1"><strong>Impact:</strong> Je helpt nieuwe leden zich echt thuis te voelen.</li>
            <li className="mb-1"><strong>Netwerk:</strong> Leer commissieleden en andere actieve leden kennen.</li>
            <li className="mb-1"><strong>Fun:</strong> Gratis pizza, goede verhalen en herinneringen die je niet snel vergeet.</li>
        </ul>

        <p className="text-base lg:text-lg leading-relaxed mb-2 text-theme dark:text-white">
            Wil je meedoen? Vul dan het formulier aan de rechterkant in en vertel kort waarom jij de perfecte Intro Ouder bent.
        </p>
        <p className="text-sm text-theme-muted">Heb je vragen? Neem contact op met de introcommissie.</p>
    </div>
);

export default async function IntroPage() {
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const session = await auth.api.getSession({ headers: await headers() });
    const isAlreadyParent = session ? await hasParentSignup() : false;
    const isAuthenticated = !!session;

    return (
        <PublicPageShell
            title="INTRO - AANMELDEN"
            backgroundImage="/img/backgrounds/intro-banner.jpg"
            imageFilter="brightness(0.65)"
        >
            <section className="px-4 sm:px-6 lg:px-10 py-8 lg:py-10">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto w-full">
                    <div className="flex-1">
                        {isAuthenticated ? <IntroInfoParent /> : <IntroInfoStudent />}
                        {!isAuthenticated && <IntroLightboxIsland />}
                    </div>

                    <div className="flex-1 w-full flex flex-col justify-start">
                        {isAuthenticated ? (
                            isAlreadyParent ? (
                                <div className="bg-gradient-theme rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-lg text-center animate-in zoom-in duration-500">
                                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">Je hebt je al aangemeld als Intro Ouder</h3>
                                    <p className="text-white/70">
                                        Bedankt! Je inschrijving is ontvangen. Als je iets wilt aanpassen, neem contact op met de intro commissie.
                                    </p>
                                </div>
                            ) : (
                                <IntroParentIsland
                                    userName={session.user.name}
                                    userEmail={session.user.email}
                                    initialPhone={''}
                                />
                            )
                        ) : (
                            <IntroStudentIsland />
                        )}
                    </div>
                </div>
            </section>
        </PublicPageShell>
    );
}
