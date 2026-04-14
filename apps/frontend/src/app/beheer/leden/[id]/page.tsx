import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import LedenDetailIsland from '@/components/islands/admin/leden/LedenDetailIsland';
import { getSystemDirectus } from '@/lib/directus';

// Correct Directus SDK imports
import { readUser, readItems as dReadItems } from '@directus/sdk';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export default async function LidDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // NUCLEAR SSR: All access and permission checks must happen before flushing the shell
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <AdminUnauthorized title="Lid Detail" />;

    const user = session.user as any;
    const memberships = user.committees || [];
    const hasPriv = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    if (!hasPriv) {
        return (
            <AdminUnauthorized 
                title="Lid Detail"
                description="Je hebt geen rechten om persoonsgegevens van dit lid te bekijken. Dit is een beperkte sectie voor het Bestuur en ICT."
            />
        );
    }

    try {
        // NUCLEAR SSR: Parallel fetch for all detail data
        const [member, userCommitteesResult, signupsResult, allCommitteesResult] = await Promise.allSettled([
            getSystemDirectus().request(
                readUser<any, any>(id, {
                    fields: ['id', 'first_name', 'last_name', 'email', 'date_of_birth', 'membership_expiry', 'status', 'phone_number', 'avatar', 'entra_id']
                })
            ),
            getSystemDirectus().request(
                dReadItems<any, any, any>('committee_members' as any, {
                    filter: { user_id: { _eq: id } },
                    fields: ['id', 'is_leader', { committee_id: ['id', 'name', 'email', 'azure_group_id', 'is_visible'] }],
                    limit: -1
                })
            ),
            getSystemDirectus().request(
                dReadItems<any, any, any>('event_signups', {
                    filter: { participant_email: { _eq: id } }, // Initial fetch might be by ID or email
                    fields: ['id', 'payment_status', { event_id: ['id', 'name', 'event_date'] }],
                    limit: -1
                })
            ),
            getSystemDirectus().request(
                dReadItems<any, any, any>('committees', {
                    fields: ['id', 'name', 'azure_group_id', 'is_visible'],
                    sort: ['name'],
                    limit: -1
                })
            )
        ]);

        if (member.status === 'rejected') return notFound();
        const memberData = member.value;

        // Re-fetch signups by email now that we have the member record
        const signups = await getSystemDirectus().request(
            dReadItems<any, any, any>('event_signups', {
                filter: { participant_email: { _eq: memberData.email } },
                fields: ['id', 'payment_status', { event_id: ['id', 'name', 'event_date'] }],
                limit: -1
            })
        ).catch(() => []);

        const userCommittees = userCommitteesResult.status === 'fulfilled' ? userCommitteesResult.value : [];
        const allCommittees = allCommitteesResult.status === 'fulfilled' ? allCommitteesResult.value : [];

        return (
            <AdminPageShell
                title="Lid Detail"
                backHref="/beheer/leden"
            >
                <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <LedenDetailIsland 
                        member={memberData as any} 
                        initialMemberships={userCommittees as any} 
                        signups={signups as any}
                        allCommittees={allCommittees as any}
                        isAdmin={hasPriv}
                    />
                </div>
            </AdminPageShell>
        );
    } catch (e) {
        return notFound();
    }
}


