export default function EventCardSkeleton() {
    return (
        <div className="h-40 rounded-[1.75rem] bg-white/70 dark:bg-surface-dark/70 shadow-lg overflow-hidden animate-pulse">
            <div className="h-full flex flex-col justify-between p-4">
                <div className="space-y-2">
                    <div className="h-5 bg-theme-purple/10 rounded w-3/4" />
                    <div className="h-3 bg-theme-purple/10 rounded w-1/2" />
                </div>
                <div className="h-4 bg-theme-purple/10 rounded w-2/3" />
            </div>
        </div>
    );
}
