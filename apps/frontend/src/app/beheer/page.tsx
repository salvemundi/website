import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import { 
    DashboardQuickStats, 
    QuickActions, 
    BirthdaysList, 
    TopStickersList, 
    ActivitySignupsList
} from '@/components/ui/admin/dashboard/DashboardSections';
import { 
    StatCardSkeleton, 
    ActionCardSkeleton, 
    ListCardSkeleton, 
    ActivitySignupsSkeleton 
} from '@/components/ui/admin/dashboard/DashboardSkeletons';
import { checkAdminAccess } from '@/server/actions/admin.actions';

export default async function BeheerPage() {
    const { user } = await checkAdminAccess();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
            <PageHeader
                title="Beheer Dashboard"
                description={`Welkom terug, ${user?.first_name || 'Admin'}`}
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* 1. Core Statistics - Legacy "Standard 4" */}
                <Suspense fallback={<StatsRowSkeleton />}>
                    <DashboardQuickStats />
                </Suspense>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Actions & Social */}
                    <div className="lg:col-span-7 space-y-6">
                        <Suspense fallback={<ActionsGridSkeleton />}>
                            <QuickActions />
                        </Suspense>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Suspense fallback={<ListCardSkeleton rows={5} />}>
                                <BirthdaysList />
                            </Suspense>
                            <Suspense fallback={<ListCardSkeleton rows={3} />}>
                                <TopStickersList />
                            </Suspense>
                        </div>
                    </div>

                    {/* Right Column: Activities */}
                    <div className="lg:col-span-5">
                        <Suspense fallback={<ActivitySignupsSkeleton />}>
                            <ActivitySignupsList />
                        </Suspense>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatsRowSkeleton() {
    return (
        <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

function ActionsGridSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-100 dark:border-slate-700">
            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <ActionCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
