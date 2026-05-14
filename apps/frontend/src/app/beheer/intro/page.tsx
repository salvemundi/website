import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import IntroManagementIsland from '@/components/islands/admin/IntroManagementIsland';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/internal/user-db.utils';
import {
    getIntroSignups,
    getIntroParentSignups,
    getIntroBlogs,
    getIntroPlanning
} from '@/server/actions/admin/admin-intro.actions';
import { getIntroSettings } from '@/server/actions/public/intro.actions';

import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import IntroVisibilityIsland from '@/components/islands/admin/intro/IntroVisibilityIsland';

export const metadata: Metadata = {
    title: 'Intro Beheer | SV Salve Mundi'
};


export default async function BeheerIntroPage() {
    const session = await getEnrichedSession();

    if (!session?.user) redirect('/?needLogin=true');

    const userCommittees = await fetchUserCommitteesDb(session.user.id).catch(() => []);
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
        getIntroSignups(),
        getIntroParentSignups(),
        getIntroBlogs(),
        getIntroPlanning(),
        getIntroSettings(),
    ]);

    const introVisible = settings?.show ?? false;

    return (
        <AdminPageShell
            title="Introductie Beheer"
            subtitle="Beheer de introductieweek, inschrijvingen, blogs en draaiboeken."
            backHref="/beheer"
            actions={<IntroVisibilityIsland initialVisible={introVisible} />}
        >
            <div className="container mx-auto px-4 py-8 max-w-7xl">
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
