import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import IntroManagementIsland from '@/components/islands/admin/IntroManagementIsland';
import { auth } from '@/server/auth/auth';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/actions/user-db.utils';
import {
    getIntroSignups,
    getIntroParentSignups,
    getIntroBlogs,
    getIntroPlanning,
} from '@/server/actions/admin-intro.actions';
import { getIntroSettings } from '@/server/actions/intro.actions';

import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import IntroVisibilityIsland from '@/components/islands/admin/intro/IntroVisibilityIsland';

export const metadata: Metadata = {
    title: 'Intro Beheer | SV Salve Mundi',
};

import { type EnrichedUser } from '@/types/auth';

export default async function BeheerIntroPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) redirect('/login');

    const user = session.user as unknown as EnrichedUser;
    const userCommittees = await fetchUserCommitteesDb(user.id).catch(() => []);
    const permissions = getPermissions(userCommittees || []);

    if (!permissions.canAccessIntro) {
        return (
            <AdminUnauthorized 
                title="Introductie Beheer"
                description="Je hebt geen rechten om de introductie te beheren. Alleen de Introductiecommissie, het Bestuur en ICT hebben deze rechten."
            />
        );
    }

    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const [signups, parents, blogs, planning, settings] = await Promise.all([
        getIntroSignups().catch(() => []),
        getIntroParentSignups().catch(() => []),
        getIntroBlogs().catch(() => []),
        getIntroPlanning().catch(() => []),
        getIntroSettings().catch(() => ({ show: false })),
    ]);

    const introVisible = settings?.show ?? false;

    return (
        <AdminPageShell
            title="Introductie Beheer"
            subtitle="Beheer de introductieweek, inschrijvingen, blogs en draaiboeken."
            backHref="/beheer"
            actions={<IntroVisibilityIsland initialVisible={introVisible} />}
        >
            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <IntroManagementIsland
                    initialSignups={signups}
                    initialParents={parents}
                    initialBlogs={blogs}
                    initialPlanning={planning}
                    initialIntroVisible={introVisible}
                />
            </div>
        </AdminPageShell>
    );
}
