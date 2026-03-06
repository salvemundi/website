// High-fidelity Skeleton voor FooterIsland — voorkomt CLS tijdens server-streaming
// Rendeert dezelfde grid-structuur als de echte Footer met pulserende placeholders
const FooterSkeleton: React.FC = () => {
    return (
        <footer
            className="relative overflow-hidden bg-gradient-theme"
            aria-hidden="true"
        >
            <div className="relative mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 animate-pulse">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Informatie-kolom */}
                    <div className="space-y-3">
                        <div className="h-3 w-24 rounded bg-[var(--color-purple-100)]/20" />
                        <div className="h-2.5 w-32 rounded bg-[var(--color-purple-100)]/15" />
                        <div className="h-2.5 w-28 rounded bg-[var(--color-purple-100)]/15" />
                        <div className="h-2.5 w-20 rounded bg-[var(--color-purple-100)]/15" />
                        <div className="h-7 w-28 rounded-full bg-[var(--color-purple-100)]/10" />
                        <div className="h-7 w-24 rounded-full bg-[var(--color-purple-100)]/10" />
                    </div>

                    {/* Pagina's-kolom */}
                    <div className="space-y-3">
                        <div className="h-3 w-20 rounded bg-[var(--color-purple-100)]/20" />
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-7 rounded-full bg-[var(--color-purple-100)]/10"
                                style={{ width: `${56 + (i % 3) * 16}px` }}
                            />
                        ))}
                    </div>

                    {/* Commissies-kolom */}
                    <div className="space-y-3">
                        <div className="h-3 w-24 rounded bg-[var(--color-purple-100)]/20" />
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-7 rounded-full bg-[var(--color-purple-100)]/10"
                                style={{ width: `${64 + (i % 4) * 14}px` }}
                            />
                        ))}
                    </div>

                    {/* Contact-kolom */}
                    <div className="space-y-3">
                        <div className="h-3 w-16 rounded bg-[var(--color-purple-100)]/20" />
                        <div className="h-7 w-40 rounded-full bg-[var(--color-purple-100)]/10" />
                        <div className="h-7 w-32 rounded-full bg-[var(--color-purple-100)]/10" />
                        <div className="h-7 w-24 rounded-full bg-[var(--color-purple-100)]/10" />
                        <div className="mt-2 h-3 w-24 rounded bg-[var(--color-purple-100)]/20" />
                        <div className="mt-2 flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-[var(--color-purple-100)]/10" />
                            <div className="h-10 w-10 rounded-full bg-[var(--color-purple-100)]/10" />
                            <div className="h-10 w-10 rounded-full bg-[var(--color-purple-100)]/10" />
                        </div>
                    </div>
                </div>

                {/* Copyright-balk */}
                <div className="mt-12 pt-8 flex justify-center">
                    <div className="h-3 w-72 rounded bg-[var(--color-purple-100)]/10" />
                </div>
            </div>
        </footer>
    );
};

export default FooterSkeleton;
