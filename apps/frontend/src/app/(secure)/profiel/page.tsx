import React from 'react';
import Link from 'next/link';
import { ClipboardCheck, ArrowRight, FileSignature } from 'lucide-react';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';
import { getUserEventSignups, getUserPubCrawlSignups } from '@/server/actions/profile/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { type SessionUser } from '@/lib/profile/profile-admin.utils';
import { getIntroAttendanceAccess, getIntroAttendanceVisible } from '@/server/actions/public/intro-attendance.actions';
import { getMyNdas } from '@/server/actions/nda/member-nda.actions';

export const metadata = {
    title: 'Mijn Profiel | SV Salve Mundi',
    description: 'Beheer je lidmaatschap, bekijk je aanmeldingen en pas je gegevens aan.'
};

export default async function ProfielPage() {
    const [eventSignups, pubCrawlSignups, adminData, attendanceVisible, attendanceAccess, ndas] = await Promise.all([
        getUserEventSignups(),
        getUserPubCrawlSignups(),
        checkAdminAccess(),
        getIntroAttendanceVisible(),
        getIntroAttendanceAccess(),
        getMyNdas()
    ]);

    const enrichedUser = adminData.user as SessionUser | null;
    const hasIntroAttendanceAccess = attendanceAccess.isCrew || attendanceAccess.ledGroupIds.length > 0;
    const showIntroAttendanceBanner = attendanceVisible && hasIntroAttendanceAccess;
    const pendingNdaCount = ndas.filter((n) => n.status === 'pending').length;

    return (
        <PublicPageShell title="Mijn Profiel">
            <div className="container mx-auto max-w-7xl px-4 py-12">
                {pendingNdaCount > 0 && (
                    <Link
                        href="/profiel/nda"
                        className="group squircle-lg hover:scale-1.01 mb-8 flex items-center justify-between gap-4 bg-amber-600 px-6 py-5 text-white shadow-lg transition-all hover:shadow-xl sm:px-8 sm:py-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="squircle flex size-11 shrink-0 items-center justify-center bg-white/15 sm:size-12">
                                <FileSignature className="size-5 sm:size-6" />
                            </div>
                            <div>
                                <p className="text-base leading-tight font-black sm:text-lg">
                                    {pendingNdaCount === 1 ? 'Je hebt een NDA om te ondertekenen' : `Je hebt ${pendingNdaCount} NDA's om te ondertekenen`}
                                </p>
                                <p className="text-xs font-medium text-white/80 sm:text-sm">Geheimhoudingsverklaring(en) wachten op jouw handtekening</p>
                            </div>
                        </div>
                        <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                )}
                {showIntroAttendanceBanner && (
                    <Link
                        href="/profiel/intro-attendance"
                        className="group squircle-lg hover:scale-1.01 mb-8 flex items-center justify-between gap-4 bg-purple-600 px-6 py-5 text-white shadow-lg transition-all hover:shadow-xl sm:px-8 sm:py-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="squircle flex size-11 shrink-0 items-center justify-center bg-white/15 sm:size-12">
                                <ClipboardCheck className="size-5 sm:size-6" />
                            </div>
                            <div>
                                <p className="text-base leading-tight font-black sm:text-lg">Intro Aanwezigheid</p>
                                <p className="text-xs font-medium text-white/80 sm:text-sm">Beheer wie er aanwezig is in je groepje</p>
                            </div>
                        </div>
                        <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
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
