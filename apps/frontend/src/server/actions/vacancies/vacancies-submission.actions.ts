'use server';

import { after } from 'next/server';
import { z } from 'zod';
import { vacancySubmissionSchema, type VacancySubmissionForm } from '@salvemundi/validations';
import { withAction } from '@/server/actions/action-wrapper';
import { extractBaseVacancyFormFields, extractVacancyAttachments } from './vacancy-form.utils';
import { createVacancyService } from './vacancy-service.utils';

export type SubmitVacancyResult =
    | { success: true }
    | { success: false; error: string; message?: string; errors?: undefined };

export type VerifySubmissionResult =
    | { success: true; alreadyVerified?: boolean }
    | { success: false; error: string };

const submissionWithFilesSchema = z.object({
    fields: vacancySubmissionSchema,
    imageFile: z.custom<File | null>((value) => value === null || value instanceof File),
    documentFile: z.custom<File | null>((value) => value === null || value instanceof File),
});

type ParsedSubmissionInput = {
    fields: VacancySubmissionForm;
    imageFile: File | null;
    documentFile: File | null;
};

const verifyTokenSchema = z.string().trim().min(1, 'Ongeldige verificatielink.');

const executeSubmitVacancy = withAction<FormData, ParsedSubmissionInput, SubmitVacancyResult>({
    actionName: 'vacancies-submission.actions.ts][submitVacancy',
    rateLimit: {
        key: 'vacancy-submission',
        limit: 5,
        windowSeconds: 3600,
        errorMessage: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het later opnieuw.',
    },
    honeypot: (formData) => formData.get('hp_confirm'),
    honeypotErrorMessage: 'Spam gedetecteerd.',
    schema: submissionWithFilesSchema,
    mapInput: (formData) => {
        const baseFields = extractBaseVacancyFormFields(formData);
        const attachments = extractVacancyAttachments(formData);
        return {
            fields: {
                ...baseFields,
                hp_confirm: formData.get('hp_confirm') ?? undefined,
            },
            imageFile: attachments.imageFile,
            documentFile: attachments.documentFile,
        };
    },
    validationErrorMessage: 'Ongeldige invoer. Controleer de ingevulde velden.',
    fallbackErrorMessage: 'Er ging iets mis bij het versturen van je aanmelding.',
    handler: async (input, ctx) => {
        const [submitterIp, baseUrl] = await Promise.all([ctx.getClientIp(), ctx.getBaseUrl()]);
        return createVacancyService().submitVacancy({
            data: input.fields,
            imageFile: input.imageFile,
            documentFile: input.documentFile,
            submitterIp,
            baseUrl,
            scheduleBackground: (task) => after(task),
        });
    },
});

const executeVerifySubmission = withAction<string, string, VerifySubmissionResult>({
    actionName: 'vacancies-submission.actions.ts][verifySubmission',
    schema: verifyTokenSchema,
    validationErrorMessage: 'Ongeldige verificatielink.',
    fallbackErrorMessage: 'Er ging iets mis bij het verifiëren van je e-mailadres.',
    handler: async (token, ctx) => {
        const baseUrl = await ctx.getBaseUrl();
        return createVacancyService().verifySubmission(token, {
            baseUrl,
            scheduleBackground: (task) => after(task),
        });
    },
});

export async function submitVacancy(formData: FormData): Promise<SubmitVacancyResult> {
    return executeSubmitVacancy(formData);
}

export async function verifySubmission(token: string): Promise<VerifySubmissionResult> {
    return executeVerifySubmission(token);
}
