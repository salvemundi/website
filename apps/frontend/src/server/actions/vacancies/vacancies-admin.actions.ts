'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { vacancyAdminSchema, type VacancyAdminForm, type VacancySubmissionDTO } from '@salvemundi/validations';
import {
    withAdminAction,
    withAdminQueryAction,
    type ActionFieldErrors,
} from '@/server/actions/action-wrapper';
import { logAuditAction } from '@/server/actions/infrastructure/audit.actions';
import type { AdminVacancyDetailDTO, AdminVacancyListItemDTO } from '@/server/dto/vacancy.dto';
import { extractBaseVacancyFormFields, extractVacancyAttachments } from './vacancy-form.utils';
import { createVacancyService } from './vacancy-service.utils';

export type CreateVacancyResult =
    | { success: true; id: number }
    | { success: false; error: string; fieldErrors?: ActionFieldErrors };

export type UpdateVacancyResult =
    | { success: true }
    | { success: false; error: string; fieldErrors?: ActionFieldErrors };

export type DeleteVacancyResult =
    | { success: true }
    | { success: false; error: string };

export type ApproveSubmissionResult =
    | { success: true; vacancyId: number }
    | { success: false; error: string };

export type RejectSubmissionResult =
    | { success: true }
    | { success: false; error: string };

export type DeleteSubmissionResult =
    | { success: true }
    | { success: false; error: string };

function revalidateVacancyPaths(): void {
    revalidatePath('/beheer/bijbanenbank');
    revalidatePath('/bijbanenbank');
}

const positiveIdSchema = z.number().int().positive();

const createVacancyInputSchema = z.object({
    fields: vacancyAdminSchema,
    imageFile: z.custom<File | null>((value) => value === null || value instanceof File),
    documentFile: z.custom<File | null>((value) => value === null || value instanceof File),
});

const updateVacancyInputSchema = z.object({
    id: positiveIdSchema,
    fields: vacancyAdminSchema,
    imageFile: z.custom<File | null>((value) => value === null || value instanceof File),
    documentFile: z.custom<File | null>((value) => value === null || value instanceof File),
    removeImage: z.boolean(),
    removeDocument: z.boolean(),
});

const rejectSubmissionInputSchema = z.object({
    submissionId: positiveIdSchema,
    reason: z.string().trim().min(1, 'Geef een reden op voor afwijzing.').max(1000),
});

function buildAdminFieldsCandidate(formData: FormData) {
    return {
        ...extractBaseVacancyFormFields(formData),
        is_visible: formData.get('is_visible') === 'true',
    };
}

const executeGetAdminVacancies = withAdminQueryAction<void, void, AdminVacancyListItemDTO[]>({
    actionName: 'vacancies-admin.actions.ts][getAdminVacancies',
    feature: 'vacatures',
    fallbackValue: [],
    handler: async () => createVacancyService().getAdminVacancies(),
});

const executeGetAdminVacancyById = withAdminQueryAction<number, number, AdminVacancyDetailDTO | null>({
    actionName: 'vacancies-admin.actions.ts][getAdminVacancyById',
    feature: 'vacatures',
    schema: positiveIdSchema,
    fallbackValue: null,
    handler: async (id) => createVacancyService().getAdminVacancyById(id),
});

const executeGetPendingSubmissions = withAdminQueryAction<void, void, VacancySubmissionDTO[]>({
    actionName: 'vacancies-admin.actions.ts][getPendingSubmissions',
    feature: 'vacatures',
    fallbackValue: [],
    handler: async () => createVacancyService().getPendingSubmissions(),
});

const executeCreateVacancy = withAdminAction<
    FormData,
    { fields: VacancyAdminForm; imageFile: File | null; documentFile: File | null },
    CreateVacancyResult
>({
    actionName: 'vacancies-admin.actions.ts][createVacancyAction',
    feature: 'vacatures',
    schema: createVacancyInputSchema,
    mapInput: (formData) => {
        const attachments = extractVacancyAttachments(formData);
        return {
            fields: buildAdminFieldsCandidate(formData),
            imageFile: attachments.imageFile,
            documentFile: attachments.documentFile,
        };
    },
    validationErrorMessage: 'Ongeldige invoer.',
    fallbackErrorMessage: 'Aanmaken van de vacature is mislukt.',
    handler: async (input, ctx) => {
        const outcome = await createVacancyService().createVacancy({
            data: input.fields,
            imageFile: input.imageFile,
            documentFile: input.documentFile,
            createdBy: ctx.userId,
        });

        if (!outcome.success) {
            return { success: false, error: outcome.error };
        }

        await logAuditAction('admin_vacancy_created', 'SUCCESS', {
            context: 'vacature',
            context_name: input.fields.title,
            id: outcome.id,
        });
        revalidateVacancyPaths();
        return { success: true, id: outcome.id };
    },
});

const executeUpdateVacancy = withAdminAction<
    { id: number; formData: FormData },
    {
        id: number;
        fields: VacancyAdminForm;
        imageFile: File | null;
        documentFile: File | null;
        removeImage: boolean;
        removeDocument: boolean;
    },
    UpdateVacancyResult
