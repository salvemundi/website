import { Suspense } from 'react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { 
    DashboardHub, 
    BirthdaysList, 
    TopStickersList, 
    ActivitySignupsList
} from '@/components/ui/admin/dashboard/DashboardSections';
import { checkAdminAccess, getDashboardPermissions } from '@/server/actions/admin.actions';

export default async function BeheerPage() {
    const { user } = await checkAdminAccess();
    const permissions = await getDashboardPermissions();
    
    // Detecteer beperkte rechten voor layout optimalisatie
    const allPermissions = [
        permissions.canAccessIntro,
        permissions.canAccessReis,
        permissions.canAccessLogging,
        permissions.canAccessSync,
        permissions.canAccessCoupons,
        permissions.canAccessStickers,
        permissions.canAccessPermissions,
        permissions.isIct
    ];
    const visibleCount = allPermissions.filter(Boolean).length;
    const isLimitedAccess = visibleCount <= 2; // Bijv. alleen Intro of alleen Activiteiten

    return (
        <main className="min-h-screen bg-[var(--bg-main)] pb-24">
            <AdminToolbar 
                title="Beheer Dashboard" 
                subtitle={`Welkom terug, ${user?.first_name || 'Admin'}. Beheer de vereniging en evenementen vanaf één plek.`}
            />

            <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={`grid grid-cols-1 ${isLimitedAccess ? 'lg:grid-cols-1 max-w-5xl mx-auto' : 'lg:grid-cols-12'} gap-8 md:gap-12 items-start`}>
                    
                    {/* Main Hub: Navigation & Key Stats */}
                    <div className={isLimitedAccess ? 'w-full space-y-12' : 'lg:col-span-8 space-y-12'}>
                        <Suspense fallback={<DashboardHub isLoading />}>
                            <DashboardHub />
                        </Suspense>

                        {!isLimitedAccess && (
                            <div className="pt-12 border-t border-[var(--beheer-border)] opacity-60 hover:opacity-100 transition-opacity hidden md:block">
                                <Suspense fallback={<TopStickersList isLoading />}>
                                    <TopStickersList />
                                </Suspense>
                            </div>
                        )}
                    </div>
{/* ... remainder of layout unchanged */}

                    {/* Side Sidebar: Real-time activities & birthdays */}
                    <div className={isLimitedAccess ? 'w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-[var(--beheer-border)]' : 'lg:col-span-4 space-y-8'}>
                        <div className="space-y-6">
                            <Suspense fallback={<ActivitySignupsList isLoading />}>
                                <ActivitySignupsList />
                            </Suspense>
                        </div>
                        
                        <div className="space-y-6">
                            <Suspense fallback={<BirthdaysList isLoading />}>
                                <BirthdaysList />
                            </Suspense>

                            {isLimitedAccess && (
                                <div className="md:hidden opacity-60">
                                    <Suspense fallback={<TopStickersList isLoading />}>
                                        <TopStickersList />
                                    </Suspense>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}


// Note: All separate skeleton components were removed in favor of integrated isLoading props on Dashboard sections.


