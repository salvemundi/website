import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import IntroManagementIsland from '@/components/islands/admin/IntroManagementIsland';
import { auth } from '@/server/auth/auth';
import {
    getIntroSignups,
    getIntroParentSignups,
    getIntroBlogs,
    getIntroPlanning,
} from '@/server/actions/admin-intro.actions';
import { getIntroSettings } from '@/server/actions/intro.actions';

import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata: Metadata = {
    title: 'Intro Beheer | SV Salve Mundi',
};

export default async function BeheerIntroPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const [signups, parents, blogs, planning, settings] = await Promise.all([
        getIntroSignups().catch(() => []),
        getIntroParentSignups().catch(() => []),
        getIntroBlogs().catch(() => []),
        getIntroPlanning().catch(() => []),
        getIntroSettings().catch(() => ({ show: false })),
    ]);

    return (
        <AdminPageShell
            title="Introductie Beheer"
            subtitle="Beheer de introductieweek, inschrijvingen, blogs en draaiboeken."
            backHref="/beheer"
        >
            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <IntroManagementIsland
                    initialSignups={signups}
                    initialParents={parents}
                    initialBlogs={blogs}
                    initialPlanning={planning}
                    initialIntroVisible={settings?.show ?? false}
                />
            </div>
        </AdminPageShell>
    );
}
