import type { Metadata } from 'next';
import IntroManagementIsland from '@/components/islands/admin/IntroManagementIsland';
import {
    getIntroSignups,
    getIntroParentSignups,
    getIntroBlogs,
    getIntroPlanning
} from '@/server/actions/admin/intro/admin-intro-core.actions';
import { getIntroSettings } from '@/server/actions/public/intro.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import IntroVisibilityIsland from '@/components/islands/admin/intro/IntroVisibilityIsland';

export const metadata: Metadata = {
    title: 'Intro Beheer | SV Salve Mundi'
};

export default async function BeheerIntroPage() {
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
