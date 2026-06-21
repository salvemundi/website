import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import IntroManagementIsland from '@/components/islands/admin/IntroManagementIsland';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import { fetchUserCommitteesDb } from '@/server/internal/user-db.utils';
import { safeConsoleError } from '@/server/utils/logger';
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

    let userCommittees: Awaited<ReturnType<typeof fetchUserCommitteesDb>> = [];
    try {
        userCommittees = await fetchUserCommitteesDb(session.user.id);
    } catch (error) {
        safeConsoleError('[page][BeheerIntroPage]', error);
    }

    const permissions = getPermissions(userCommittees);

    if (!permissions.canAccessIntro) {
        return (
            <AdminUnauthorized
                title="Introductie Beheer"
                description="Je hebt geen rechten om de introductie te beheren. Alleen de Introductiecommissie, het Bestuur en ICT hebben deze rechten."
            />
        );
    }

    const [signups, parents, blogs, planning, settings] = await Promise.all([
        getIntroSignups(),
        getIntroParentSignups(),
        getIntroBlogs(),
        getIntroPlanning(),
        getIntroSettings(),
    ]);

    const introVisible = settings.show;

    return (
        <AdminPageShell
            title="Introductie Beheer"
            subtitle="Beheer de introductieweek, inschrijvingen, blogs en draaiboeken."
            backHref="/beheer"
            actions={<IntroVisibilityIsland initialVisible={introVisible} />}
        >
            <IntroManagementIsland
                initialSignups={signups}
                initialParents={parents}
                initialBlogs={blogs}
                initialPlanning={planning}
                initialIntroVisible={introVisible}
            />
        </AdminPageShell>
    );
}
