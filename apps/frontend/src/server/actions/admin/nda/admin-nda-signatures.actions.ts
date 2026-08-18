'use server';

import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, and, lte, isNull, gte, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { safeConsoleError } from '@/server/utils/logger';
import { sendNdaMail } from './nda-mail.utils';
import { getCommitteeMembersWithUserId, getNdaSettingsInternal } from '@/server/queries/nda/admin-nda.queries';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://salvemundi.nl';

function addYears(dateIso: string, years: number): string {
    const date = new Date(dateIso);
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().slice(0, 10);
}

async function notifySecretaryOfBatch(committeeName: string, recipients: { name: string; email: string }[], committeeId: number): Promise<void> {
    if (recipients.length === 0) return;
    const settings = await getNdaSettingsInternal();
    if (!settings.secretaryUserId) return;

    const secretaryRows = await db.select({ email: schema.directus_users.email })
        .from(schema.directus_users)
        .where(eq(schema.directus_users.id, settings.secretaryUserId))
        .limit(1);
    const secretaryEmail = secretaryRows[0]?.email;
    if (!secretaryEmail) return;

    await sendNdaMail(secretaryEmail, 'nda-secretary-batch-sent', {
        committeeName,
        recipientCount: recipients.length,
        recipients,
        adminUrl: `${SITE_URL}/beheer/nda/${committeeId}`,
    });
}

export async function sendNdaToCommitteeMembers(templateId: number): Promise<{ success: boolean; sentCount: number; error?: string }> {
    await requireAdminResource(AdminResource.Nda);

    const templateRows = await db.select().from(schema.nda_templates).where(eq(schema.nda_templates.id, templateId)).limit(1);
    if (templateRows.length === 0) {
        return { success: false, sentCount: 0, error: 'Deze NDA is nog niet bevestigd door de secretaris' };
    }
    const template = templateRows[0];
    if (template.status !== 'signed' || !template.document) {
        return { success: false, sentCount: 0, error: 'Deze NDA is nog niet bevestigd door de secretaris' };
    }

    const committeeRows = await db.select({ name: schema.committees.name }).from(schema.committees).where(eq(schema.committees.id, template.committee_id)).limit(1);
    const committeeName = committeeRows[0]?.name ?? 'de commissie';

    const members = await getCommitteeMembersWithUserId(template.committee_id);
    const existingRows = await db.select({ user_id: schema.nda_signatures.user_id, status: schema.nda_signatures.status })
        .from(schema.nda_signatures)
        .where(eq(schema.nda_signatures.committee_id, template.committee_id));

    const activeUserIds = new Set(existingRows.filter((r) => r.status === 'pending' || r.status === 'signed').map((r) => r.user_id));
    const toSend = members.filter((m) => !activeUserIds.has(m.userId));

    const notified: { name: string; email: string }[] = [];

    for (const member of toSend) {
        try {
            const inserted = await db.insert(schema.nda_signatures).values({
                nda_template_id: templateId,
                committee_id: template.committee_id,
                user_id: member.userId,
                status: 'pending',
                sent_at: new Date().toISOString(),
            }).returning({ id: schema.nda_signatures.id });

            const signatureId = inserted[0]?.id;
            if (!signatureId) continue;

            const sent = await sendNdaMail(member.email, 'nda-invite', {
                name: member.displayName,
                committeeName,
                signUrl: `${SITE_URL}/profiel/nda/${signatureId}`,
            });
            if (sent) notified.push({ name: member.displayName, email: member.email });
        } catch (error) {
            safeConsoleError(`[admin-nda-signatures.actions.ts][sendNdaToCommitteeMembers] Failed for member ${member.userId}:`, error);
        }
    }

    await notifySecretaryOfBatch(committeeName, notified, template.committee_id);

    revalidatePath(`/beheer/nda/${template.committee_id}`);
    revalidatePath('/beheer/nda');
    return { success: true, sentCount: notified.length };
}

