'use server';

import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { and, eq, gt, inArray } from 'drizzle-orm';
import { db, schema } from '@salvemundi/db';
import { vacancySubmissionSchema } from '@salvemundi/validations';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { checkRateLimit } from '@/server/utils/ratelimit';
import { safeConsoleError } from '@/server/utils/logger';
import { uploadToDirectus, uploadDocumentToDirectus } from '@/server/utils/media';
import { sendVacancyMail, sendVacancyBulkMail } from './vacancy-mail.utils';
import { parseJsonArray } from './vacancy-form.utils';

const TOKEN_TTL_HOURS = 48;
const DUPLICATE_WINDOW_HOURS = 24;

async function getSubmitterIp(): Promise<string> {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    return forwarded?.split(',')[0].trim() || h.get('x-real-ip') || 'unknown';
}

function buildVerificationUrl(token: string): string {
    const baseUrl = process.env.PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/bijbanenbank/verifieer?token=${token}`;
}

async function resolveDirectionIds(names: string[]): Promise<number[]> {
    if (names.length === 0) return [];
    const rows = await db.select({ id: schema.vacancy_ict_directions.id, name: schema.vacancy_ict_directions.name })
        .from(schema.vacancy_ict_directions)
        .where(inArray(schema.vacancy_ict_directions.name, names));
    return rows.map((r) => r.id);
}

async function issueVerificationToken(submissionId: number): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);
    await db.insert(schema.vacancy_verification_tokens).values({
        submission_id: submissionId,
        token,
        expires_at: expiresAt.toISOString()
    });
    return token;
}

export async function submitVacancy(formData: FormData) {
    const rateLimitResult = await checkRateLimit('vacancy-submission', 5, 3600, 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het later opnieuw.');
    if (!rateLimitResult.success) return rateLimitResult;

    const parsed = vacancySubmissionSchema.safeParse({
        title: formData.get('title'),
        company: formData.get('company'),
        description: formData.get('description'),
        type: formData.get('type'),
        contact_email: formData.get('contact_email'),
        contact_phone: formData.get('contact_phone'),
        contact_website: formData.get('contact_website'),
        location: formData.get('location'),
        salary: formData.get('salary'),
        employment_type: formData.get('employment_type'),
        working_hours: formData.get('working_hours'),
        directions: parseJsonArray(formData.get('directions')),
        skills: parseJsonArray(formData.get('skills')),
        hp_confirm: formData.get('hp_confirm')
    });
    if (!parsed.success) {
        return { success: false, error: 'Ongeldige invoer. Controleer de ingevulde velden.' };
    }

    if (parsed.data.hp_confirm) {
        return { success: false, error: 'Spam gedetecteerd.' };
    }

    const value = parsed.data;

    const imageUpload = await uploadToDirectus(formData.get('imageFile') as File | null, 5 * 1024 * 1024);
    if (!imageUpload.success) return { success: false, error: imageUpload.error };

    const documentUpload = await uploadDocumentToDirectus(formData.get('documentFile') as File | null);
    if (!documentUpload.success) return { success: false, error: documentUpload.error };

    try {
        const dedupeSince = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
        const existing = await db.select({ id: schema.vacancy_submissions.id, status: schema.vacancy_submissions.status })
            .from(schema.vacancy_submissions)
            .where(and(
                eq(schema.vacancy_submissions.contact_email, value.contact_email),
                eq(schema.vacancy_submissions.company, value.company),
                eq(schema.vacancy_submissions.title, value.title),
                gt(schema.vacancy_submissions.created_at, dedupeSince),
                inArray(schema.vacancy_submissions.status, ['pending_verification', 'pending_review'])
            ))
            .limit(1);

        let submissionId: number;

        if (existing.length > 0) {
            submissionId = existing[0].id;
            if (existing[0].status === 'pending_review') {
                // Already verified and awaiting admin review — nothing more to send.
                return { success: true };
            }
        } else {
            const submitterIp = await getSubmitterIp();
            const [inserted] = await db.insert(schema.vacancy_submissions).values({
                title: value.title,
                company: value.company,
                description: value.description,
                type: value.type,
                contact_email: value.contact_email,
                contact_phone: value.contact_phone || null,
                contact_website: value.contact_website || null,
                location: value.location,
                salary: value.salary || null,
                employment_type: value.employment_type || null,
                working_hours: value.working_hours || null,
                skills: value.skills,
                image: imageUpload.id,
                document: documentUpload.id,
                submitter_ip: submitterIp
            }).returning({ id: schema.vacancy_submissions.id });
            submissionId = inserted.id;

            if (value.type === 'internship' && value.directions.length > 0) {
                const directionIds = await resolveDirectionIds(value.directions);
                if (directionIds.length > 0) {
                    await db.insert(schema.vacancy_submission_direction_links_).values(
                        directionIds.map((vacancy_ict_directions_id) => ({ vacancy_submissions_id: submissionId, vacancy_ict_directions_id }))
                    );
                }
            }
        }

        const token = await issueVerificationToken(submissionId);
        await sendVacancyMail(value.contact_email, 'vacancy_verification', {
            firstName: value.company,
            title: value.title,
            confirmationUrl: buildVerificationUrl(token)
        });

        return { success: true };
    } catch (error) {
        safeConsoleError('[vacancies-submission.actions.ts][submitVacancy] ', error);
        return { success: false, error: 'Er ging iets mis bij het versturen van je aanmelding.' };
    }
}

export async function verifySubmission(token: string) {
    if (!token) return { success: false, error: 'Ongeldige verificatielink.' };

    try {
        const now = new Date().toISOString();
        const rows = await db.select({
            tokenId: schema.vacancy_verification_tokens.id,
            submissionId: schema.vacancy_verification_tokens.submission_id,
            expiresAt: schema.vacancy_verification_tokens.expires_at,
            usedAt: schema.vacancy_verification_tokens.used_at,
            title: schema.vacancy_submissions.title,
            company: schema.vacancy_submissions.company,
            status: schema.vacancy_submissions.status
        })
            .from(schema.vacancy_verification_tokens)
            .innerJoin(schema.vacancy_submissions, eq(schema.vacancy_verification_tokens.submission_id, schema.vacancy_submissions.id))
            .where(eq(schema.vacancy_verification_tokens.token, token))
            .limit(1);

        if (rows.length === 0) {
            return { success: false, error: 'Deze verificatielink is ongeldig.' };
        }

        const row = rows[0];

        if (row.usedAt) {
            return row.status === 'pending_verification'
                ? { success: false, error: 'Deze verificatielink is al gebruikt.' }
                : { success: true, alreadyVerified: true };
        }

        if (new Date(row.expiresAt).getTime() < Date.now()) {
            return { success: false, error: 'Deze verificatielink is verlopen. Vraag een nieuwe aan via het aanmeldformulier.' };
        }

        await db.update(schema.vacancy_verification_tokens)
            .set({ used_at: now })
            .where(eq(schema.vacancy_verification_tokens.id, row.tokenId));

        await db.update(schema.vacancy_submissions)
            .set({ status: 'pending_review', verified_at: now })
            .where(eq(schema.vacancy_submissions.id, row.submissionId));

        await notifyAdminsOfPendingSubmission(row.title, row.company);

        return { success: true };
    } catch (error) {
        safeConsoleError('[vacancies-submission.actions.ts][verifySubmission] ', error);
        return { success: false, error: 'Er ging iets mis bij het verifiëren van je e-mailadres.' };
    }
}

async function notifyAdminsOfPendingSubmission(title: string, company: string): Promise<void> {
    try {
        const recipients = await db.select({
            email: schema.directus_users.email,
            first_name: schema.directus_users.first_name,
            last_name: schema.directus_users.last_name
        })
            .from(schema.committee_members)
            .innerJoin(schema.directus_users, eq(schema.committee_members.user_id, schema.directus_users.id))
            .innerJoin(schema.committees, eq(schema.committee_members.committee_id, schema.committees.id))
            .where(and(
                eq(schema.committees.azure_group_id, COMMITTEES.BESTUUR),
                eq(schema.committee_members.is_visible, true)
            ));

        const mailRecipients = recipients
            .filter((r) => !!r.email)
            .map((r) => ({ email: r.email as string, name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Bestuur' }));

        if (mailRecipients.length === 0) return;

        const adminUrl = `${process.env.PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || ''}/beheer/bijbanenbank`;
        await sendVacancyBulkMail(mailRecipients, 'Nieuwe Vacature ter Beoordeling', 'vacancy_admin_notification', {
            title,
            company,
            adminUrl
        });
    } catch (error) {
        safeConsoleError('[vacancies-submission.actions.ts][notifyAdminsOfPendingSubmission] ', error);
    }
}
