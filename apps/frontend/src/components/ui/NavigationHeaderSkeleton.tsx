// High-fidelity Skeleton voor NavigationHeader — voorkomt CLS tijdens hydration
// Rendeert dezelfde breedte/hoogte als de echte navbar met pulserende placeholders
const NavigationHeaderSkeleton: React.FC = () => {
    return (
        <header
            className="fixed top-0 z-40 w-full bg-[var(--bg-main)]/80 backdrop-blur-md"
            style={{ height: 'var(--header-height, 72px)' }}
            aria-hidden="true"
        >
            <div className="mx-auto flex items-center max-w-full justify-between gap-4 px-6 py-4 sm:px-10 lg:px-12 h-full z-10 relative animate-pulse">
                {/* Logo placeholder */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--color-purple-100)]" />
                    <div className="hidden sm:flex flex-col gap-1">
                        <div className="h-2.5 w-20 rounded bg-[var(--color-purple-100)]" />
                        <div className="h-2.5 w-16 rounded bg-[var(--color-purple-100)]" />
                    </div>
                </div>

                {/* Nav-links placeholder (desktop) */}
                <div className="hidden lg:flex items-center gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-3 rounded bg-[var(--color-purple-100)]"
                            style={{ width: `${48 + i * 8}px` }}
                        />
                    ))}
                </div>

                {/* Acties placeholder */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-24 rounded-full bg-[var(--color-purple-100)]" />
                    <div className="h-9 w-9 rounded-full bg-[var(--color-purple-100)]" />
                    <div className="h-9 w-9 rounded-full bg-[var(--color-purple-100)] lg:hidden" />
                </div>
            </div>
        </header>
    );
};

export default NavigationHeaderSkeleton;
