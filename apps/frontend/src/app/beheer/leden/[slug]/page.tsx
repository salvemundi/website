import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import LedenDetailIsland, { type Member, type CommitteeMembership, type Signup } from '@/components/islands/admin/leden/LedenDetailIsland';
import { getSystemDirectus } from '@/lib/directus';
import { readUsers, readItems } from '@directus/sdk';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

// Correct Directus SDK imports
import { type EnrichedUser } from '@/types/auth';
import { type Committee } from '@/shared/lib/permissions';
import { 
    type DbDirectusUser, 
    type DbCommitteeMember, 
    type DbEventSignup, 
    type DbCommittee as DbCommitteeSchema 
} from '@salvemundi/validations/directus/schema';

export default async function LidDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const decodedSlug = decodeURIComponent(resolvedParams.slug);

    // NUCLEAR SSR: All access and permission checks must happen before flushing the shell
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <AdminUnauthorized title="Lid Detail" />;

    const user = session.user as unknown as EnrichedUser;
    const memberships = user.committees || [];
    const hasPriv = memberships.some((c: Committee) => {
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
        // NUCLEAR SSR: Sequential fetch because we need the ID from the slug
        const memberResult = await getSystemDirectus().request(
            readUsers({
                filter: { 
                    _or: [
                        { email: { _istarts_with: decodedSlug + '@' } },
                        { email: { _istarts_with: decodedSlug.replace(/-/g, '.') + '@' } }
                    ]
                }, 
                fields: ['id', 'first_name', 'last_name', 'email', 'date_of_birth', 'membership_expiry', 'status', 'phone_number', 'avatar', 'entra_id'],
                limit: 100
            })
        ) as DbDirectusUser[];

        if (!memberResult || memberResult.length === 0) return notFound();
        
        // Find exact match by comparing the normalized prefix (dots converted to dashes)
        const memberData = memberResult.find((u) => {
            const emailPrefix = (u.email || '').split('@')[0].toLowerCase();
            const normalizedPrefix = emailPrefix.replace(/\./g, '-');
            return normalizedPrefix === decodedSlug.toLowerCase();
        });

        if (!memberData) return notFound();
        if (memberData.status === 'rejected') return notFound();
        
        const id = memberData.id;

        const [userCommitteesResult, signupsResult, allCommitteesResult] = await Promise.allSettled([
            getSystemDirectus().request(
                readItems('committee_members', {
                    filter: { user_id: { _eq: id } },
                    fields: ['id', 'is_leader', { committee_id: ['id', 'name', 'email', 'azure_group_id', 'is_visible'] }],
                    limit: -1
                })
            ) as Promise<DbCommitteeMember[]>,
            // Re-fetch signups by email since the lookup uses participant_email
            getSystemDirectus().request(
                readItems('event_signups', {
                    filter: { participant_email: { _eq: memberData.email } },
                    fields: ['id', 'payment_status', { event_id: ['id', 'name', 'event_date'] }],
                    limit: -1
                })
            ) as Promise<DbEventSignup[]>,
            getSystemDirectus().request(
                readItems('committees', {
                    fields: ['id', 'name', 'azure_group_id', 'is_visible'],
                    sort: ['name'],
                    limit: -1
                })
            ) as Promise<DbCommitteeSchema[]>
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
                        const userAzureGroupIds = data.groups.map((g: { id: string }) => g.id.toLowerCase());
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

                        userCommittees = [...userCommittees, ...fakeMemberships as unknown as DbCommitteeMember[]];
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
                        member={memberData as unknown as Member} 
                        initialMemberships={userCommittees as unknown as CommitteeMembership[]} 
                        signups={signups as unknown as Signup[]}
                        allCommittees={allCommittees as any}
                        isAdmin={hasPriv}
                    />
                </div>
            </AdminPageShell>
        );
    } catch (e: unknown) {
        if (e && typeof e === 'object' && 'digest' in e && typeof (e as { digest?: string }).digest === 'string' && (e as { digest: string }).digest.startsWith('NEXT_')) throw e;
        console.error("[LidDetailPage] Error loading member:", e);
        return notFound();
    }
}