export async function resendNdaInvite(signatureId: number): Promise<{ success: boolean; error?: string }> {
    await requireAdminResource(AdminResource.Nda);

    const rows = await db.select().from(schema.nda_signatures).where(eq(schema.nda_signatures.id, signatureId)).limit(1);
    if (rows.length === 0) {
        return { success: false, error: 'Deze NDA staat niet meer open om te versturen' };
    }
    const row = rows[0];
    if (row.status !== 'pending') {
        return { success: false, error: 'Deze NDA staat niet meer open om te versturen' };
    }

    const [memberRows, committeeRows] = await Promise.all([
        db.select({ email: schema.directus_users.email, firstName: schema.directus_users.first_name, lastName: schema.directus_users.last_name })
            .from(schema.directus_users).where(eq(schema.directus_users.id, row.user_id)).limit(1),
        db.select({ name: schema.committees.name }).from(schema.committees).where(eq(schema.committees.id, row.committee_id)).limit(1),
    ]);

    const member = memberRows[0];
    if (!member.email) {
        return { success: false, error: 'Geen e-mailadres bekend voor dit lid' };
    }

    await sendNdaMail(member.email, 'nda-invite', {
        name: `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim(),
        committeeName: committeeRows[0]?.name ?? 'de commissie',
        signUrl: `${SITE_URL}/profiel/nda/${signatureId}`,
    });

    await db.update(schema.nda_signatures).set({ sent_at: new Date().toISOString() }).where(eq(schema.nda_signatures.id, signatureId));
    revalidatePath(`/beheer/nda/${row.committee_id}`);
    return { success: true };
}

/**
 * Manually re-invites a single member whose NDA has already fully expired.
 * The automatic cron only picks up rows still in 'signed' status nearing
 * expiry — once a row has flipped to 'expired' it's outside that scan, so
 * this is the only way to give that member a fresh NDA without waiting for
 * a whole new bulk send.
 */
export async function sendRenewalReminderToMember(expiredSignatureId: number): Promise<{ success: boolean; error?: string }> {
    await requireAdminResource(AdminResource.Nda);

    const rows = await db.select().from(schema.nda_signatures).where(eq(schema.nda_signatures.id, expiredSignatureId)).limit(1);
    if (rows.length === 0) {
        return { success: false, error: 'NDA niet gevonden' };
    }
    const row = rows[0];
    if (row.status !== 'expired') {
        return { success: false, error: 'Deze NDA is niet verlopen' };
    }

    const [templateRows, memberRows, committeeRows] = await Promise.all([
        db.select().from(schema.nda_templates)
            .where(and(eq(schema.nda_templates.committee_id, row.committee_id), eq(schema.nda_templates.status, 'signed')))
            .orderBy(desc(schema.nda_templates.year))
            .limit(1),
        db.select({ email: schema.directus_users.email, firstName: schema.directus_users.first_name, lastName: schema.directus_users.last_name })
            .from(schema.directus_users).where(eq(schema.directus_users.id, row.user_id)).limit(1),
        db.select({ name: schema.committees.name }).from(schema.committees).where(eq(schema.committees.id, row.committee_id)).limit(1),
    ]);

    if (templateRows.length === 0) {
        return { success: false, error: 'Upload en bevestig eerst een nieuwe NDA voor deze commissie' };
    }
    const template = templateRows[0];
    const member = memberRows[0];
    if (!member.email) {
        return { success: false, error: 'Geen e-mailadres bekend voor dit lid' };
    }
    const committeeName = committeeRows[0]?.name ?? 'de commissie';

    const inserted = await db.insert(schema.nda_signatures).values({
        nda_template_id: template.id,
        committee_id: row.committee_id,
        user_id: row.user_id,
        status: 'pending',
        sent_at: new Date().toISOString(),
    }).returning({ id: schema.nda_signatures.id });

    const signatureId = inserted[0]?.id;
    if (!signatureId) {
        return { success: false, error: 'Aanmaken van nieuwe NDA mislukt' };
    }

    await sendNdaMail(member.email, 'nda-renewal-reminder', {
        name: `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim(),
        committeeName,
        signUrl: `${SITE_URL}/profiel/nda/${signatureId}`,
    });

    revalidatePath(`/beheer/nda/${row.committee_id}`);
    return { success: true };
}

export async function recordHistoricalNdaSignature(
    committeeId: number,
    userId: string,
    signedAt: string
): Promise<{ success: boolean; error?: string }> {
    await requireAdminResource(AdminResource.Nda);

    try {
        const existing = await db.select({ id: schema.nda_signatures.id })
            .from(schema.nda_signatures)
            .where(and(eq(schema.nda_signatures.committee_id, committeeId), eq(schema.nda_signatures.user_id, userId)))
            .limit(1);

        if (existing.length > 0) {
            return { success: false, error: 'Dit lid heeft al een NDA-status geregistreerd' };
        }

        await db.insert(schema.nda_signatures).values({
            committee_id: committeeId,
            user_id: userId,
            nda_template_id: null,
            status: 'signed',
            is_legacy: true,
            signed_at: new Date(signedAt).toISOString(),
            expires_at: addYears(signedAt, 1),
        });

        revalidatePath(`/beheer/nda/${committeeId}`);
        revalidatePath('/beheer/nda');
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-nda-signatures.actions.ts][recordHistoricalNdaSignature] Failed to save:', error);
        return { success: false, error: 'Opslaan mislukt' };
    }
}

