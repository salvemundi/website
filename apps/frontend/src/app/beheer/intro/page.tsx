import type { Metadata } from 'next';
import { QrCode } from 'lucide-react';
import IntroManagementIsland from '@/components/islands/admin/IntroManagementIsland';
import {
    getIntroSignups,
    getIntroParentSignups,
    getIntroBlogs,
    getIntroPlanning,
    getIntroConfidants,
    getIntroPlanningImage,
    getIntroInfoBooklet,
    getIntroQrScanCount
} from '@/server/actions/admin/intro/admin-intro-core.actions';
import { getIntroSettings } from '@/server/actions/public/intro.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import IntroVisibilityIsland from '@/components/islands/admin/intro/IntroVisibilityIsland';

export const metadata: Metadata = {
    title: 'Intro Beheer | SV Salve Mundi'
};

export default async function BeheerIntroPage() {
    const [signups, parents, blogs, planning, confidants, settings, planningImage, infoBooklet, qrScanCount] = await Promise.all([
        getIntroSignups(),
        getIntroParentSignups(),
        getIntroBlogs(),
        getIntroPlanning(),
        getIntroConfidants(),
        getIntroSettings(),
        getIntroPlanningImage(),
        getIntroInfoBooklet(),
        getIntroQrScanCount(),
    ]);

    const introVisible = settings.show;

    return (
        <AdminPageShell
            title="Introductie Beheer"
            backHref="/beheer"
            actions={
                <>
                    <div className="flex items-center gap-3 px-4 py-2 bg-bg-card border border-border-color rounded-3xl shadow-sm">
                        <QrCode className="h-4 w-4 text-theme-purple" />
                        <span className="text-base font-semibold text-text-muted">
                            {qrScanCount.toLocaleString('nl-NL')} scans
                        </span>
                    </div>
                    <IntroVisibilityIsland initialVisible={introVisible} />
                </>
            }
        >
            <IntroManagementIsland
                initialSignups={signups}
                initialParents={parents}
                initialBlogs={blogs}
                initialPlanning={planning}
                initialConfidants={confidants}
                initialIntroVisible={introVisible}
                initialPlanningImage={planningImage}
                initialInfoBooklet={infoBooklet}
            />
        </AdminPageShell>
    );
}
