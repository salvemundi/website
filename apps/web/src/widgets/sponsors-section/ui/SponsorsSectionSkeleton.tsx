export default function SponsorsSectionSkeleton() {
    return (
        <section className="py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] overflow-hidden">
            <div className="mx-auto max-w-app px-6 animate-pulse">
                <div className="text-center mb-8">
                    <div className="h-3 w-24 bg-theme-purple/10 rounded mx-auto mb-2" />
                    <div className="h-7 sm:h-8 w-48 sm:w-64 bg-theme-purple/10 rounded-lg mx-auto" />
                </div>
            </div>

            {/* Scrolling logos skeleton */}
            <div className="flex gap-8 justify-center px-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-shrink-0 h-16 w-28 sm:h-20 sm:w-36 rounded-xl bg-theme-purple/8"
                    />
                ))}
            </div>
        </section>
    );
}
