'use server';

import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { checkFeatureAccess } from '@/shared/lib/permissions';
import type { AdminFeature } from '@/shared/lib/permissions-config';
import type { ReactNode } from 'react';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { GuardAccessClientProvider } from './AdminGuardClient';

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
    const { hasAccess, isLeader } = checkFeatureAccess(committeesList, feature);

    if (!hasAccess) {
        return (
            <div className="container mx-auto px-4 py-8">
                <AdminUnauthorized title={title} description={description} />
            </div>
        );
    }

    const isIctOrBestuur = committeesList.some(
        c => c.azure_group_id === COMMITTEES.ICT || c.azure_group_id === COMMITTEES.BESTUUR
    );

    const canToggleVisibility = isLeader || isIctOrBestuur;

    return (
        <GuardAccessClientProvider canToggleVisibility={canToggleVisibility}>
            {children}
        </GuardAccessClientProvider>
    );
}