import { CreditCard } from 'lucide-react';

export const TransactionsSkeleton: React.FC = () => {
    return (
        <div className="animate-pulse">
            <section className="relative overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg p-6 sm:p-8">
                <header className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-2xl bg-[var(--color-purple-100)] p-2.5">
                            <CreditCard className="h-5 w-5 text-transparent opacity-50" />
                        </div>
                        <div className="h-8 w-48 rounded bg-[var(--color-purple-100)]" />
                    </div>
                    <div className="h-10 w-32 rounded-xl bg-[var(--color-purple-100)]" />
                </header>
                
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                    <div className="mt-4 h-4 w-32 rounded bg-[var(--color-purple-100)]" />
                </div>
            </section>
        </div>
    );
};
