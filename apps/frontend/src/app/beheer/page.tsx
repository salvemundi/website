import GlobalError from '@/components/ui/layout/GlobalError';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { 
    DashboardHub, 
    BirthdaysList, 
    TopStickersList, 
    ActivitySignupsList
} from '@/components/ui/admin/dashboard/DashboardSections';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { 
    getDashboardPermissions,
    getDashboardStats,
    getUpcomingBirthdays,
    getRecentActivities,
    getTopStickers
} from '@/server/actions/public/dashboard.actions';
import { COMMITTEES } from '@/shared/lib/permissions-config';

export const metadata = {
    title: 'Beheer Dashboard | SV Salve Mundi' };

export default async function BeheerPage() {
    const access = await checkAdminAccess().catch(() => null);
    if (!access || !access.user || !access.isAuthorized) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <GlobalError 
                    error={new Error("Geen toegang")} 
                    reset={() => {}} 
                    title="Beheerderspaneel Fout" 
                />
            </div>
        );
    }

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
    
    const allPermissions = [
        permissions.includes('intro'),
        permissions.includes('reis'),
        permissions.includes('logging'),
        permissions.includes('sync'),
        permissions.includes('coupons'),
        permissions.includes('stickers'),
        permissions.includes('kroegentocht'),
        permissions.includes('cobo'),
        permissions.includes('webshop'),
        permissions.includes('vacatures')
    ];
    const visibleCount = allPermissions.filter(Boolean).length;
    const isLimitedAccess = visibleCount <= 2;

    const isIct = permissions.includes('ict');
    const isBestuur = access.user.committees.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    const hideStickers = isIct || isBestuur;

    return (
        <AdminPageShell
            title="Beheer Dashboard"
            subtitle={`Welkom terug, ${access.user.first_name || 'Admin'}.`}
            centered={true}
            hideToolbar={true}
        >
            <div className="admin-container py-4 md:py-8">
                <div className={`grid grid-cols-1 ${isLimitedAccess ? 'mx-auto max-w-5xl lg:grid-cols-1' : 'lg:grid-cols-12'} items-start gap-8 md:gap-12`}>
                        
                        <div className={isLimitedAccess ? 'w-full space-y-12' : 'space-y-12 lg:col-span-8'}>
                            <DashboardHub permissions={permissions} stats={stats} />
    
                            {!isLimitedAccess && !hideStickers && (
                                <div className="hidden border-t border-border-color pt-12 opacity-60 transition-opacity hover:opacity-100 md:block">
                                    <TopStickersList data={stickers} />
                                </div>
                            )}
                        </div>
    
                        <div className={isLimitedAccess ? 'grid w-full grid-cols-1 gap-6 border-t border-border-color pt-12 md:grid-cols-2' : 'space-y-8 lg:col-span-4'}>
                            <div className="space-y-6">
                                <ActivitySignupsList data={activities} />
                            </div>
                            
                            <div className="space-y-6">
                                <BirthdaysList data={birthdays} />
                                {isLimitedAccess && !hideStickers && (
                                    <div className="opacity-60 md:hidden">
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
