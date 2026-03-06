import { Loader2 } from 'lucide-react';

export function ReisPageHeaderSkeleton() {
    return (
        <div className="flex flex-col w-full animate-pulse">
            <div className="w-full h-[400px] sm:h-[450px] md:h-[500px] bg-theme-purple/5 flex items-center justify-center relative overflow-hidden">
                <Loader2 className="h-8 w-8 text-theme-purple/30 animate-spin" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
            </div>
        </div>
    );
}

export function ReisFormSkeleton() {
    return (
        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8 animate-pulse">
            {/* Title Space */}
            <div className="h-8 w-3/4 sm:w-1/2 bg-theme-purple/10 dark:bg-white/5 rounded-lg mb-4 sm:mb-6"></div>

            {/* Form Fields Simulation */}
            <div className="flex flex-col gap-4">
                <div className="h-4 w-full bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                        <div className="h-12 w-full bg-surface dark:bg-white/5 border border-theme-border/50 rounded-lg"></div>
                        <div className="h-3 w-3/4 bg-theme-text-muted/5 rounded"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-1/4 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                        <div className="h-12 w-full bg-surface dark:bg-white/5 border border-theme-border/50 rounded-lg"></div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                    <div className="h-12 w-full bg-surface dark:bg-white/5 border border-theme-border/50 rounded-lg"></div>
                </div>

                <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                    <div className="h-12 w-full bg-surface dark:bg-white/5 border border-theme-border/50 rounded-lg"></div>
                </div>

                <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                    <div className="h-12 w-full bg-surface dark:bg-white/5 border border-theme-border/50 rounded-lg"></div>
                </div>

                <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                    <div className="h-12 w-full bg-surface dark:bg-white/5 border border-theme-border/50 rounded-lg"></div>
                </div>

                {/* Terms checkbox */}
                <div className="flex items-start gap-2 mt-2">
                    <div className="h-5 w-5 bg-theme-purple/10 dark:bg-white/5 rounded mt-1 shrink-0"></div>
                    <div className="h-4 w-2/3 bg-theme-text-muted/10 dark:bg-white/5 rounded mt-1"></div>
                </div>

                {/* Submit button */}
                <div className="h-14 w-full bg-theme-purple/20 dark:bg-theme-purple/10 rounded-xl mt-4"></div>
            </div>
        </section>
    );
}

export function ReisInfoSkeleton() {
    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-8 animate-pulse">
            {/* Image + Date Card */}
            <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card">
                {/* Image Placeholder */}
                <div className="w-full h-48 sm:h-64 md:h-80 bg-theme-purple/5 dark:bg-white/5 rounded-xl sm:rounded-2xl"></div>

                {/* Date Placeholder */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-theme-white-soft dark:bg-white/5 rounded-xl sm:rounded-2xl border border-theme-purple/5 dark:border-transparent">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-theme-purple/10 flex items-center justify-center flex-shrink-0"></div>
                        <div className="space-y-2 w-32 sm:w-48">
                            <div className="h-3 w-2/3 bg-theme-text-muted/20 rounded"></div>
                            <div className="h-5 w-full bg-theme-purple/10 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Card */}
            <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card">
                <div className="h-6 w-1/3 sm:w-1/4 bg-theme-purple/10 dark:bg-white/5 rounded mb-4 sm:mb-6"></div>
                <div className="space-y-3">
                    <div className="h-4 w-full bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                    <div className="h-4 w-11/12 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                    <div className="h-4 w-4/5 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                    <div className="h-4 w-full bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                    <div className="h-4 w-3/4 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                </div>
            </div>

            {/* Important Info Card */}
            <div className="bg-surface dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-card">
                <div className="h-6 w-1/2 sm:w-1/3 bg-theme-purple/10 dark:bg-white/5 rounded mb-4 sm:mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 sm:gap-4">
                            <div className="w-6 h-6 rounded bg-theme-purple/10 flex-shrink-0"></div>
                            <div className="h-4 w-3/4 sm:w-2/3 bg-theme-text-muted/10 dark:bg-white/5 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ReisPageSkeleton() {
    return (
        <>
            <ReisPageHeaderSkeleton />
            <main className="relative overflow-hidden bg-background">
                <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <ReisFormSkeleton />
                        <ReisInfoSkeleton />
                    </div>
                </div>
            </main>
        </>
    );
}
