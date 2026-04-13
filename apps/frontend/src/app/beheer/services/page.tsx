'use client';

import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import ServicesStatusIsland from '@/components/islands/admin/ServicesStatusIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

/**
 * ServicesStatusPage: Zero-Drift Modernization.
 * Migrated to AdminPageShell for consistent sidebar/toolbar rendering.
 * Uses ServicesStatusIsland with masked fallback to prevent layout shift during status checks.
 */
export default function ServicesStatusPage() {
    const { data: session, isPending } = authClient.useSession();

    if (isPending) {
        return (
            <AdminPageShell 
                title="System Status"
                subtitle="Real-time status van alle Salve Mundi backend services"
                backHref="/beheer"
            >
                <ServicesStatusIsland isLoading={true} />
            </AdminPageShell>
        );
    }
    
    if (!session || !session.user) {
        redirect('/beheer');
    }
    
    const user = session.user as any;
    const memberships = user.committees || [];
    
    const hasAccess = memberships.some((c: any) => 
        c.id === COMMITTEES.ICT || c.id === COMMITTEES.BESTUUR
    );

    if (!hasAccess) {
        redirect('/beheer');
    }

    return (
        <AdminPageShell 
            title="System Status"
            subtitle="Real-time status van alle Salve Mundi backend services"
            backHref="/beheer"
        >
            <Suspense fallback={<ServicesStatusIsland isLoading={true} />}>
                <ServicesStatusIsland />
            </Suspense>
        </AdminPageShell>
    );
}
