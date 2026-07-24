'use server';

import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db, schema } from '@salvemundi/db';
import { vacancyAdminSchema, type VacancyAdminForm, type VacancySubmissionDTO } from '@salvemundi/validations';
import { enforceFeatureAccess } from '@/server/actions/admin/admin-utils.actions';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { sendVacancyMail } from './vacancy-mail.utils';

function revalidateVacancyPaths() {
    revalidatePath('/beheer/bijbanenbank');
    revalidatePath('/bijbanenbank');
}

async function resolveDirectionIds(names: string[]): Promise<number[]> {
    if (names.length === 0) return [];
    const rows = await db.select({ id: schema.vacancy_ict_directions.id, name: schema.vacancy_ict_directions.name })
        .from(schema.vacancy_ict_directions)
        .where(inArray(schema.vacancy_ict_directions.name, names));
    return rows.map((r) => r.id);
}

export async function getAdminVacancies() {
    await enforceFeatureAccess('vacatures');
    return db.query.vacancies.findMany({
        orderBy: (v, { desc }) => [desc(v.published_at)],
        with: { vacancy_direction_links: { with: { vacancy_ict_direction: true } } }
    });
}

export async function getAdminVacancyById(id: number) {
    await enforceFeatureAccess('vacatures');
    const row = await db.query.vacancies.findFirst({
        where: eq(schema.vacancies.id, id),
        with: { vacancy_direction_links: { with: { vacancy_ict_direction: true } } }
    });
    if (!row) return null;

    return {
        id: row.id,
        title: row.title,
        company: row.company,
        description: row.description,
        type: row.type as VacancyAdminForm['type'],
        contact_email: row.contact_email,
        contact_phone: row.contact_phone ?? '',
        contact_website: row.contact_website ?? '',
        location: row.location,
        salary: row.salary ?? '',
        employment_type: row.employment_type ?? '',
        working_hours: row.working_hours ?? '',
        is_visible: row.is_visible,
        directions: row.vacancy_direction_links.map((l) => l.vacancy_ict_direction.name)
    };
}

export async function getPendingSubmissions(): Promise<VacancySubmissionDTO[]> {
    await enforceFeatureAccess('vacatures');
    const rows = await db.query.vacancy_submissions.findMany({
        orderBy: (s, { desc }) => [desc(s.created_at)],
        with: { vacancy_submission_direction_links: { with: { vacancy_ict_direction: true } } }
    });

    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        company: row.company,
        description: row.description,
        type: row.type as VacancySubmissionDTO['type'],
        contact_email: row.contact_email,
        contact_phone: row.contact_phone,
        contact_website: row.contact_website,
        location: row.location,
        salary: row.salary,
        employment_type: row.employment_type,
        working_hours: row.working_hours,
        directions: row.vacancy_submission_direction_links.map((l) => l.vacancy_ict_direction.name),
        status: row.status as VacancySubmissionDTO['status'],
        rejection_reason: row.rejection_reason,
        reviewed_by: row.reviewed_by,
        reviewed_at: row.reviewed_at,
        approved_vacancy_id: row.approved_vacancy_id,
        verified_at: row.verified_at,
        created_at: row.created_at
    }));
}

export async function createVacancyAction(data: VacancyAdminForm) {
    const { user } = await enforceFeatureAccess('vacatures');

    const parsed = vacancyAdminSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Ongeldige invoer.', fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const value = parsed.data;

    try {
        const [inserted] = await db.insert(schema.vacancies).values({
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
            is_visible: value.is_visible,
            created_by: user.id
        }).returning({ id: schema.vacancies.id });

        if (value.type === 'internship' && value.directions.length > 0) {
            const directionIds = await resolveDirectionIds(value.directions);
            if (directionIds.length > 0) {
                await db.insert(schema.vacancy_direction_links).values(
                    directionIds.map((vacancy_ict_directions_id) => ({ vacancies_id: inserted.id, vacancy_ict_directions_id }))
                );
            }
        }

        await logAdminAction('admin_vacancy_created', 'SUCCESS', { context: 'vacature', context_name: value.title, id: inserted.id });
        revalidateVacancyPaths();
        return { success: true, id: inserted.id };
    } catch (error) {
        safeConsoleError('[vacancies-admin.actions.ts][createVacancyAction] ', error);
        return { success: false, error: 'Aanmaken van de vacature is mislukt.' };
    }
}

