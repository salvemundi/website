import Hero from '@/widgets/hero/ui/Hero';
import EventsSection from '@/widgets/events-section/ui/EventsSection';

export default function HomePage() {
    return (
        <main>
            <Hero />
            <EventsSection />

            {/* Why Salve Mundi Section */}
            <section className="px-6 py-24 bg-[var(--bg-main)]">
                <div className="mx-auto max-w-app">
                    <div className="text-center mb-16">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-theme-purple mb-4">
                            Waarom Salve Mundi?
                        </p>
                        <h2 className="text-3xl font-black text-theme sm:text-4xl md:text-5xl">
                            Meer dan alleen studeren
                        </h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {/* Pillar 1: Gezelligheid */}
                        <div className="group relative rounded-3xl bg-[var(--bg-card)] p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl  ">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-purple/10 text-theme-purple group-hover:bg-gradient-theme group-hover:text-theme-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
                            </div>
                            <h3 className="mb-4 text-xl font-bold text-theme">Gezelligheid</h3>
                            <p className="text-theme-muted leading-relaxed">
                                Van legendarische borrels in onze eigen soos tot onvergetelijke feesten en weekendjes weg. Bij Salve Mundi maak je vrienden voor het leven.
                            </p>
                        </div>

                        {/* Pillar 2: Studie */}
                        <div className="group relative rounded-3xl bg-[var(--bg-card)] p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-purple-dark/10 text-theme-purple-dark group-hover:bg-gradient-theme-dark group-hover:text-theme-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                            </div>
                            <h3 className="mb-4 text-xl font-bold text-theme">Studie</h3>
                            <p className="text-theme-muted leading-relaxed">
                                Samen sta je sterker. We organiseren bijlessen, workshops en bedrijfsbezoeken om jou te helpen excelleren in je studie en carrière.
                            </p>
                        </div>

                        {/* Pillar 3: Ontwikkeling */}
                        <div className="group relative rounded-3xl bg-[var(--bg-card)] p-8 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
                            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-purple-light/10 text-theme-purple-light group-hover:bg-gradient-theme-light group-hover:text-theme-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            </div>
                            <h3 className="mb-4 text-xl font-bold text-theme">Ontwikkeling</h3>
                            <p className="text-theme-muted leading-relaxed">
                                Boost je CV door actief te worden in een van onze 15 commissies. Leer organiseren, besturen en samenwerken in een professionele omgeving.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Join Section */}
            <section className="px-6 py-24 ">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-black text-gradient sm:text-4xl md:text-5xl mb-6">
                        Klaar om lid te worden?
                    </h2>
                    <p className="text-lg text-theme-muted mb-8 max-w-2xl mx-auto">
                        Sluit je aan bij onze community van studenten en maak het meeste van je studententijd.
                        Voor slechts €15 per jaar krijg je toegang tot alle activiteiten met korting!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/lidmaatschap"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-theme px-8 py-4 text-base font-semibold text-theme-white shadow-xl transition hover:scale-105"
                        >
                            Word nu lid
                        </a>
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-transparent px-8 py-4 text-base font-semibold text-theme-purple transition hover:bg-theme-purple/5 hover:scale-105"
                        >
                            Neem contact op
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
