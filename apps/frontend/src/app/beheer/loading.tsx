export default function BeheerLoading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-pulse">
            <div className="mb-8">
                <div className="h-4 w-32 bg-[var(--bg-card)] rounded mb-2" />
                <div className="h-10 w-64 bg-[var(--bg-card)] rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 rounded-3xl bg-[var(--bg-card)] shadow-md" />
                ))}
            </div>
            <div className="rounded-3xl bg-[var(--bg-card)] h-96 shadow-lg" />
        </div>
    );
}
