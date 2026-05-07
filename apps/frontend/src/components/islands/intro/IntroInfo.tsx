'use client';

import React from 'react';
import { IntroLightboxIsland } from '@/components/islands/intro/IntroLightboxIsland';

export const IntroInfoStudent = () => (
    <div className="animate-in fade-in duration-700">
        <h2 className="text-2xl lg:text-3xl font-semibold mb-4 text-theme dark:text-white">
            Klaar om je studententijd met een knal te beginnen?
        </h2>
        <p className="text-base lg:text-lg leading-relaxed mb-4 text-theme dark:text-white font-medium">
            Voordat de boeken opengaan en de eerste regels code geschreven worden, is er maar één plek waar je moet zijn: de Salve Mundi Introductie!
        </p>

        <h3 className="font-semibold mb-2 text-theme dark:text-white">Waarom je dit niet wilt missen</h3>
        <ul className="list-disc list-inside mb-4 text-base lg:text-lg text-theme dark:text-white font-medium">
            <li className="mb-1"><strong>Legendarische feesten:</strong> Ontdek het Eindhovense nachtleven met mensen die dezelfde passie delen.</li>
            <li className="mb-1"><strong>Connecties:</strong> Leer de ouderejaars kennen; zij weten precies hoe je die lastige vakken straks haalt.</li>
            <li className="mb-1"><strong>Gezelligheid boven alles:</strong> Geen ontgroening, maar een warm welkom bij dè studievereniging van Fontys ICT.</li>
        </ul>

        <h3 className="font-semibold text-theme dark:text-white">Schrijf je nu in!</h3>
        <p className="text-base lg:text-lg leading-relaxed mb-2 text-theme dark:text-white font-medium">
            Ben jij erbij? Vul het onderstaande formulier in om je plek te reserveren voor de gezelligste week van het jaar.
            Of je nu een hardcore gamer bent, een toekomstige developer of gewoon houdt van een goed feestje: bij Salve Mundi hoor je erbij.
        </p>
        <p className="text-sm text-[var(--beheer-text-muted)] italic">Let op: de plaatsen zijn beperkt, dus wacht niet te lang met aanmelden!</p>
        
        <div className="mt-8">
            <IntroLightboxIsland />
        </div>
    </div>
);

export const IntroInfoParent = () => (
    <div className="animate-in fade-in duration-700">
        <h2 className="text-2xl lg:text-3xl font-semibold mb-4 text-theme dark:text-white">
            Word Intro Ouder — begeleid de nieuwe lichting
        </h2>
        <p className="text-base lg:text-lg leading-relaxed mb-4 text-theme dark:text-white font-medium">
            Als ervaren Salve Mundi-lid kun je tijdens de Introweek het verschil maken. Als Intro Ouder begeleid je eerstejaars,
            help je ze wegwijs te worden in studie en stad, en zorg je dat ze zich welkom voelen. Het is gezellig, laagdrempelig en
            een mooie kans om jouw ervaring door te geven.
        </p>

        <h3 className="font-semibold mb-2 text-theme dark:text-white">Wat doet een Intro Ouder?</h3>
        <ul className="list-disc list-inside mb-4 text-base lg:text-lg text-theme dark:text-white font-medium">
            <li className="mb-1"><strong>Begeleiden:</strong> help kleine groepjes nieuwe leden tijdens activiteiten en zorg voor een veilige sfeer.</li>
            <li className="mb-1"><strong>Mentorschap:</strong> geef tips over studie, rooster en het vinden van de weg in Eindhoven.</li>
            <li className="mb-1"><strong>Gezelligheid:</strong> organiseer leuke momenten binnen je groep — simpele spellen, gesprekken en samen eten doen wonderen.</li>
        </ul>

        <h3 className="font-semibold text-theme dark:text-white">Waarom meedoen?</h3>
        <p className="text-base lg:text-lg leading-relaxed text-theme dark:text-white font-medium mb-8">
            Naast de gezelligheid is het een mooie manier om je steentje bij te dragen aan de vereniging. Je leert nieuwe mensen kennen
            en ziet de introductie vanuit een heel ander perspectief. 
        </p>
    </div>
);
