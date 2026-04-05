import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { checkAdminAccess } from '@/server/actions/admin.actions';
import { getMailSettings } from '@/server/actions/admin-mail.actions';
import MailManagementIsland from '@/components/islands/admin/MailManagementIsland';

export const metadata: Metadata = {
    title: 'E-mail Beheer | SV Salve Mundi',
};

export default async function BeheerMailPage() {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) redirect('/login');

    const settingsRes = await getMailSettings();
    const initialSettings = settingsRes.success ? settingsRes.settings || [] : [];

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<MailPageLoader />}>
                <MailManagementIsland initialSettings={initialSettings} />
            </Suspense>
        </main>
    );
}

function MailPageLoader() {
    return (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--beheer-accent)]/20 border-t-[var(--beheer-accent)] mb-4" />
            <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px]">Mail instellingen laden...</p>
        </div>
    );
}
