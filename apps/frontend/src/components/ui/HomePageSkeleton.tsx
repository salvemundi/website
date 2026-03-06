// Hoge-kwaliteit skeletons voor de homepagina secties.
// Matcht de exacte afmetingen van de echte components om CLS te voorkomen.

export function HeroSkeleton() {
    return (
        <div className="relative mx-4 mt-4 h-[480px] rounded-4xl bg-[var(--bg-card)] sm:h-[560px] md:h-[640px] animate-pulse">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6">
                <div className="h-6 w-48 rounded-full bg-[var(--border-color)]" />
                <div className="h-40 w-40 rounded-full bg-[var(--border-color)] sm:h-56 sm:w-56" />
            </div>
        </div>
    );
}

export function EventsSkeleton() {
    return (
        <section className="px-6 py-8 sm:py-10 md:py-12 animate-pulse">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-3 h-4 w-32 rounded-full bg-[var(--bg-card)]" />
                    <div className="mx-auto h-8 w-64 rounded-full bg-[var(--bg-card)]" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="rounded-3xl bg-[var(--bg-card)] p-6 shadow-sm dark:border dark:border-white/10"
                        >
                            <div className="mb-4 h-4 w-24 rounded-full bg-[var(--border-color)]" />
                            <div className="mb-2 h-6 w-3/4 rounded-full bg-[var(--border-color)]" />
                            <div className="h-4 w-1/2 rounded-full bg-[var(--border-color)]" />
                        </div>
                    ))}
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
        <section className="py-8 sm:py-10 md:py-12 overflow-hidden animate-pulse">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-2 h-3 w-28 rounded-full bg-[var(--bg-card)]" />
                    <div className="mx-auto h-7 w-48 rounded-full bg-[var(--bg-card)]" />
                </div>
            </div>
            <div className="flex gap-8 px-6">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-20 w-36 flex-shrink-0 rounded-xl bg-[var(--bg-card)]"
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

