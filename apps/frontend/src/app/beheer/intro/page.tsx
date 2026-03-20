import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import PageHeader from '@/components/ui/layout/PageHeader';
import IntroManagementIsland from '@/components/islands/admin/IntroManagementIsland';
import { auth } from '@/server/auth/auth';
import {
    getIntroSignups,
    getIntroParentSignups,
    getIntroBlogs,
    getIntroPlanning,
} from '@/server/actions/admin-intro.actions';
import { getIntroSettings } from '@/server/actions/intro.actions';

export const metadata: Metadata = {
    title: 'Intro Beheer | SV Salve Mundi',
};

export default async function BeheerIntroPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    const [signups, parents, blogs, planning, settings] = await Promise.all([
        getIntroSignups().catch(() => []),
        getIntroParentSignups().catch(() => []),
        getIntroBlogs().catch(() => []),
        getIntroPlanning().catch(() => []),
        getIntroSettings().catch(() => ({ show: false })),
    ]);

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader
                title="Intro Beheer"
                description="Beheer aanmeldingen, ouders, blogs en de introweek-planning."
                backLink="/beheer"
            />
            <Suspense fallback={<IntroPageLoader />}>
                <IntroManagementIsland
                    initialSignups={signups}
                    initialParents={parents}
                    initialBlogs={blogs}
                    initialPlanning={planning}
                    initialIntroVisible={settings.show ?? false}
                />
            </Suspense>
        </div>
    );
}

function IntroPageLoader() {
    return (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--theme-purple)]/20 border-t-[var(--theme-purple)] mb-4" />
            <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Intro laden...</p>
        </div>
    );
}
