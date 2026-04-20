import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import LedenDetailIsland from '@/components/islands/admin/leden/LedenDetailIsland';
import { getSystemDirectus } from '@/lib/directus';

// Correct Directus SDK imports
import { readUser, readItems as dReadItems } from '@directus/sdk';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export default async function LidDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const decodedSlug = decodeURIComponent(resolvedParams.slug);

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
        // NUCLEAR SSR: Sequential fetch because we need the ID from the slug
        const memberResult = await getSystemDirectus().request(
            dReadItems<any, any, any>('directus_users', {
                filter: { email: { _starts_with: `${decodedSlug}@` } },
                fields: ['id', 'first_name', 'last_name', 'email', 'date_of_birth', 'membership_expiry', 'status', 'phone_number', 'avatar', 'entra_id'],
                limit: 1
            })
        );

        if (!memberResult || memberResult.length === 0) return notFound();
        const memberData = memberResult[0];
        if (memberData.status === 'rejected') return notFound();
        
        const id = memberData.id;

        const [userCommitteesResult, signupsResult, allCommitteesResult] = await Promise.allSettled([
            getSystemDirectus().request(
                dReadItems<any, any, any>('committee_members' as any, {
                    filter: { user_id: { _eq: id } },
                    fields: ['id', 'is_leader', { committee_id: ['id', 'name', 'email', 'azure_group_id', 'is_visible'] }],
                    limit: -1
                })
            ),
            // Re-fetch signups by email since the lookup uses participant_email
            getSystemDirectus().request(
                dReadItems<any, any, any>('event_signups', {
                    filter: { participant_email: { _eq: memberData.email } },
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

        const signups = signupsResult.status === 'fulfilled' ? signupsResult.value : [];

        let userCommittees = userCommitteesResult.status === 'fulfilled' ? userCommitteesResult.value : [];
        const allCommittees = allCommitteesResult.status === 'fulfilled' ? allCommitteesResult.value : [];

        // Hardcoded invisible Azure groups (Teams & Groups)
        const HARDCODED_AZURE_GROUPS = [
            { name: "AdviesRaad | Salve Mundi", id: "d30a8bfc-7cb6-4619-ac59-fcb307bbe6d4" },
            { name: "BHV", id: "314044d2-bafe-43c7-99f3-c8824dbcbef0" },
            { name: "CoBo", id: "f550025a-3dc3-4325-bc1b-256466066df9" },
            { name: "Foto's Introductie | Salve Mundi", id: "7f502f26-b0d6-4dc9-9fbe-4ce600a81863" },
            { name: "Fotografie Events | Salve Mundi", id: "ffe78b01-b471-41c3-8151-12f013ac0273" },
            { name: "Gala", id: "7337fdd6-08c7-48a8-b3b5-2921909098cd" },
            { name: "Informatie | Salve Mundi", id: "15862ad9-89fc-4f2b-809c-7a00981d38eb" },
            { name: "Jaarclub team", id: "5bc84f40-eba9-4d2b-bdc6-801fcdbc9a7a" },
            { name: "lustrum", id: "1d8538ef-7858-4d66-8cd9-c9c134bf1066" },
            { name: "SaMu || Agenda", id: "cc3b152d-9152-475a-a316-ec5d766d0b78" }
        ];

        // Dynamically fetch and merge Azure Teams
        if (memberData.entra_id && process.env.AZURE_MANAGEMENT_SERVICE_URL && process.env.INTERNAL_SERVICE_TOKEN) {
            try {
                const mgmtRes = await fetch(`${process.env.AZURE_MANAGEMENT_SERVICE_URL}/api/users/${encodeURIComponent(memberData.entra_id)}/groups`, {
                    headers: { 'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}` },
                    next: { revalidate: 0 } // No caching to ensure Admin sees live data
                });

                if (mgmtRes.ok) {
                    const data = await mgmtRes.json();
                    if (data.success && Array.isArray(data.groups)) {
                        const userAzureGroupIds = data.groups.map((g: any) => g.id.toLowerCase());
                        const matchedGroups = HARDCODED_AZURE_GROUPS.filter(hg => userAzureGroupIds.includes(hg.id.toLowerCase()));
                        
                        const fakeMemberships = matchedGroups.map(match => ({
                            id: `azure-mock-${match.id}`, // temporary distinct ID
                            is_leader: false,
                            committee_id: {
                                id: match.id,
                                name: match.name,
                                azure_group_id: match.id,
                                is_visible: false // Ensures it goes to the "Teams & Groepen" blue card
                            }
                        }));

                        userCommittees = [...userCommittees, ...fakeMemberships];
                    }
                }
            } catch (err) {
                console.error("[LidDetailPage] Failed fetching external Azure groups:", err);
            }
        }

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


