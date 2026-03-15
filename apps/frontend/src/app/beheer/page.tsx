import { Suspense } from 'react';
import { getDashboardStats, getUpcomingBirthdays } from '@/server/actions/admin.actions';
import AdminDashboardIsland from '@/components/islands/admin/AdminDashboardIsland';

export default async function BeheerPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Suspense fallback={<DashboardSkeleton />}>
                    <DashboardContent />
                </Suspense>
            </div>
        </div>
    );
}

async function DashboardContent() {
    const [stats, birthdays] = await Promise.all([
        getDashboardStats().catch(() => ({ totalMembers: 0, totalSignups: 0, upcomingEvents: 0 })),
        getUpcomingBirthdays().catch(() => [])
    ]);

    return (
        <AdminDashboardIsland 
            stats={stats} 
            birthdays={birthdays} 
        />
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"></div>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    <div className="h-64 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"></div>
                </div>
            </div>
        </div>
    );
}
