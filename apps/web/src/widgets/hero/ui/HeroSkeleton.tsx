export default function HeroSkeleton() {
    return (
        <section className="relative bg-[var(--bg-main)] justify-self-center overflow-hidden w-full min-h-[450px] md:min-h-[500px] py-4 sm:py-8 lg:py-12">
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="relative w-full px-0">
                    <div className="grid gap-5 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-16 xl:gap-20 md:items-center">
                        {/* Left column: text + CTA */}
                        <div className="space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 min-w-0 animate-pulse">
                            <div className="space-y-3 sm:space-y-4 md:space-y-6">
                                {/* Title lines */}
                                <div className="space-y-2">
                                    <div className="h-8 sm:h-10 md:h-14 lg:h-16 bg-theme-purple/10 rounded-lg w-[85%]" />
                                    <div className="h-8 sm:h-10 md:h-14 lg:h-16 bg-theme-purple/10 rounded-lg w-[65%]" />
                                </div>
                                {/* Description lines */}
                                <div className="space-y-2">
                                    <div className="h-3 sm:h-4 md:h-5 bg-theme-purple/8 rounded w-full" />
                                    <div className="h-3 sm:h-4 md:h-5 bg-theme-purple/8 rounded w-[90%]" />
                                    <div className="h-3 sm:h-4 md:h-5 bg-theme-purple/8 rounded w-[70%]" />
                                </div>
                            </div>

                            {/* CTA card skeleton */}
                            <div className="w-full">
                                <div className="flex flex-wrap gap-3 sm:gap-4 min-h-[100px]">
                                    <div className="w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/10 p-4 sm:p-6 shadow-lg backdrop-blur min-h-[90px] sm:min-h-[100px] border border-theme-purple/10">
                                        <div className="h-3 w-20 bg-theme-purple/10 rounded mb-3" />
                                        <div className="h-5 w-3/4 bg-theme-purple/10 rounded mb-2" />
                                        <div className="h-3 w-1/2 bg-theme-purple/10 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column: image placeholder */}
                        <div className="flex flex-wrap gap-3 sm:gap-4 min-w-0 animate-pulse">
                            <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[var(--bg-card)]/80 shadow-2xl overflow-hidden">
                                <div className="h-[240px] sm:h-[280px] md:h-[350px] lg:h-[480px] xl:h-[540px] bg-gradient-to-br from-theme-purple/5 to-theme-purple/15" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
