import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkAdminAccess } from '@/server/actions/admin.actions';
import { getMailSettings } from '@/server/actions/admin-mail.actions';
import MailManagementIsland from '@/components/islands/admin/MailManagementIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata: Metadata = {
    title: 'E-mail Beheer | SV Salve Mundi',
};

/**
 * BeheerMailPage: Zero-Drift Modernization.
 * Migrated to AdminPageShell for consistent sidebar/toolbar rendering.
 * Uses MailManagementIsland with masked fallback to prevent layout shift during settings fetch.
 */
export default async function BeheerMailPage() {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) redirect('/login');

    return (
        <AdminPageShell
            title="E-mail Beheer"
            subtitle="Beheer alle automatische e-mail flows en notificaties"
            backHref="/beheer"
        >
            <Suspense fallback={<MailManagementIsland isLoading={true} />}>
                <MailDataLoader />
            </Suspense>
        </AdminPageShell>
    );
}

async function MailDataLoader() {
    const settingsRes = await getMailSettings();
    const initialSettings = settingsRes.success ? settingsRes.settings || [] : [];
    return <MailManagementIsland initialSettings={initialSettings} />;
}
