import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Beer, Users, Loader2 } from 'lucide-react';
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
        <main className="min-h-screen bg-[var(--bg-main)]">
            {/* Page Header Area - Replicated from Kroegentocht for premium consistency */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                <div className="container mx-auto px-4 py-16 max-w-7xl">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="h-14 w-14 rounded-[var(--radius-2xl)] bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] flex items-center justify-center shadow-2xl shadow-[var(--theme-purple)]/10 animate-pulse">
                            <Users className="h-8 w-8" />
                        </div>
                        <h1 className="text-5xl font-black text-[var(--text-main)] tracking-widest uppercase">
                            Intro<span className="text-[var(--theme-purple)]">ductie</span>
                        </h1>
                    </div>
                    <p className="text-[var(--text-subtle)] text-xl max-w-3xl leading-relaxed font-medium">
                        Beheer aanmeldingen, ouders, blogs en de introweek-planning.
                    </p>
                </div>
            </div>
            <Suspense fallback={<IntroPageLoader />}>
                <IntroManagementIsland
                    initialSignups={signups}
                    initialParents={parents}
                    initialBlogs={blogs}
                    initialPlanning={planning}
                    initialIntroVisible={settings.show ?? false}
                />
            </Suspense>
        </main>
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
