import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import GlobalError from '@/components/ui/layout/GlobalError';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { 
    DashboardHub, 
    BirthdaysList, 
    TopStickersList, 
    ActivitySignupsList
} from '@/components/ui/admin/dashboard/DashboardSections';
import { 
    checkAdminAccess, 
    getDashboardPermissions,
    getDashboardStats,
    getUpcomingBirthdays,
    getRecentActivities,
    getTopStickers
} from '@/server/actions/admin.actions';

export const metadata = {
    title: 'Beheer Dashboard | SV Salve Mundi',
};

export default async function BeheerPage() {
    // NUCLEAR SSR: All access and permission checks must happen before flushing the shell
    const access = await checkAdminAccess().catch(() => null);
    if (!access || !access.user || !access.isAuthorized) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <GlobalError 
                    error={{ message: "Geen toegang" } as any} 
                    reset={() => {}} 
                    title="Beheerderspaneel Fout" 
                />
            </div>
        );
    }

    // Fetch all dashboard data concurrently
    const [
        permissions,
        stats,
        birthdays,
        activities,
        stickers
    ] = await Promise.all([
        getDashboardPermissions(),
        getDashboardStats(),
        getUpcomingBirthdays(),
        getRecentActivities(),
        getTopStickers()
    ]);
    
    // Permission-aware dashboard layout
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
    const isLimitedAccess = visibleCount <= 2;

    return (
        <AdminPageShell
            title="Beheer Dashboard"
            subtitle={`Welkom terug, ${access.user?.first_name || 'Admin'}. Beheer de vereniging vanaf één plek.`}
        >
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className={`grid grid-cols-1 ${isLimitedAccess ? 'lg:grid-cols-1 max-w-5xl mx-auto' : 'lg:grid-cols-12'} gap-8 md:gap-12 items-start`}>
                    
                    <div className={isLimitedAccess ? 'w-full space-y-12' : 'lg:col-span-8 space-y-12'}>
                        <DashboardHub permissions={permissions} stats={stats} />

                        {!isLimitedAccess && (
                            <div className="pt-12 border-t border-[var(--beheer-border)] opacity-60 hover:opacity-100 transition-opacity hidden md:block">
                                <TopStickersList data={stickers} />
                            </div>
                        )}
                    </div>

                    <div className={isLimitedAccess ? 'w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-[var(--beheer-border)]' : 'lg:col-span-4 space-y-8'}>
                        <div className="space-y-6">
                            <ActivitySignupsList data={activities} />
                        </div>
                        
                        <div className="space-y-6">
                            <BirthdaysList data={birthdays} />
                            {isLimitedAccess && (
                                <div className="md:hidden opacity-60">
                                    <TopStickersList data={stickers} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminPageShell>
    );
}