export async function updateVacancyAction(id: number, data: VacancyAdminForm) {
    await enforceFeatureAccess('vacatures');

    const parsed = vacancyAdminSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Ongeldige invoer.', fieldErrors: parsed.error.flatten().fieldErrors };
    }
    const value = parsed.data;

    try {
        await db.update(schema.vacancies).set({
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
            is_visible: value.is_visible,
            updated_at: new Date().toISOString()
        }).where(eq(schema.vacancies.id, id));

        await db.delete(schema.vacancy_direction_links).where(eq(schema.vacancy_direction_links.vacancies_id, id));
        if (value.type === 'internship' && value.directions.length > 0) {
            const directionIds = await resolveDirectionIds(value.directions);
            if (directionIds.length > 0) {
                await db.insert(schema.vacancy_direction_links).values(
                    directionIds.map((vacancy_ict_directions_id) => ({ vacancies_id: id, vacancy_ict_directions_id }))
                );
            }
        }

        await logAdminAction('admin_vacancy_updated', 'SUCCESS', { context: 'vacature', context_name: value.title, id });
        revalidateVacancyPaths();
        return { success: true };
    } catch (error) {
        safeConsoleError('[vacancies-admin.actions.ts][updateVacancyAction] ', error);
        return { success: false, error: 'Bijwerken van de vacature is mislukt.' };
    }
}

export async function deleteVacancyAction(id: number) {
    await enforceFeatureAccess('vacatures');

    try {
        await db.delete(schema.vacancies).where(eq(schema.vacancies.id, id));
        await logAdminAction('admin_vacancy_deleted', 'SUCCESS', { context: 'vacature', id });
        revalidateVacancyPaths();
        return { success: true };
    } catch (error) {
        safeConsoleError('[vacancies-admin.actions.ts][deleteVacancyAction] ', error);
        return { success: false, error: 'Verwijderen van de vacature is mislukt.' };
    }
}

export async function approveSubmissionAction(submissionId: number) {
    const { user } = await enforceFeatureAccess('vacatures');

    try {
        const submission = await db.query.vacancy_submissions.findFirst({
            where: eq(schema.vacancy_submissions.id, submissionId),
            with: { vacancy_submission_direction_links: { with: { vacancy_ict_direction: true } } }
        });

        if (!submission) return { success: false, error: 'Aanmelding niet gevonden.' };
        if (submission.status !== 'pending_review') {
            return { success: false, error: 'Deze aanmelding is niet gereed voor goedkeuring.' };
        }

        const [vacancy] = await db.insert(schema.vacancies).values({
            title: submission.title,
            company: submission.company,
            description: submission.description,
            type: submission.type,
            contact_email: submission.contact_email,
            contact_phone: submission.contact_phone,
            contact_website: submission.contact_website,
            location: submission.location,
            salary: submission.salary,
            employment_type: submission.employment_type,
            working_hours: submission.working_hours,
            is_visible: true
        }).returning({ id: schema.vacancies.id });

        const directionIds = submission.vacancy_submission_direction_links.map((l) => l.vacancy_ict_direction.id);
        if (directionIds.length > 0) {
            await db.insert(schema.vacancy_direction_links).values(
                directionIds.map((vacancy_ict_directions_id) => ({ vacancies_id: vacancy.id, vacancy_ict_directions_id }))
            );
        }

        const now = new Date().toISOString();
        await db.update(schema.vacancy_submissions).set({
            status: 'approved',
            approved_vacancy_id: vacancy.id,
            reviewed_by: user.id,
            reviewed_at: now
        }).where(eq(schema.vacancy_submissions.id, submissionId));

        await sendVacancyMail(submission.contact_email, 'vacancy_approved', {
            firstName: submission.company,
            title: submission.title
        });

        await logAdminAction('admin_vacancy_submission_approved', 'SUCCESS', { context: 'vacature', context_name: submission.title, id: submissionId, vacancy_id: vacancy.id });
        revalidateVacancyPaths();
        return { success: true, vacancyId: vacancy.id };
    } catch (error) {
        safeConsoleError('[vacancies-admin.actions.ts][approveSubmissionAction] ', error);
        return { success: false, error: 'Goedkeuren van de aanmelding is mislukt.' };
    }
}

export async function rejectSubmissionAction(submissionId: number, reason: string) {
    const { user } = await enforceFeatureAccess('vacatures');

    if (!reason || reason.trim().length === 0) {
        return { success: false, error: 'Geef een reden op voor afwijzing.' };
    }

    try {
        const submission = await db.query.vacancy_submissions.findFirst({
            where: eq(schema.vacancy_submissions.id, submissionId)
        });
        if (!submission) return { success: false, error: 'Aanmelding niet gevonden.' };

        const now = new Date().toISOString();
        await db.update(schema.vacancy_submissions).set({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_by: user.id,
            reviewed_at: now
        }).where(eq(schema.vacancy_submissions.id, submissionId));

        await sendVacancyMail(submission.contact_email, 'vacancy_rejected', {
            firstName: submission.company,
            title: submission.title,
            reason
        });

        await logAdminAction('admin_vacancy_submission_rejected', 'SUCCESS', { context: 'vacature', context_name: submission.title, id: submissionId });
        revalidateVacancyPaths();
        return { success: true };
    } catch (error) {
        safeConsoleError('[vacancies-admin.actions.ts][rejectSubmissionAction] ', error);
        return { success: false, error: 'Afwijzen van de aanmelding is mislukt.' };
    }
}
