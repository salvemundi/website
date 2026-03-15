import { Loader2 } from 'lucide-react';

export function ReisPageHeaderSkeleton() {
    return (
        <div className="flex flex-col w-full">
            <div className="w-full min-h-[400px] sm:min-h-[450px] md:min-h-[500px] bg-[var(--color-purple-500)]/5 flex flex-col items-center justify-center relative overflow-hidden py-20 px-4">
                <div className="max-w-app mx-auto text-center opacity-30 animate-pulse">
                    <h1 className="text-4xl font-black text-[var(--theme-purple)] dark:text-white sm:text-5xl md:text-6xl mb-6">
                        SALVE MUNDI REIS
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg font-medium text-[var(--theme-purple)] dark:text-white drop-shadow-sm sm:text-xl">
                        Schrijf je in voor de jaarlijkse reis van Salve Mundi! Een onvergetelijke ervaring vol gezelligheid en avontuur.
                    </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--bg-main)] to-transparent" />
            </div>
        </div>
    );
}

export function ReisFormSkeleton() {
    return (
        <section className="w-full lg:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-[2rem] shadow-xl p-5 sm:p-6 md:p-8 animate-pulse">
            {/* Title Space */}
            <div className="h-10 w-3/4 sm:w-1/2 bg-[var(--color-purple-500)]/10 rounded-lg mb-8"></div>

            {/* Form Fields Simulation */}
            <div className="flex flex-col gap-5">
                <div className="h-5 w-full bg-[var(--bg-soft)] rounded opacity-60"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="h-4 w-1/4 bg-[var(--bg-soft)] rounded opacity-50"></div>
                        <div className="h-12 w-full bg-[var(--bg-soft)] border border-[var(--border-color)]/20 rounded-xl"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 w-1/4 bg-[var(--bg-soft)] rounded opacity-50"></div>
                        <div className="h-12 w-full bg-[var(--bg-soft)] border border-[var(--border-color)]/20 rounded-xl"></div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="h-4 w-1/4 bg-[var(--bg-soft)] rounded opacity-50"></div>
                    <div className="h-12 w-full bg-[var(--bg-soft)] border border-[var(--border-color)]/20 rounded-xl"></div>
                </div>

                <div className="space-y-3">
                    <div className="h-4 w-1/4 bg-[var(--bg-soft)] rounded opacity-50"></div>
                    <div className="h-12 w-full bg-[var(--bg-soft)] border border-[var(--border-color)]/20 rounded-xl"></div>
                </div>

                {/* Submit button */}
                <div className="h-14 w-full bg-[var(--color-purple-500)]/20 rounded-xl mt-6"></div>
            </div>
        </section>
    );
}

export function ReisInfoSkeleton() {
    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-8 animate-pulse">
            {/* Image + Date Card */}
            <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-xl">
                {/* Image Placeholder */}
                <div className="w-full h-48 sm:h-64 md:h-80 bg-[var(--bg-soft)] rounded-xl sm:rounded-2xl opacity-20"></div>

                {/* Date Placeholder */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-[var(--bg-soft)] rounded-xl sm:rounded-2xl border border-[var(--border-color)]/10">
                    <div className="flex items-center gap-3 sm:gap-4 w-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--color-purple-500)]/10 flex-shrink-0"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-24 bg-[var(--bg-soft)] rounded opacity-40"></div>
                            <div className="h-5 w-full max-w-[200px] bg-[var(--color-purple-500)]/10 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Card */}
            <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 shadow-xl">
                <div className="h-8 w-1/3 sm:w-1/4 bg-[var(--color-purple-500)]/10 rounded mb-6"></div>
                <div className="space-y-4">
                    <div className="h-4 w-full bg-[var(--bg-soft)] rounded opacity-40"></div>
                    <div className="h-4 w-11/12 bg-[var(--bg-soft)] rounded opacity-40"></div>
                    <div className="h-4 w-4/5 bg-[var(--bg-soft)] rounded opacity-40"></div>
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
