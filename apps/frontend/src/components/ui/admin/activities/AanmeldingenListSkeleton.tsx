import { Search, Download, UserPlus } from 'lucide-react';

export default function AanmeldingenListSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-pulse">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-6 flex flex-col justify-center h-32">
                        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded mb-3" />
                        <div className="h-10 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Actions Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 p-4 mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 bg-slate-100 dark:bg-slate-700 rounded" />
                    <div className="w-full h-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700" />
                </div>
                <div className="flex gap-3">
                    <div className="w-32 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                    <div className="w-32 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 font-bold">
                                <th className="px-6 py-4 h-12 w-1/4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded" /></th>
                                <th className="px-6 py-4 h-12 w-1/4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded" /></th>
                                <th className="px-6 py-4 h-12 w-1/4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-700 rounded" /></th>
                                <th className="px-6 py-4 h-12 text-right"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-700 rounded ml-auto" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}>
                                    <td className="px-6 py-6">
                                        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-700 rounded mb-2" />
                                        <div className="h-3 w-20 bg-slate-50 dark:bg-slate-800 rounded" />
                                    </td>
                                    <td className="px-6 py-6 font-medium">
                                        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-700 rounded mb-2" />
                                        <div className="h-4 w-32 bg-slate-50 dark:bg-slate-800 rounded" />
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="h-6 w-20 bg-slate-100 dark:bg-slate-700 rounded-full mb-2" />
                                        <div className="h-3 w-24 bg-slate-50 dark:bg-slate-800 rounded" />
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="h-8 w-8 bg-slate-100 dark:bg-slate-700 rounded-lg ml-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