>({
    actionName: 'vacancies-admin.actions.ts][updateVacancyAction',
    feature: 'vacatures',
    schema: updateVacancyInputSchema,
    mapInput: ({ id, formData }) => {
        const attachments = extractVacancyAttachments(formData);
        return {
            id,
            fields: buildAdminFieldsCandidate(formData),
            imageFile: attachments.imageFile,
            documentFile: attachments.documentFile,
            removeImage: formData.get('removeImage') === 'true',
            removeDocument: formData.get('removeDocument') === 'true',
        };
    },
    validationErrorMessage: 'Ongeldige invoer.',
    fallbackErrorMessage: 'Bijwerken van de vacature is mislukt.',
    handler: async (input) => {
        const outcome = await createVacancyService().updateVacancy({
            id: input.id,
            data: input.fields,
            imageFile: input.imageFile,
            documentFile: input.documentFile,
            removeImage: input.removeImage,
            removeDocument: input.removeDocument,
        });

        if (!outcome.success) {
            return { success: false, error: outcome.error };
        }

        await logAuditAction('admin_vacancy_updated', 'SUCCESS', {
            context: 'vacature',
            context_name: input.fields.title,
            id: input.id,
        });
        revalidateVacancyPaths();
        return { success: true };
    },
});

const executeDeleteVacancy = withAdminAction<number, number, DeleteVacancyResult>({
    actionName: 'vacancies-admin.actions.ts][deleteVacancyAction',
    feature: 'vacatures',
    schema: positiveIdSchema,
    validationErrorMessage: 'Ongeldig vacature-ID.',
    fallbackErrorMessage: 'Verwijderen van de vacature is mislukt.',
    handler: async (id) => {
        const outcome = await createVacancyService().deleteVacancy(id);
        if (!outcome.success) {
            return { success: false, error: outcome.error };
        }

        await logAuditAction('admin_vacancy_deleted', 'SUCCESS', { context: 'vacature', id });
        revalidateVacancyPaths();
        return { success: true };
    },
});

const executeApproveSubmission = withAdminAction<number, number, ApproveSubmissionResult>({
    actionName: 'vacancies-admin.actions.ts][approveSubmissionAction',
    feature: 'vacatures',
    schema: positiveIdSchema,
    validationErrorMessage: 'Ongeldig aanmeldings-ID.',
    fallbackErrorMessage: 'Goedkeuren van de aanmelding is mislukt.',
    handler: async (submissionId, ctx) => {
        const outcome = await createVacancyService().approveSubmission(submissionId, ctx.userId);
        if (!outcome.success) {
            return { success: false, error: outcome.error };
        }

        await logAuditAction('admin_vacancy_submission_approved', 'SUCCESS', {
            context: 'vacature',
            context_name: outcome.title,
            id: submissionId,
            vacancy_id: outcome.vacancyId,
        });
        revalidateVacancyPaths();
        return { success: true, vacancyId: outcome.vacancyId };
    },
});

const executeRejectSubmission = withAdminAction<
    { submissionId: number; reason: string },
    { submissionId: number; reason: string },
    RejectSubmissionResult
>({
    actionName: 'vacancies-admin.actions.ts][rejectSubmissionAction',
    feature: 'vacatures',
    schema: rejectSubmissionInputSchema,
    validationErrorMessage: 'Geef een reden op voor afwijzing.',
    fallbackErrorMessage: 'Afwijzen van de aanmelding is mislukt.',
    handler: async (input, ctx) => {
        const outcome = await createVacancyService().rejectSubmission(
            input.submissionId,
            input.reason,
            ctx.userId
        );
        if (!outcome.success) {
            return { success: false, error: outcome.error };
        }

        await logAuditAction('admin_vacancy_submission_rejected', 'SUCCESS', {
            context: 'vacature',
            context_name: outcome.title,
            id: input.submissionId,
        });
        revalidateVacancyPaths();
        return { success: true };
    },
});

const executeDeleteSubmission = withAdminAction<number, number, DeleteSubmissionResult>({
    actionName: 'vacancies-admin.actions.ts][deleteSubmissionAction',
    feature: 'vacatures',
    schema: positiveIdSchema,
    validationErrorMessage: 'Ongeldig aanmeldings-ID.',
    fallbackErrorMessage: 'Verwijderen van de aanmelding is mislukt.',
    handler: async (submissionId) => {
        const outcome = await createVacancyService().deleteSubmission(submissionId);
        if (!outcome.success) {
            return { success: false, error: outcome.error };
        }

        await logAuditAction('admin_vacancy_submission_deleted', 'SUCCESS', {
            context: 'vacature',
            context_name: outcome.title,
            id: submissionId,
        });
        revalidateVacancyPaths();
        return { success: true };
    },
});

export async function getAdminVacancies(): Promise<AdminVacancyListItemDTO[]> {
    return executeGetAdminVacancies(undefined);
}

export async function getAdminVacancyById(id: number): Promise<AdminVacancyDetailDTO | null> {
    return executeGetAdminVacancyById(id);
}

export async function getPendingSubmissions(): Promise<VacancySubmissionDTO[]> {
    return executeGetPendingSubmissions(undefined);
}

export async function createVacancyAction(formData: FormData): Promise<CreateVacancyResult> {
    return executeCreateVacancy(formData);
}

export async function updateVacancyAction(id: number, formData: FormData): Promise<UpdateVacancyResult> {
    return executeUpdateVacancy({ id, formData });
}

export async function deleteVacancyAction(id: number): Promise<DeleteVacancyResult> {
    return executeDeleteVacancy(id);
}

export async function approveSubmissionAction(submissionId: number): Promise<ApproveSubmissionResult> {
    return executeApproveSubmission(submissionId);
}

export async function rejectSubmissionAction(
    submissionId: number,
    reason: string
): Promise<RejectSubmissionResult> {
    return executeRejectSubmission({ submissionId, reason });
}

export async function deleteSubmissionAction(submissionId: number): Promise<DeleteSubmissionResult> {
    return executeDeleteSubmission(submissionId);
}
