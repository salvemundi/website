import type { Metadata } from 'next';
import { QrCode } from 'lucide-react';
import IntroManagementIsland from '@/components/islands/admin/IntroManagementIsland';
import {
    getIntroSignups,
    getIntroParentSignups,
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
    const [signups, parents, planning, confidants, settings, planningImage, infoBooklet, qrScanCount, groups, approvedOuders, attendanceVisible, signupSettings] = await Promise.all([
        getIntroSignups(),
        getIntroParentSignups(),
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
                <div className="flex items-center gap-1.5 rounded-full border border-border-color bg-bg-card px-2.5 py-1.5 shadow-sm sm:gap-3 sm:rounded-3xl sm:px-4 sm:py-2">
                    <QrCode className="size-3.5 text-theme-purple sm:size-4" />
                    <span className="text-[11px] font-semibold whitespace-nowrap text-text-muted sm:text-base">
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