export async function runNdaExpiryCheckInternal(): Promise<{ expiredCount: number; renewalsSent: number }> {
    const today = new Date().toISOString().slice(0, 10);
    const settings = await getNdaSettingsInternal();

    const expiredResult = await db.update(schema.nda_signatures)
        .set({ status: 'expired', updated_at: new Date().toISOString() })
        .where(and(eq(schema.nda_signatures.status, 'signed'), lte(schema.nda_signatures.expires_at, today)))
        .returning({ id: schema.nda_signatures.id });

    const reminderThreshold = new Date();
    reminderThreshold.setDate(reminderThreshold.getDate() + settings.reminderDaysBefore);
    const thresholdIso = reminderThreshold.toISOString().slice(0, 10);

    const dueForRenewal = await db.select().from(schema.nda_signatures)
        .where(and(
            eq(schema.nda_signatures.status, 'signed'),
            gte(schema.nda_signatures.expires_at, today),
            lte(schema.nda_signatures.expires_at, thresholdIso),
            isNull(schema.nda_signatures.reminder_sent_at)
        ));

    const byCommittee = new Map<number, typeof dueForRenewal>();
    for (const row of dueForRenewal) {
        const list = byCommittee.get(row.committee_id) ?? [];
        list.push(row);
        byCommittee.set(row.committee_id, list);
    }

    let renewalsSent = 0;

    for (const [committeeId, rows] of byCommittee) {
        const [templateRows, committeeRows] = await Promise.all([
            db.select().from(schema.nda_templates)
                .where(and(eq(schema.nda_templates.committee_id, committeeId), eq(schema.nda_templates.status, 'signed')))
                .orderBy(schema.nda_templates.year)
                .limit(1),
            db.select({ name: schema.committees.name }).from(schema.committees).where(eq(schema.committees.id, committeeId)).limit(1),
        ]);

        const committeeName = committeeRows[0]?.name ?? 'de commissie';

        if (templateRows.length === 0) {
            const secretarySettings = await getNdaSettingsInternal();
            if (secretarySettings.secretaryUserId) {
                const secretaryRows = await db.select({ email: schema.directus_users.email })
                    .from(schema.directus_users).where(eq(schema.directus_users.id, secretarySettings.secretaryUserId)).limit(1);
                if (secretaryRows[0]?.email) {
                    await sendNdaMail(secretaryRows[0].email, 'nda-secretary-missing-template', {
                        committeeName,
                        affectedCount: rows.length,
                        adminUrl: `${SITE_URL}/beheer/nda/${committeeId}`,
                    });
                }
            }
            continue;
        }
        const template = templateRows[0];

        const notified: { name: string; email: string }[] = [];

        for (const row of rows) {
            const memberRows = await db.select({ email: schema.directus_users.email, firstName: schema.directus_users.first_name, lastName: schema.directus_users.last_name })
                .from(schema.directus_users).where(eq(schema.directus_users.id, row.user_id)).limit(1);
            const member = memberRows[0];
            if (!member.email) continue;

            const inserted = await db.insert(schema.nda_signatures).values({
                nda_template_id: template.id,
                committee_id: committeeId,
                user_id: row.user_id,
                status: 'pending',
                sent_at: new Date().toISOString(),
            }).returning({ id: schema.nda_signatures.id });

            const signatureId = inserted[0]?.id;
            if (!signatureId) continue;

            const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
            const sent = await sendNdaMail(member.email, 'nda-renewal-reminder', {
                name,
                committeeName,
                signUrl: `${SITE_URL}/profiel/nda/${signatureId}`,
            });
            if (sent) {
                notified.push({ name, email: member.email });
                renewalsSent++;
            }

            await db.update(schema.nda_signatures).set({ reminder_sent_at: new Date().toISOString() }).where(eq(schema.nda_signatures.id, row.id));
        }

        await notifySecretaryOfBatch(committeeName, notified, committeeId);
    }

    return { expiredCount: expiredResult.length, renewalsSent };
}

export async function checkExpiredAndRenewNdas(): Promise<{ expiredCount: number; renewalsSent: number }> {
    await requireAdminResource(AdminResource.Nda);
    const result = await runNdaExpiryCheckInternal();
    revalidatePath('/beheer/nda');
    return result;
}
