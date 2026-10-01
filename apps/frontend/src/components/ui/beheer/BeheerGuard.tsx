'use server';

import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';
import BeheerUnauthorized from '@/components/ui/beheer/BeheerUnauthorized';
import { checkFeatureAccess } from '@/shared/lib/permissions';
import type { BeheerFeature } from '@/shared/lib/permissions-config';
import type { ReactNode } from 'react';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { GuardAccessClientProvider } from './BeheerGuardClient';

interface AdminGuardProps {
    children: ReactNode;
    feature: BeheerFeature;
    title: string;
    description: string;
}

export default async function BeheerGuard({
    children,
    feature,
    title,
    description
}: AdminGuardProps) {
    const accessData = await checkBeheerAccess();

    if (!accessData.user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <BeheerUnauthorized title={title} description={description} />
            </div>
        );
    }

    const committeesList = accessData.user.committees;
    const { hasAccess, isLeader } = checkFeatureAccess(committeesList, feature);

    if (!hasAccess) {
        return (
            <div className="container mx-auto px-4 py-8">
                <BeheerUnauthorized title={title} description={description} />
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