import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getIntroAttendanceAccess, getAttendanceGroupsForUser } from '@/server/actions/public/intro-attendance.actions';
import IntroAttendanceIsland from '@/components/islands/account/intro/IntroAttendanceIsland';
import BackButton from '@/components/ui/navigation/BackButton';

export const metadata: Metadata = {
    title: 'Groepje Aanwezigheid | SV Salve Mundi'
};

export default async function IntroAttendancePage() {
    const { isCrew, ledGroupIds } = await getIntroAttendanceAccess();

    if (!isCrew && ledGroupIds.length === 0) {
        redirect('/profiel');
    }

    const groups = await getAttendanceGroupsForUser();

    return (
        <div>
            <header className="bg-(--bg-soft) py-12">
                <div className="mx-auto max-w-app px-4">
                    <div className="mb-6">
                        <BackButton href="/profiel" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-(--text-main)">Groepje Aanwezigheid</h1>
                    <p className="text-lg text-(--text-muted) mt-2 max-w-3xl">
                        Houd per dag bij wie er aanwezig is en wie er &apos;s avonds al naar huis is.
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                <IntroAttendanceIsland groups={groups} isCrew={isCrew} />
            </div>
        </div>
    );
}
