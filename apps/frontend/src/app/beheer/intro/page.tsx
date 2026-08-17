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
    getIntroQrScanCount,
    getIntroGroupsForAdmin,
    getApprovedOudersForPicker,
    getIntroSignupSettings
} from '@/server/actions/admin/intro/admin-intro-core.actions';
import { getIntroSettings } from '@/server/actions/public/intro.actions';
import { getIntroAttendanceVisible } from '@/server/actions/public/intro-attendance.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import IntroVisibilityIsland from '@/components/islands/admin/intro/IntroVisibilityIsland';
import IntroAttendanceVisibilityIsland from '@/components/islands/admin/intro/IntroAttendanceVisibilityIsland';



export const metadata: Metadata = {
    title: 'Intro Beheer | SV Salve Mundi'
};

export default async function BeheerIntroPage() {
    const [signups, parents, blogs, planning, confidants, settings, planningImage, infoBooklet, qrScanCount, groups, approvedOuders, attendanceVisible, signupSettings] = await Promise.all([
        getIntroSignups(),
        getIntroParentSignups(),
        getIntroBlogs(),
        getIntroPlanning(),
        getIntroConfidants(),
        getIntroSettings(),
        getIntroPlanningImage(),
        getIntroInfoBooklet(),
        getIntroQrScanCount(),
        getIntroGroupsForAdmin(),
        getApprovedOudersForPicker(),
        getIntroAttendanceVisible(),
        getIntroSignupSettings(),
    ]);

    const introVisible = settings.show;

    return (
        <AdminPageShell
            title="Introductie Beheer"
            backHref="/beheer"
            titleBadge={
                <div className="flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-bg-card border border-border-color rounded-full sm:rounded-3xl shadow-sm">
                    <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-theme-purple" />
                    <span className="text-[11px] sm:text-base font-semibold text-text-muted whitespace-nowrap">
                        {qrScanCount.toLocaleString('nl-NL')} scans
                    </span>
                </div>
            }
            actions={
                <>
                    <IntroVisibilityIsland initialVisible={introVisible} />
                    <IntroAttendanceVisibilityIsland initialVisible={attendanceVisible} />
                </>
            }
        >
            <IntroManagementIsland
                initialSignups={signups}
                initialParents={parents}
                initialBlogs={blogs}
                initialPlanning={planning}
                initialConfidants={confidants}
                initialGroups={groups}
                initialApprovedOuders={approvedOuders}
                initialIntroVisible={introVisible}
                initialPlanningImage={planningImage}
                initialInfoBooklet={infoBooklet}
                initialStudentSignupsOpen={signupSettings.student_signups_open}
                initialParentSignupsOpen={signupSettings.parent_signups_open}
            />
        </AdminPageShell>
    );
}

