import React from 'react';
import Link from 'next/link';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';
import { getUserEventSignups, getUserPubCrawlSignups } from '@/server/actions/profile/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { type SessionUser } from '@/lib/profile/profile-admin.utils';
import { getIntroAttendanceAccess, getIntroAttendanceVisible } from '@/server/actions/public/intro-attendance.actions';

export const metadata = {
    title: 'Mijn Profiel | SV Salve Mundi',
    description: 'Beheer je lidmaatschap, bekijk je aanmeldingen en pas je gegevens aan.'
};

export default async function ProfielPage() {
    const [eventSignups, pubCrawlSignups, adminData, attendanceVisible, attendanceAccess] = await Promise.all([
        getUserEventSignups(),
        getUserPubCrawlSignups(),
        checkAdminAccess(),
        getIntroAttendanceVisible(),
        getIntroAttendanceAccess()
    ]);

    const enrichedUser = adminData.user as SessionUser | null;
    const hasIntroAttendanceAccess = attendanceAccess.isCrew || attendanceAccess.ledGroupIds.length > 0;
    const showIntroAttendanceBanner = attendanceVisible && hasIntroAttendanceAccess;

    return (
        <PublicPageShell title="Mijn Profiel">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {showIntroAttendanceBanner && (
                    <Link
                        href="/profiel/intro-attendance"
                        className="group flex items-center justify-between gap-4 squircle-lg bg-purple-600 text-white px-6 py-5 sm:px-8 sm:py-6 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all mb-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 sm:h-12 sm:w-12 squircle bg-white/15 flex items-center justify-center shrink-0">
                                <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div>
                                <p className="font-black text-base sm:text-lg leading-tight">Intro Aanwezigheid</p>
                                <p className="text-xs sm:text-sm text-white/80 font-medium">Beheer wie er aanwezig is in je groepje</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                )}
                {enrichedUser && (
                    <ProfielIsland
                        user={enrichedUser}
                        initialSignups={eventSignups}
                        pubCrawlSignups={pubCrawlSignups}
                    />
                )}
            </div>
        </PublicPageShell>
    );
}
