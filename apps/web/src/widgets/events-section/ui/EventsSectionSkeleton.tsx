import EventCardSkeleton from '@/shared/ui/skeletons/EventCardSkeleton';

export default function EventsSectionSkeleton() {
    return (
        <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]">
            <div className="mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 rounded-xl bg-gradient-theme px-6 sm:px-10 pt-8 sm:pt-10 md:pt-12 pb-8 sm:pb-10 md:pb-12 shadow-xl">
                    {/* Header skeleton */}
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between animate-pulse">
                        <div className="space-y-3">
                            <div className="h-3 w-16 bg-white/20 rounded" />
                            <div className="h-8 sm:h-10 w-64 sm:w-80 bg-white/20 rounded-lg" />
                            <div className="h-4 w-48 sm:w-64 bg-white/15 rounded" />
                        </div>
                        <div className="h-10 w-40 bg-white/20 rounded-full" />
                    </div>

                    {/* Event cards skeleton grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <EventCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
