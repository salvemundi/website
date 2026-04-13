import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AuditLogIsland from '@/components/islands/admin/AuditLogIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

async function checkAuditAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return false;
    
    const user = session.user as any;
    const memberships = user.committees || [];
    return memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kas') || name.includes('kandi');
    });
}

/**
 * AuditLoggingPage: Ultra-PPR Modernization.
 * Wrapped in AdminPageShell for instant header rendering.
 * Uses Zero-Drift masking via AuditLogIsland.
 */
export default async function AuditLoggingPage() {
    const hasAccess = await checkAuditAccess();

    if (!hasAccess) {
        redirect('/beheer');
    }

    return (
        <AdminPageShell
            title="Audit & Logboek"
            subtitle="Monitor systeemwijzigingen en beheerdersacties in real-time."
            backHref="/beheer"
        >
            <Suspense fallback={<AuditLogIsland />}>
                <AuditLogIsland />
            </Suspense>
        </AdminPageShell>
    );
}
