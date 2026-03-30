export default function ActiviteitBewerkenSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl overflow-x-hidden animate-pulse">
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl p-8 sm:p-10 space-y-8 border border-[var(--beheer-border)]">
                {/* Basic Info */}
                <div>
                    <div className="h-3 w-20 bg-[var(--beheer-border)]/50 rounded mb-3" />
                    <div className="h-14 w-full bg-[var(--bg-main)] rounded-xl border border-[var(--beheer-border)]/50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="h-3 w-24 bg-[var(--beheer-border)]/50 rounded mb-3" />
                        <div className="h-14 w-full bg-[var(--bg-main)] rounded-xl border border-[var(--beheer-border)]/50" />
                    </div>
                    <div>
                        <div className="h-3 w-20 bg-[var(--beheer-border)]/50 rounded mb-3" />
                        <div className="h-14 w-full bg-[var(--bg-main)] rounded-xl border border-[var(--beheer-border)]/50" />
                    </div>
                </div>

                <div>
                    <div className="h-3 w-24 bg-[var(--beheer-border)]/50 rounded mb-3" />
                    <div className="h-40 w-full bg-[var(--bg-main)] rounded-xl border border-[var(--beheer-border)]/50" />
                </div>

                {/* Capacity & Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="h-3 w-20 bg-[var(--beheer-border)]/50 rounded mb-3" />
                        <div className="h-14 w-full bg-[var(--bg-main)] rounded-xl border border-[var(--beheer-border)]/50" />
                    </div>
                    <div>
                        <div className="h-3 w-24 bg-[var(--beheer-border)]/50 rounded mb-3" />
                        <div className="h-14 w-full bg-[var(--bg-main)] rounded-xl border border-[var(--beheer-border)]/50" />
                    </div>
                    <div>
                        <div className="h-3 w-32 bg-[var(--beheer-border)]/50 rounded mb-3" />
                        <div className="h-14 w-full bg-[var(--bg-main)] rounded-xl border border-[var(--beheer-border)]/50" />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 pt-6">
                    <div className="flex-1 h-14 bg-[var(--beheer-accent)]/20 rounded-full border border-[var(--beheer-accent)]/30" />
                    <div className="sm:w-40 h-14 bg-[var(--beheer-border)]/50 rounded-full" />
                </div>
            </div>
        </div>
    );
}

