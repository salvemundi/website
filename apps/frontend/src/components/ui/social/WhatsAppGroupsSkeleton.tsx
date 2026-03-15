export const WhatsAppGroupsSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 mb-8 shadow-md">
                <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-full bg-[var(--color-purple-100)] shrink-0" />
                    <div className="flex-1">
                        <div className="h-6 w-48 rounded bg-[var(--color-purple-100)] mb-3" />
                        <div className="h-4 w-full rounded bg-[var(--color-purple-100)] mb-2" />
                        <div className="h-4 w-3/4 rounded bg-[var(--color-purple-100)]" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-3xl bg-[var(--bg-card)] shadow-lg p-6 flex flex-col justify-between h-48">
                         <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-[var(--color-purple-100)] flex-shrink-0" />
                            <div className="flex-1 mt-2">
                                <div className="h-6 w-3/4 rounded bg-[var(--color-purple-100)] mb-3" />
                                <div className="h-4 w-full rounded bg-[var(--color-purple-100)] mb-2" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-[var(--color-purple-100)] pt-4 mt-auto">
                            <div className="h-6 w-24 rounded-full bg-[var(--color-purple-100)]" />
                            <div className="h-10 w-32 rounded-full bg-[var(--color-purple-100)]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
