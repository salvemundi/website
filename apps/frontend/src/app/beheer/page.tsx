import { Suspense } from 'react';
import { Settings } from 'lucide-react';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
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
        <main className="min-h-screen bg-[var(--bg-main)]">
            <AnimatedBeheerHeader 
                title="Beheer Dashboard" 
                subtitle={`Welkom terug, ${user?.first_name || 'Admin'}. Beheer de vereniging en evenementen vanaf één plek.`}
                icon={<Settings className="h-8 w-8" />}
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
        </main>
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
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-lg p-6 border border-[var(--beheer-border)] animate-pulse">
            <div className="h-6 w-32 bg-[var(--beheer-border)]/50 rounded mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <ActionCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
