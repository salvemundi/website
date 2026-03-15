// Server Component — statische "Waarom Salve Mundi?" sectie met drie pijlerkaarten.
// Geen interactiviteit, geen 'use client', geen ScrollTriggerWrapper.
// Animatie via native CSS: animate-fade-in-up uit animations.css.
// Alle kleuren via CSS design tokens — geen hardcoded hex of Tailwind kleurklassen.

// Pijlerkaart definitie — icoon als inline SVG (stroke="currentColor")
interface Pijler {
    titel: string;
    beschrijving: string;
    icon: React.ReactNode;
}

const pijlers: Pijler[] = [
    {
        titel: 'Gezelligheid',
        beschrijving:
            'Van gezellig chillen in onze eigen ruimte tot onvergetelijke feesten en weekendjes weg bij Salve Mundi. Bouw vriendschappen die een leven lang meegaan.',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                aria-hidden="true"
            >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
        ),
    },
    {
        titel: 'Studie',
        beschrijving:
            'Samen sta je sterker. We organiseren bijlessen, workshops en bedrijfsbezoeken om jou te helpen excelleren in je studie en carrière.',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                aria-hidden="true"
            >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
    },
    {
        titel: 'Ontwikkeling',
        beschrijving:
            'Boost je CV door actief te worden in een van onze 10 commissies. Leer organiseren, besturen en samenwerken in een professionele omgeving.',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                aria-hidden="true"
            >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
        ),
    },
];

export function WhySalveMundiSection() {
    return (
        <section className="px-6 py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app">
                {/* Sectie-header */}
                <div className="animate-fade-in-up text-center mb-8 sm:mb-12">
                    <p className="text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-[var(--color-purple-300)] mb-3">
                        Waarom Salve Mundi?
                    </p>
                    <h2 className="text-3xl font-black text-gradient sm:text-4xl md:text-5xl">
                        Meer dan alleen studeren
                    </h2>
                </div>

                {/* Pijlerkaarten */}
                <div className="grid gap-8 md:grid-cols-3">
                    {pijlers.map((pijler) => (
                        <div
                            key={pijler.titel}
                            className="group relative rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                        >
                            {/* Icoon-badge — hover wisselt naar bg-gradient-theme conform legacy */}
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-purple-300)]/10 text-[var(--color-purple-300)] group-hover:bg-gradient-theme group-hover:text-[var(--text-main)] transition-all duration-300">
                                {pijler.icon}
                            </div>

                            <h3 className="mb-4 text-xl font-bold text-[var(--text-main)]">
                                {pijler.titel}
                            </h3>
                            <p className="text-[var(--text-muted)] leading-relaxed">
                                {pijler.beschrijving}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
