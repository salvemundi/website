export default function SafeHavenCardSkeleton() {
    return (
        <div className="rounded-3xl bg-[var(--bg-card)] shadow-xl overflow-hidden animate-pulse">
            <div className="relative h-64 bg-gradient-to-br from-theme-purple/10 to-theme-purple/20" />
            <div className="p-6 space-y-4">
                <div className="h-7 bg-theme-purple/10 rounded-lg w-2/3" />
                <div className="space-y-2">
                    <div className="h-4 bg-theme-purple/10 rounded w-full" />
                    <div className="h-4 bg-theme-purple/10 rounded w-5/6" />
                </div>
                <div className="flex gap-3 pt-2">
                    <div className="h-10 bg-theme-purple/10 rounded-full w-32" />
                    <div className="h-10 bg-theme-purple/10 rounded-full w-28" />
                </div>
            </div>
        </div>
    );
}
