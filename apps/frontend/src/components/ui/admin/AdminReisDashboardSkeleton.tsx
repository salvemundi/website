import { Loader2 } from 'lucide-react';

export default function AdminReisDashboardSkeleton() {
    return (
        <>
            {/* Statistics Skeleton - Dimension perfect to the cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-admin-card rounded-lg shadow p-4 sm:p-6 border-l-4 border-admin/20 animate-pulse">
                        <div className="flex items-center justify-between">
                            <div className="w-full">
                                <div className="h-4 bg-admin/50 rounded w-1/2 mb-2"></div>
                                <div className="h-8 bg-admin/50 rounded w-1/3"></div>
                            </div>
                            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-admin/50 rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Skeleton - Dimension perfect matching the real search bars */}
            <div className="bg-admin-card rounded-lg shadow p-4 sm:p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
                    <div className="md:col-span-2">
                        <div className="w-full h-[42px] bg-admin-hover rounded-lg"></div>
                    </div>
                    <div>
                        <div className="w-full h-[42px] bg-admin-hover rounded-lg"></div>
                    </div>
                    <div>
                        <div className="w-full h-[42px] bg-admin-hover rounded-lg"></div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-4 animate-pulse">
                    <div className="h-[42px] w-full sm:w-40 bg-admin-hover rounded-lg"></div>
                    <div className="h-[42px] w-full sm:w-40 bg-admin-hover rounded-lg"></div>
                </div>
            </div>

            {/* Table Skeleton - Strict "No Layout Shift" Action Buttons */}
            <div className="bg-admin-card rounded-lg shadow overflow-hidden animate-pulse">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-admin-card-soft border-b border-admin">
                            <tr>
                                <th className="px-3 sm:px-6 py-3 text-left">
                                    <div className="h-3 sm:h-4 w-16 bg-admin/50 rounded"></div>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left hidden sm:table-cell">
                                    <div className="h-3 sm:h-4 w-24 bg-admin/50 rounded"></div>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left hidden md:table-cell">
                                    <div className="h-3 sm:h-4 w-12 bg-admin/50 rounded"></div>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left">
                                    <div className="h-3 sm:h-4 w-16 bg-admin/50 rounded"></div>
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left hidden sm:table-cell">
                                    <div className="h-3 sm:h-4 w-24 bg-admin/50 rounded"></div>
                                </th>
                                <th className="px-2 sm:px-6 py-3 text-right">
                                    <div className="h-3 sm:h-4 w-12 bg-admin/50 rounded ml-auto"></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-admin-card divide-y divide-admin">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div className="h-4 bg-admin/50 rounded w-1/2 mb-1"></div>
                                        <div className="h-3 bg-admin/50 rounded w-1/3"></div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                        <div className="h-4 bg-admin/50 rounded w-20"></div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                                        <div className="h-5 bg-admin/50 rounded-full w-16"></div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                        <div className="h-6 sm:h-7 bg-admin/50 rounded-full w-full sm:w-24"></div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                        <div className="h-6 sm:h-7 bg-admin/50 rounded-full w-28"></div>
                                    </td>
                                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-right">
                                        <div className="flex justify-end gap-1 sm:gap-2">
                                            {/* Action button skeletons perfectly mimicking the icons' dimensions to prevent layout shift */}
                                            <div className="h-6 w-6 sm:h-7 sm:w-7 bg-admin/20 rounded-full flex items-center justify-center">
                                                <div className="h-4 w-4 sm:h-5 sm:w-5 bg-admin/30 rounded-full"></div>
                                            </div>
                                            <div className="h-6 w-6 sm:h-7 sm:w-7 bg-admin/20 rounded-full flex items-center justify-center">
                                                <div className="h-4 w-4 sm:h-5 sm:w-5 bg-admin/30 rounded-full"></div>
                                            </div>
                                            <div className="h-6 w-6 sm:h-7 sm:w-7 bg-admin/20 rounded-full flex items-center justify-center">
                                                <div className="h-3 w-3 sm:h-4 sm:w-4 bg-admin/30 rounded-full"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Central spinner indicating data fetch */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Loader2 className="h-8 w-8 animate-spin text-theme-purple opacity-50" />
                </div>
            </div>
        </>
    );
}
