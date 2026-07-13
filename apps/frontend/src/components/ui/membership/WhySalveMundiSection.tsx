// Server Component — statische "Waarom Salve Mundi?" sectie met drie pijlerkaarten.
// Geen interactiviteit, geen 'use client', geen ScrollTriggerWrapper.
// Animatie via native CSS: animate-fade-in-up uit animations.css.
// Alle kleuren via CSS design tokens — geen hardcoded hex of Tailwind kleurklassen.

// Pijlerkaart definitie — icoon als inline SVG (stroke="currentColor")
interface Pijler {
    name: string;
    description: string;
    icon: React.ReactNode;
}

const pijlers: Pijler[] = [
    {
        name: 'Gezelligheid',
        description:
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
        )
    },
    {
        name: 'Studie',
        description:
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
        )
    },
    {
        name: 'Ontwikkeling',
        description:
            'Boost je CV door actief te worden in een van onze commissies. Leer organiseren, besturen en samenwerken in een professionele omgeving.',
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
        )
    },
];

export function WhySalveMundiSection() {
    return (
        <section className="py-fluid-lg">
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                {/* Sectie-header */}
                <div className="text-center mb-6 sm:mb-10">
                    <h2 className="text-3xl font-black text-gradient sm:text-4xl md:text-5xl">
                        Waarom Salve Mundi?
                    </h2>
                </div>

                {/* Pijlerkaarten */}
                <div className="grid gap-8 md:grid-cols-3">
                    {pijlers.map((pijler) => (
                        <div
                            key={pijler.name}
                            className="group relative squircle-lg bg-(--bg-card) dark:border dark:border-white/10 p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                        >
                            {/* Flex container for Icon + Title */}
                            <div className="flex items-center gap-3.5 mb-4">
                                <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-300/10 dark:bg-transparent text-purple-300 group-hover:bg-gradient-theme group-hover:text-(--text-main) transition-all duration-300">
                                    {pijler.icon}
                                </div>
                                <h3 className="text-xl font-bold text-(--text-main)">
                                    {pijler.name}
                                </h3>
                            </div>

                            <p className="text-(--text-muted) leading-relaxed">
                                {pijler.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
