export default function ActivityCardSkeleton() {
    return (
        <div className="rounded-3xl bg-[var(--bg-card)] shadow-xl overflow-hidden animate-pulse">
            <div className="relative h-56 bg-gradient-to-br from-theme-purple/10 to-theme-purple/20" />
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-theme-purple/10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 bg-theme-purple/10 rounded w-3/4" />
                        <div className="h-3 bg-theme-purple/10 rounded w-1/2" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-theme-purple/10 rounded w-full" />
                    <div className="h-4 bg-theme-purple/10 rounded w-5/6" />
                    <div className="h-4 bg-theme-purple/10 rounded w-4/6" />
                </div>
                <div className="pt-2 border-t border-theme-purple/10">
                    <div className="h-10 bg-theme-purple/10 rounded-full w-full" />
                </div>
            </div>
        </div>
    );
}
