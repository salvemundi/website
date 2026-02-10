export default function CardSkeleton() {
    return (
        <div className="group flex flex-col overflow-hidden rounded-3xl bg-[var(--bg-card)]/90 shadow-lg animate-pulse">
            <div className="relative h-48 w-full bg-gradient-to-br from-theme-purple/10 to-theme-purple/20" />
            <div className="flex flex-1 flex-col p-6 space-y-4">
                <div className="h-6 bg-theme-purple/10 rounded-lg w-3/4" />
                <div className="space-y-2 flex-1">
                    <div className="h-4 bg-theme-purple/10 rounded w-full" />
                    <div className="h-4 bg-theme-purple/10 rounded w-5/6" />
                    <div className="h-4 bg-theme-purple/10 rounded w-4/6" />
                </div>
                <div className="flex gap-2">
                    <div className="h-8 bg-theme-purple/10 rounded-full w-24" />
                    <div className="h-8 bg-theme-purple/10 rounded-full w-20" />
                </div>
            </div>
        </div>
    );
}
