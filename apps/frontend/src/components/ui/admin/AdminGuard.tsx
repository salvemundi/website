import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { checkFeatureAccess } from '@/shared/lib/permissions';
import type { AdminFeature } from '@/shared/lib/permissions-config';
import type { ReactNode } from 'react';

interface AdminGuardProps {
    children: ReactNode;
    feature: AdminFeature;
    title: string;
    description: string;
}

export default async function AdminGuard({
    children,
    feature,
    title,
    description
}: AdminGuardProps) {
    const accessData = await checkAdminAccess();

    if (!accessData.user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized title={title} description={description} />
            </div>
        );
    }

    const committeesList = accessData.user.committees;
    const { hasAccess } = checkFeatureAccess(committeesList, feature);

    if (!hasAccess) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized title={title} description={description} />
            </div>
        );
    }

    return <>{children}</>;
}