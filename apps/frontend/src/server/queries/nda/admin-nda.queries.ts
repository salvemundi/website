'use server';
import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, asc, desc } from 'drizzle-orm';
import { getCommittees, type Committee } from '@/server/queries/commissies/admin-commissies.queries';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { ndaSignatureLayoutSchema, type NdaSignatureLayout } from '@salvemundi/validations';

export type DerivedNdaStatus = 'none' | 'pending' | 'signed' | 'expiring_soon' | 'expired';

export interface NdaCommitteeMember {
    userId: string;
    displayName: string;
    email: string;
    isLeader: boolean;
}

export async function getCommitteeMembersWithUserId(committeeId: number): Promise<NdaCommitteeMember[]> {
    const rows = await db.select({
        userId: schema.directus_users.id,
        firstName: schema.directus_users.first_name,
        lastName: schema.directus_users.last_name,
        email: schema.directus_users.email,
        isLeader: schema.committee_members.is_leader,
    })
        .from(schema.committee_members)
        .innerJoin(schema.directus_users, eq(schema.committee_members.user_id, schema.directus_users.id))
        .where(eq(schema.committee_members.committee_id, committeeId));

    return rows.map((r) => ({
        userId: r.userId,
        displayName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || (r.email ?? ''),
        email: r.email ?? '',
        isLeader: r.isLeader,
    }));
}

export interface NdaSettingsInternal {
    id: number | null;
    secretaryUserId: string | null;
    reminderDaysBefore: number;
    isActive: boolean;
}

export async function getNdaSettingsInternal(): Promise<NdaSettingsInternal> {
    const rows = await db.select().from(schema.nda_settings).orderBy(asc(schema.nda_settings.id)).limit(1);
    if (rows.length === 0) {
        return { id: null, secretaryUserId: null, reminderDaysBefore: 30, isActive: false };
    }
    return {
        id: rows[0].id,
        secretaryUserId: rows[0].secretary_user_id,
        reminderDaysBefore: rows[0].reminder_days_before,
        isActive: rows[0].is_active,
    };
}

