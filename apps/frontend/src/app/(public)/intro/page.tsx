import { connection } from 'next/server';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { hasParentSignup, getIntroBlogsPublic } from '@/server/actions/public/intro.actions';

import { CheckCircle2 } from 'lucide-react';
import { IntroStudentIsland } from '@/components/islands/intro/IntroStudentIsland';
import { IntroParentIsland } from '@/components/islands/intro/IntroParentIsland';
import { IntroLightboxIsland } from '@/components/islands/intro/IntroLightboxIsland';
import { IntroBlogsIsland } from '@/components/islands/intro/IntroBlogsIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Introductie | Salve Mundi',
    description: 'Schrijf je in voor de gezelligste introductieweek bij Salve Mundi.' };

const IntroInfoStudent = () => (
    <div className="space-y-6">
        <h2 className="text-3xl font-black mb-4 text-[var(--text-main)] tracking-tight">
            Klaar om je studententijd met een knal te beginnen?
        </h2>
        <p className="text-lg leading-relaxed text-[var(--text-muted)] font-medium">
            Voordat de boeken opengaan en de eerste regels code geschreven worden, is er maar één plek waar je moet zijn: de Salve Mundi Introductie!
        </p>

        <div className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--color-purple-500)]">Waarom je dit niet wilt missen</h3>
            <ul className="grid gap-3">
                <li className="flex gap-3 text-[var(--text-muted)] font-medium">
                    <span className="text-[var(--color-purple-500)] font-black">01</span>
                    <span><strong>Legendarische Feesten:</strong> Ontdek het Eindhovense nachtleven met mensen die dezelfde passie delen.</span>
                </li>
                <li className="flex gap-3 text-[var(--text-muted)] font-medium">
                    <span className="text-[var(--color-purple-500)] font-black">02</span>
                    <span><strong>Connecties:</strong> Leer de ouderejaars kennen; zij weten precies hoe je die lastige vakken straks haalt.</span>
                </li>
                <li className="flex gap-3 text-[var(--text-muted)] font-medium">
                    <span className="text-[var(--color-purple-500)] font-black">03</span>
                    <span><strong>Gezelligheid boven alles:</strong> Geen ontgroening, maar een warm welkom bij dè studievereniging van Fontys ICT.</span>
                </li>
            </ul>
        </div>

        <div className="p-6 bg-[var(--bg-soft)] rounded-2xl border border-[var(--border-color)]/20 shadow-inner">
            <p className="text-sm font-bold text-[var(--text-muted)] leading-relaxed italic">
                Of je nu een hardcore gamer bent, een toekomstige developer of gewoon houdt van een goed feestje: bij Salve Mundi hoor je erbij.
            </p>
        </div>
    </div>
);

const IntroInfoParent = () => (
    <div className="space-y-6">
        <h2 className="text-3xl font-black mb-4 text-[var(--text-main)] tracking-tight">
            Word Intro Ouder — begeleid de nieuwe lichting
        </h2>
        <p className="text-lg leading-relaxed text-[var(--text-muted)] font-medium">
            Als ervaren Salve Mundi-lid kun je tijdens de Introweek het verschil maken. Als Intro Ouder begeleid je eerstejaars,
            help je ze wegwijs te worden in studie en stad, en zorg je dat ze zich welkom voelen.
        </p>

        <div className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-[var(--color-purple-500)]">Wat doet een Intro Ouder?</h3>
            <ul className="grid gap-3">
                <li className="flex gap-3 text-[var(--text-muted)] font-medium">
                    <span className="text-[var(--color-purple-500)] font-black">★</span>
                    <span><strong>Begeleiden:</strong> Help kleine groepjes nieuwe leden tijdens activiteiten en zorg voor een veilige sfeer.</span>
                </li>
                <li className="flex gap-3 text-[var(--text-muted)] font-medium">
                    <span className="text-[var(--color-purple-500)] font-black">★</span>
                    <span><strong>Mentorschap:</strong> Geef tips over studie, rooster en het vinden van de weg in Eindhoven.</span>
                </li>
                <li className="flex gap-3 text-[var(--text-muted)] font-medium">
                    <span className="text-[var(--color-purple-500)] font-black">★</span>
                    <span><strong>Gezelligheid:</strong> Organiseer leuke momenten binnen je groep — simpele spellen en samen eten doen wonderen.</span>
                </li>
            </ul>
        </div>

        <div className="p-6 bg-[var(--bg-soft)] rounded-2xl border border-[var(--border-color)]/20 shadow-inner">
            <p className="text-sm font-bold text-[var(--text-muted)] leading-relaxed italic">
                Heb je vragen? Neem contact op met de introcommissie.
            </p>
        </div>
    </div>
);

export default async function IntroPage() {
    await connection();
    
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const session = await getEnrichedSession();
    
    // Cruciale fix: Controleer specifiek of user bestaat, want de Redis plugin 
    // kan een leeg object {} retourneren!
    const isAuthenticated = !!session?.user;
    const isAlreadyParent = isAuthenticated ? await hasParentSignup() : false;
    const blogs = await getIntroBlogsPublic();

    return (
        <PublicPageShell>
            <h1 className="sr-only">Introductie</h1>
            
            <section className="px-[var(--spacing-fluid-md)] py-[var(--spacing-fluid-lg)]">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 max-w-7xl mx-auto w-full items-start">
                    <div className="flex-1 space-y-6">
                        <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] shadow-xl p-[var(--spacing-fluid-md)] sm:p-10">
                            {isAuthenticated ? <IntroInfoParent /> : <IntroInfoStudent />}
                        </div>
                        {!isAuthenticated && <IntroLightboxIsland />}
                    </div>

                    <div className="flex-1 w-full">
                        {isAuthenticated && session?.user ? (
                            isAlreadyParent ? (
                                <div className="bg-gradient-theme rounded-[2rem] p-10 shadow-xl text-center flex flex-col items-center justify-center min-h-[300px]">
                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Aangemeld!</h3>
                                    <p className="text-white/80 font-medium max-w-sm">
                                        Bedankt! Je inschrijving als Intro Ouder is ontvangen. We nemen snel contact met je op.
                                    </p>
                                </div>
                            ) : (
                                <IntroParentIsland
                                    userName={session.user.name}
                                    userEmail={session.user.email}
                                    initialPhone={session.user.phone_number || ''}
                                />
                            )
                        ) : (
                            <IntroStudentIsland />
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
