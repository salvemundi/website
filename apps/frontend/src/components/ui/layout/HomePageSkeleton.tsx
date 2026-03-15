// Hoge-kwaliteit skeletons voor de homepagina secties.
// Matcht de exacte afmetingen van de echte components om CLS te voorkomen.

export function HeroSkeleton() {
    return (
        <section
            className="relative bg-[var(--bg-main)] justify-self-center overflow-hidden w-full min-h-[450px] md:min-h-[500px] py-4 sm:py-8 lg:py-12 animate-pulse"
        >
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="relative w-full px-0">
                    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-16 xl:gap-20 md:items-center">
                        {/* Left Column Text */}
                        <div className="space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 min-w-0">
                            <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                <h1 className="text-2xl font-black leading-tight sm:text-3xl md:text-5xl lg:text-6xl opacity-20">
                                    <span>Studievereniging</span>
                                    <br />
                                    <span>Salve Mundi</span>
                                </h1>
                                <div className="h-4 w-3/4 bg-[var(--bg-card)] rounded-full opacity-20" />
                                <div className="h-4 w-1/2 bg-[var(--bg-card)] rounded-full opacity-20" />
                            </div>
                            <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 p-4 sm:p-6 shadow-lg min-h-[90px] sm:min-h-[100px]" />
                        </div>

                        {/* Right Column Swiper Area */}
                        <div className="relative w-full aspect-[4/3] rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] shadow-2xl overflow-hidden opacity-50">
                            <div className="w-full h-full bg-[var(--border-color)]/20" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function EventsSkeleton() {
    return (
        <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] animate-pulse">
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 rounded-xl bg-gradient-theme px-6 sm:px-10 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:py-12 shadow-xl opacity-60">
                    <div className="mb-8 opacity-50">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--theme-purple)] dark:text-white mb-2">
                            Agenda
                        </p>
                        <h2 className="text-3xl font-black text-[var(--theme-purple)] dark:text-white sm:text-4xl">
                            Aankomende evenementen
                        </h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-40 rounded-3xl bg-white/90 dark:bg-black/40 p-6 shadow-sm border border-[var(--border-color)]/20"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export function JoinSkeleton() {
    return (
        <section className="px-6 py-8 sm:py-10 md:py-12 animate-pulse">
            <div className="mx-auto max-w-4xl text-center">
                <div className="mx-auto mb-6 h-10 w-72 rounded-full bg-[var(--bg-card)]" />
                <div className="mx-auto mb-8 h-5 w-96 max-w-full rounded-full bg-[var(--bg-card)]" />
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <div className="h-14 w-40 rounded-full bg-[var(--bg-card)]" />
                    <div className="h-14 w-40 rounded-full bg-[var(--bg-card)]" />
                </div>
            </div>
        </section>
    );
}

export function SponsorsSkeleton() {
    return (
        <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden animate-pulse">
            <div className="mx-auto max-w-app px-6 opacity-50">
                <div className="text-center mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-purple-300)] mb-2">
                        Onze sponsors
                    </p>
                    <h2 className="text-2xl font-black text-[var(--text-main)] sm:text-3xl">
                        Zij maken het mogelijk
                    </h2>
                </div>
            </div>
            <div className="flex gap-8 px-6 opacity-30">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="h-20 w-36 flex-shrink-0 rounded-xl bg-[var(--bg-card)] shadow-sm"
                    />
                ))}
            </div>
        </section>
    );
}

export function HomePageSkeleton() {
    return (
        <main>
            <HeroSkeleton />
            <EventsSkeleton />
            <JoinSkeleton />
            <SponsorsSkeleton />
        </main>
    );
}

