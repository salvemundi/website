// High-fidelity Skeleton voor NavigationHeader — voorkomt CLS tijdens hydration
// Rendeert dezelfde breedte/hoogte als de echte navbar met pulserende placeholders
const NavigationHeaderSkeleton: React.FC = () => {
    return (
        <header
            className="fixed top-0 z-40 w-full bg-[var(--bg-main)]/80 backdrop-blur-md"
            style={{ height: 'var(--header-height, 72px)' }}
            aria-hidden="true"
        >
            <div className="mx-auto h-16 items-center px-6 sm:px-10 lg:px-12 flex justify-between gap-4 lg:gap-5">
                {/* 1. Logo Section placeholder (matched to real structure) */}
                <div className="flex items-center justify-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--color-purple-100)] opacity-30" />
                    <div className="hidden sm:flex flex-col gap-1.5">
                        <div className="h-2 w-24 rounded bg-[var(--color-purple-100)] opacity-20" />
                        <div className="h-2.5 w-16 rounded bg-[var(--color-purple-100)] opacity-30" />
                    </div>
                </div>

                {/* 2. Nav-links placeholder (matched to gap-5) */}
                <div className="hidden lg:flex items-center justify-center gap-5">
                    {['Home', 'Intro', 'Lidmaatschap', 'Activiteiten', 'Vereniging', 'Reis'].map((name, i) => (
                        <div
                            key={i}
                            className="h-3 rounded bg-[var(--color-purple-100)] opacity-40 shrink-0"
                            style={{ width: `${name.length * 8 + 8}px` }}
                        />
                    ))}
                </div>

                {/* 3. Acties placeholder (matched to gap-3) */}
                <div className="flex items-center justify-end gap-3">
                    {/* Admin Placeholder (88px) - keeps right side stable for authenticated state */}
                    <div className="hidden xl:block h-8 w-[88px] rounded-full bg-[var(--color-purple-100)] opacity-20" />

                    {/* Profile/Auth Placeholder (136px) */}
                    <div className="h-8 w-[136px] rounded-full bg-[var(--color-purple-100)] opacity-30 animate-pulse" />
                    
                    {/* Theme Toggle Placeholder */}
                    <div className="h-9 w-9 rounded-full bg-[var(--color-purple-100)] opacity-30" />
                    
                    {/* Hamburger Placeholder (Mobile only) */}
                    <div className="h-9 w-9 rounded-full bg-[var(--color-purple-100)] opacity-20 lg:hidden" />
                </div>
            </div>
        </header>
    );
};

export default NavigationHeaderSkeleton;
