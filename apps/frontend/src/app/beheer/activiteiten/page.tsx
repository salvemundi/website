import type { Metadata } from 'next';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminActivitiesIsland from '@/components/islands/admin/activities/AdminActivitiesIsland';
import { getAdminActivities } from '@/server/actions/events/activiteiten/activities-read.actions';
import { getCommittees } from '@/server/actions/public/committees.actions';
import { fetchUserCommitteesDb } from '@/server/internal/user-db.utils';
import { getPermissions } from '@/shared/lib/permissions';
import { safeConsoleError } from '@/server/utils/logger';
import { type EnrichedUser } from '@/types/auth';
import { type AdminActivity } from "@salvemundi/validations";
import { type DbCommittee } from '@salvemundi/validations/directus/schema';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Beheer Activiteiten | SV Salve Mundi'
};

export default async function AdminActiviteitenPage() {
    const session = await getEnrichedSession();
    const user = session?.user as unknown as EnrichedUser | undefined;

    let userCommittees: Awaited<ReturnType<typeof fetchUserCommitteesDb>> = [];
    try {
        userCommittees = await fetchUserCommitteesDb(user?.id || '');
    } catch (error) {
        safeConsoleError('[page][AdminActiviteitenPage]', error);
    }

    const permissions = getPermissions(userCommittees);

    const [initialEvents, committees] = await Promise.all([
        getAdminActivities(undefined, 'all'),
        getCommittees()
    ]);

    const events = initialEvents as unknown as AdminActivity[];
    const upcomingCount = events.filter(e => new Date(e.event_date) >= new Date()).length;
    const totalSignups = events.reduce((acc, curr) => acc + (curr.signup_count || 0), 0);

    return (
        <AdminPageShell
            title="Activiteiten Beheer"
            subtitle="Organiseer en beheer alle activiteiten van Salve Mundi"
            backHref="/beheer"
            actions={
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1 uppercase tracking-wider">Aankomend</span>
                            <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{upcomingCount}</span>
                        </div>
                        <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1 uppercase tracking-wider">Totaal</span>
                            <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{events.length}</span>
                        </div>
                        <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1 uppercase tracking-wider">Leden</span>
                            <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{totalSignups}</span>
                        </div>
                    </div>

                    <Link
                        href="/beheer/activiteiten/nieuw"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--beheer-accent)] text-white rounded-xl squircle text-xs font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 border border-white/10 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" />
                        Nieuwe Activiteit
                    </Link>
                </div>
            }
        >
            <AdminActivitiesIsland
                initialEvents={events}
                committees={committees as unknown as DbCommittee[]}
                userId={session?.user.id}
                userCommittees={userCommittees as unknown as DbCommittee[]}
                permissions={permissions}
            />
        </AdminPageShell>
    );
}