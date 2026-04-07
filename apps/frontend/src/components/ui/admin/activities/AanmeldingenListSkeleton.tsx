import { Loader2 } from 'lucide-react';

export default function AanmeldingenListSkeleton() {
    return (
        <div 
            className="container mx-auto px-4 py-8 max-w-7xl animate-pulse"
            aria-busy="true"
            aria-hidden="false"
        >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm border-l-4 border-[var(--beheer-border)] p-6 flex flex-col justify-center h-32">
                        <div className="h-3 w-24 bg-[var(--beheer-border)]/50 rounded mb-3" />
                        <div className="h-8 w-16 bg-[var(--beheer-border)] rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Actions Bar */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm border border-[var(--beheer-border)] p-5 mb-10 flex flex-col sm:flex-row gap-5 items-center" aria-hidden="true">
                <div className="relative flex-1 w-full">
                    <div className="w-full h-12 bg-[var(--bg-main)] rounded-xl border border-[var(--beheer-border)]" />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="flex-1 sm:w-32 h-12 bg-[var(--beheer-border)]/50 rounded-xl" />
                    <div className="flex-1 sm:w-32 h-12 bg-[var(--beheer-border)] rounded-xl" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden relative" aria-hidden="true">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--beheer-border)] bg-[var(--bg-main)] font-black uppercase text-[10px] tracking-widest text-[var(--beheer-text-muted)]">
                                <th className="px-6 py-5"><div className="h-3 w-20 bg-[var(--beheer-border)]/50 rounded" /></th>
                                <th className="px-6 py-5"><div className="h-3 w-20 bg-[var(--beheer-border)]/50 rounded" /></th>
                                <th className="px-6 py-5"><div className="h-3 w-24 bg-[var(--beheer-border)]/50 rounded" /></th>
                                <th className="px-6 py-5 text-right"><div className="h-3 w-12 bg-[var(--beheer-border)]/50 rounded ml-auto" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--beheer-border)]/10">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i}>
                                    <td className="px-6 py-6">
                                        <div className="h-4 w-32 bg-[var(--beheer-border)]/30 rounded mb-2" />
                                        <div className="h-3 w-20 bg-[var(--beheer-border)]/20 rounded" />
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="h-4 w-40 bg-[var(--beheer-border)]/20 rounded mb-2" />
                                        <div className="h-3 w-32 bg-[var(--beheer-border)]/10 rounded" />
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="h-7 w-24 bg-[var(--beheer-border)]/20 rounded-full" />
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="h-8 w-8 bg-[var(--beheer-border)]/30 rounded-xl ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Central spinner */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--beheer-accent)] opacity-20" />
                </div>
            </div>
        </div>
    );
}


