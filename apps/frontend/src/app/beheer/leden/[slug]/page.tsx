import type { Metadata } from 'next';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { notFound } from 'next/navigation';
import LedenDetailIsland, { type Member, type CommitteeMembership, type Signup } from '@/components/islands/admin/leden/LedenDetailIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { type EnrichedUser } from '@/types/auth';
import { type Committee } from '@/shared/lib/permissions';
import {
    type DirectusUser,
    type CommitteeMember,
    type EventSignup,
    type Committee as DirectusCommittee
} from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';
import { db, schema } from "@salvemundi/db";
import { eq } from "drizzle-orm";

interface AzureUserGroupsResponse {
    success: boolean;
    groups?: { id: string }[];
}

export const metadata: Metadata = {
    title: 'Lid Detail | SV Salve Mundi'
};

export default async function LidDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const decodedSlug = decodeURIComponent(resolvedParams.slug);

    const session = await getEnrichedSession();
    if (!session) return <AdminUnauthorized title="Lid Detail" />;

    const user = session.user as unknown as EnrichedUser;
    const memberships = user.committees || [];
    const hasPriv = memberships.some((c: Committee) => {
        const name = (c.name || '').toString().toLowerCase();
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

    let memberData: DirectusUser | undefined;
    let signups: EventSignup[] = [];
    let userCommittees: CommitteeMember[] = [];
    let allCommittees: DirectusCommittee[] = [];

    try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);

        if (isUuid) {
            // Updated Drizzle Syntax for Relational API
            const result = await db.query.directus_users.findFirst({
                where: (users, { eq }) => eq(users.id, decodedSlug),
                columns: { id: true, first_name: true, last_name: true, email: true, date_of_birth: true, membership_expiry: true, status: true, phone_number: true, avatar: true, entra_id: true }
            });
            if (result) memberData = result as unknown as DirectusUser;
        } else {
            // Updated Drizzle Syntax for Relational API
            const memberResult = await db.query.directus_users.findMany({
                where: (users, { or, ilike }) => or(
                    ilike(users.email, `${decodedSlug}@%`),
                    ilike(users.email, `${decodedSlug.replace(/-/g, '.')}@%`)
                ),
                columns: { id: true, first_name: true, last_name: true, email: true, date_of_birth: true, membership_expiry: true, status: true, phone_number: true, avatar: true, entra_id: true },
                limit: 100
            });

            if (memberResult.length > 0) {
                memberData = memberResult.find((u) => {
                    const emailPrefix = (u.email || '').split('@')[0].toLowerCase();
                    const normalizedPrefix = emailPrefix.replace(/\./g, '-');
                    return normalizedPrefix === decodedSlug.toLowerCase();
                }) as unknown as DirectusUser | undefined;
            }
        }

        if (!memberData) return notFound();
        if (memberData.status === 'rejected') return notFound();

        const id = memberData.id;
        const memberEmail = memberData.email || '';

        const [userCommitteesResult, signupsResult, allCommitteesResult] = await Promise.allSettled([
            db.select({
                id: schema.committee_members.id,
                is_leader: schema.committee_members.is_leader,
                committee_id: {
                    id: schema.committees.id,
                    name: schema.committees.name,
                    email: schema.committees.email,
                    azure_group_id: schema.committees.azure_group_id,
                    is_visible: schema.committees.is_visible
                }
            }).from(schema.committee_members)
            .innerJoin(schema.committees, eq(schema.committee_members.committee_id, schema.committees.id))
            .where(eq(schema.committee_members.user_id, id)),
            
            db.select({
                id: schema.event_signups.id,
                payment_status: schema.event_signups.payment_status,
                event_id: {
                    id: schema.events.id,
                    name: schema.events.name,
                    event_date: schema.events.event_date
                }
            }).from(schema.event_signups)
            .innerJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
            .where(eq(schema.event_signups.participant_email, memberEmail)),

            db.query.committees.findMany({
                columns: { id: true, name: true, azure_group_id: true, is_visible: true }
            })
        ]);

        signups = signupsResult.status === 'fulfilled' ? signupsResult.value as unknown as EventSignup[] : [];
        userCommittees = userCommitteesResult.status === 'fulfilled' ? userCommitteesResult.value as unknown as CommitteeMember[] : [];
        allCommittees = allCommitteesResult.status === 'fulfilled' ? allCommitteesResult.value as unknown as DirectusCommittee[] : [];

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

        const internalToken = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();
        if (memberData.entra_id && process.env.AZURE_MANAGEMENT_SERVICE_URL && internalToken) {
            try {
                const mgmtRes = await fetch(`${process.env.AZURE_MANAGEMENT_SERVICE_URL}/api/users/${encodeURIComponent(memberData.entra_id)}/groups`, {
                    headers: { 'Authorization': `Bearer ${internalToken}` },
                    next: { revalidate: 0 }
                });

                if (mgmtRes.ok) {
                    const data = (await mgmtRes.json()) as AzureUserGroupsResponse;
                    if (data.success && Array.isArray(data.groups)) {
                        const userAzureGroupIds = data.groups.map((g) => g.id.toLowerCase());
                        const matchedGroups = HARDCODED_AZURE_GROUPS.filter(hg => userAzureGroupIds.includes(hg.id.toLowerCase()));

                        const fakeMemberships = matchedGroups.map(match => ({
                            id: `azure-mock-${match.id}`,
                            is_leader: false,
                            committee_id: {
                                id: match.id,
                                name: match.name,
                                azure_group_id: match.id,
                                is_visible: false
                            }
                        }));

                        userCommittees = [...userCommittees, ...fakeMemberships as unknown as CommitteeMember[]];
                    }
                }
            } catch (error) {
                safeConsoleError("[page.tsx][LidDetailPage] Failed fetching external Azure groups:", error);
            }
        }

    } catch (error: unknown) {
        if (
            error &&
            typeof error === 'object' &&
            'digest' in error &&
            typeof (error as { digest?: string }).digest === 'string' &&
            (error as { digest: string }).digest.startsWith('NEXT_')
        ) {
            throw error;
        }
        safeConsoleError("[page.tsx][LidDetailPage] Error loading member:", error);
        throw error;
    }


    return (
        <AdminPageShell
            title="Lid Detail"
            backHref="/beheer/leden"
        >
            <LedenDetailIsland
                member={memberData as unknown as Member}
                initialMemberships={userCommittees as unknown as CommitteeMembership[]}
                signups={signups as unknown as Signup[]}
                allCommittees={allCommittees.map(c => ({
                    id: String(c.id),
                    name: c.name || '',
                    is_visible: !!c.is_visible,
                    azure_group_id: c.azure_group_id
                }))}
                isAdmin={hasPriv}
            />
        </AdminPageShell>
    );
}