function deriveStatus(
    signature: { status: string; expires_at: string | null } | undefined,
    reminderDaysBefore: number
): DerivedNdaStatus {
    if (!signature) return 'none';
    if (signature.status === 'pending') return 'pending';
    if (signature.status === 'expired') return 'expired';
    if (signature.status === 'signed') {
        if (signature.expires_at) {
            const daysUntilExpiry = (new Date(signature.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            if (daysUntilExpiry <= 0) return 'expired';
            if (daysUntilExpiry <= reminderDaysBefore) return 'expiring_soon';
        }
        return 'signed';
    }
    return 'none';
}

function latestSignaturePerUser<T extends { user_id: string; created_at: string }>(rows: T[]): Map<string, T> {
    const latest = new Map<string, T>();
    for (const row of rows) {
        const existing = latest.get(row.user_id);
        if (!existing || row.created_at > existing.created_at) {
            latest.set(row.user_id, row);
        }
    }
    return latest;
}

export interface NdaCommitteeOverview {
    committee: Committee;
    templateId: number | null;
    templateYear: number | null;
    templateStatus: 'draft' | 'signed' | 'archived' | null;
    memberCount: number;
    statusCounts: Record<DerivedNdaStatus, number>;
}

export async function getNdaOverviewInternal(): Promise<NdaCommitteeOverview[]> {
    const [committees, settings] = await Promise.all([getCommittees(), getNdaSettingsInternal()]);

    return Promise.all(committees.map(async (committee) => {
        const [templateRows, members, signatureRows] = await Promise.all([
            db.select().from(schema.nda_templates)
                .where(eq(schema.nda_templates.committee_id, committee.id))
                .orderBy(desc(schema.nda_templates.year))
                .limit(1),
            getCommitteeMembersWithUserId(committee.id),
            db.select({
                user_id: schema.nda_signatures.user_id,
                status: schema.nda_signatures.status,
                expires_at: schema.nda_signatures.expires_at,
                created_at: schema.nda_signatures.created_at,
            }).from(schema.nda_signatures)
                .where(eq(schema.nda_signatures.committee_id, committee.id)),
        ]);

        const latestPerUser = latestSignaturePerUser(signatureRows);

        const statusCounts: Record<DerivedNdaStatus, number> = {
            none: 0, pending: 0, signed: 0, expiring_soon: 0, expired: 0,
        };
        for (const member of members) {
            const status = deriveStatus(latestPerUser.get(member.userId), settings.reminderDaysBefore);
            switch (status) {
                case 'none': statusCounts.none++; break;
                case 'pending': statusCounts.pending++; break;
                case 'signed': statusCounts.signed++; break;
                case 'expiring_soon': statusCounts.expiring_soon++; break;
                case 'expired': statusCounts.expired++; break;
            }
        }

        const template = templateRows.length > 0 ? templateRows[0] : null;
        return {
            committee,
            templateId: template?.id ?? null,
            templateYear: template?.year ?? null,
            templateStatus: (template?.status as 'draft' | 'signed' | 'archived' | undefined) ?? null,
            memberCount: members.length,
            statusCounts,
        };
    }));
}

export interface NdaMemberStatusRow {
    userId: string;
    name: string;
    email: string;
    signatureId: number | null;
    status: DerivedNdaStatus;
    isLegacy: boolean;
    sentAt: string | null;
    signedAt: string | null;
    expiresAt: string | null;
    signedDocument: string | null;
}

export interface NdaCommitteeDetail {
    committee: Committee;
    template: {
        id: number;
        year: number;
        status: string;
        document: string | null;
        secretaryUserId: string | null;
        secretarySignedAt: string | null;
        signatureLayout: NdaSignatureLayout | null;
    } | null;
    members: NdaMemberStatusRow[];
    reminderDaysBefore: number;
}

export async function getCommitteeNdaDetailInternal(committeeId: number): Promise<NdaCommitteeDetail | null> {
    const [committees, settings] = await Promise.all([getCommittees(), getNdaSettingsInternal()]);
    const committee = committees.find((c) => c.id === committeeId);
    if (!committee) return null;

    const [templateRows, members, signatureRows] = await Promise.all([
        db.select().from(schema.nda_templates)
            .where(eq(schema.nda_templates.committee_id, committeeId))
            .orderBy(desc(schema.nda_templates.year))
            .limit(1),
        getCommitteeMembersWithUserId(committeeId),
        db.select().from(schema.nda_signatures)
            .where(eq(schema.nda_signatures.committee_id, committeeId))
            .orderBy(desc(schema.nda_signatures.created_at)),
    ]);

    const latestPerUser = latestSignaturePerUser(signatureRows);

    const memberRows: NdaMemberStatusRow[] = members.map((member) => {
        const signature = latestPerUser.get(member.userId);
        return {
            userId: member.userId,
            name: member.displayName,
            email: member.email,
            signatureId: signature?.id ?? null,
            status: deriveStatus(signature ? { status: signature.status, expires_at: signature.expires_at } : undefined, settings.reminderDaysBefore),
            isLegacy: signature?.is_legacy ?? false,
            sentAt: signature?.sent_at ?? null,
            signedAt: signature?.signed_at ?? null,
            expiresAt: signature?.expires_at ?? null,
            signedDocument: signature?.signed_document ?? null,
        };
    });

    const template = templateRows.length > 0 ? templateRows[0] : null;
    const layoutParse = template ? ndaSignatureLayoutSchema.safeParse(template.signature_layout) : null;

    return {
        committee,
        template: template ? {
            id: template.id,
            year: template.year,
            status: template.status,
            document: template.document,
            secretaryUserId: template.secretary_user_id,
            secretarySignedAt: template.secretary_signed_at,
            signatureLayout: layoutParse?.success ? layoutParse.data : null,
        } : null,
        members: memberRows,
        reminderDaysBefore: settings.reminderDaysBefore,
    };
}

export async function getBestuurMembersInternal(): Promise<NdaCommitteeMember[]> {
    const committees = await getCommittees();
    const bestuur = committees.find((c) => c.azure_group_id === COMMITTEES.BESTUUR);
    if (!bestuur) return [];
    return getCommitteeMembersWithUserId(bestuur.id);
}
