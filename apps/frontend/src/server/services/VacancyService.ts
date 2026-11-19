import crypto from 'node:crypto';
import type { VacancyAdminForm, VacancySubmissionForm } from '@salvemundi/validations';
import type {
    AdminVacancyDetailDTO,
    AdminVacancyListItemDTO,
    VacancyDTO,
    VacancySubmissionDTO,
} from '@/server/dto/vacancy.dto';
import type {
    CreateSubmissionRecordInput,
    CreateVacancyRecordInput,
    PublishedApprovedVacancyRecord,
    SubmissionSummaryRecord,
    UpdateVacancyRecordInput,
    VerificationTokenLookupRecord,
} from '@/server/repositories/VacancyRepository';

const TOKEN_TTL_HOURS = 48;
const DUPLICATE_WINDOW_HOURS = 24;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export interface VacancyRepositoryPort {
    findVisibleVacancies(): Promise<VacancyDTO[]>;
    findVisibleVacancyById(id: number): Promise<VacancyDTO | null>;
    findAllAdminVacancies(): Promise<AdminVacancyListItemDTO[]>;
    findAdminVacancyById(id: number): Promise<AdminVacancyDetailDTO | null>;
    findAllSubmissions(): Promise<VacancySubmissionDTO[]>;
    createVacancy(input: CreateVacancyRecordInput): Promise<number>;
    updateVacancy(id: number, input: UpdateVacancyRecordInput): Promise<void>;
    deleteVacancy(id: number): Promise<void>;
    findSubmissionById(submissionId: number): Promise<SubmissionSummaryRecord | null>;
    publishApprovedSubmission(
        submissionId: number,
        reviewerUserId: string,
        nowIso: string
    ): Promise<PublishedApprovedVacancyRecord | null>;
    markSubmissionRejected(
        submissionId: number,
        reason: string,
        reviewerUserId: string,
        reviewedAtIso: string
    ): Promise<void>;
    deleteSubmission(submissionId: number): Promise<void>;
    findRecentActiveSubmission(input: {
        contactEmail: string;
        company: string;
        title: string;
        sinceIso: string;
    }): Promise<{ id: number; status: string | null } | null>;
    createSubmission(input: CreateSubmissionRecordInput): Promise<number>;
    createVerificationToken(submissionId: number, token: string, expiresAtIso: string): Promise<void>;
    findVerificationTokenRecord(token: string): Promise<VerificationTokenLookupRecord | null>;
    markSubmissionVerified(tokenId: number, submissionId: number, verifiedAtIso: string): Promise<void>;
    findBoardNotificationRecipients(): Promise<{ email: string; name: string }[]>;
}

export type VacancyUploadOutcome =
    | { success: true; id: string | null }
    | { success: false; error: string };

export interface VacancyMediaStoragePort {
    uploadImage(file: File | null, maxSizeBytes: number): Promise<VacancyUploadOutcome>;
    uploadDocument(file: File | null): Promise<VacancyUploadOutcome>;
}

export interface VacancyMailPayload {
    firstName?: string;
    title?: string;
    company?: string;
    confirmationUrl?: string;
    adminUrl?: string;
    reason?: string;
}

export interface VacancyMailerPort {
    sendMail(to: string, templateId: string, data: VacancyMailPayload): Promise<boolean>;
    sendBulkMail(
        recipients: { email: string; name: string }[],
        subject: string,
        template: string,
        data: VacancyMailPayload
    ): Promise<boolean>;
}

export type BackgroundTaskScheduler = (task: () => Promise<void>) => void;

export interface CreateVacancyCommand {
    data: VacancyAdminForm;
    imageFile: File | null;
    documentFile: File | null;
    createdBy: string;
}

export interface UpdateVacancyCommand {
    id: number;
    data: VacancyAdminForm;
    imageFile: File | null;
    documentFile: File | null;
    removeImage: boolean;
    removeDocument: boolean;
}

export interface SubmitVacancyCommand {
    data: VacancySubmissionForm;
    imageFile: File | null;
    documentFile: File | null;
    submitterIp: string;
    baseUrl: string;
    scheduleBackground?: BackgroundTaskScheduler;
}

export type CreateVacancyOutcome =
    | { success: true; id: number }
    | { success: false; error: string };

export type SimpleVacancyOutcome =
    | { success: true }
    | { success: false; error: string };

export type ApproveSubmissionOutcome =
    | { success: true; vacancyId: number; title: string }
    | { success: false; error: string };

export type SubmissionMutationOutcome =
    | { success: true; title: string }
    | { success: false; error: string };

export type VerifySubmissionOutcome =
    | { success: true; alreadyVerified?: boolean }
    | { success: false; error: string };

export class VacancyService {
    constructor(
        private readonly vacancies: VacancyRepositoryPort,
        private readonly media: VacancyMediaStoragePort,
        private readonly mailer: VacancyMailerPort
    ) {}

    async getPublicVacancies(): Promise<VacancyDTO[]> {
        return this.vacancies.findVisibleVacancies();
    }

    async getPublicVacancyById(id: number): Promise<VacancyDTO | null> {
        return this.vacancies.findVisibleVacancyById(id);
    }

    async getAdminVacancies(): Promise<AdminVacancyListItemDTO[]> {
        return this.vacancies.findAllAdminVacancies();
    }

    async getAdminVacancyById(id: number): Promise<AdminVacancyDetailDTO | null> {
        return this.vacancies.findAdminVacancyById(id);
    }

    async getPendingSubmissions(): Promise<VacancySubmissionDTO[]> {
        return this.vacancies.findAllSubmissions();
    }

    async createVacancy(command: CreateVacancyCommand): Promise<CreateVacancyOutcome> {
        const uploads = await this.uploadAttachments(command.imageFile, command.documentFile);
        if (!uploads.success) {
            return { success: false, error: uploads.error };
        }

        const id = await this.vacancies.createVacancy({
            title: command.data.title,
            company: command.data.company,
            description: command.data.description,
            type: command.data.type,
            contactEmail: command.data.contact_email,
            contactPhone: command.data.contact_phone || null,
            contactWebsite: command.data.contact_website || null,
            location: command.data.location,
            salary: command.data.salary || null,
            employmentType: command.data.employment_type || null,
            workingHours: command.data.working_hours || null,
            isVisible: command.data.is_visible,
            skills: command.data.skills,
            directions: command.data.directions,
            image: uploads.imageId,
            document: uploads.documentId,
            publishedAt: new Date().toISOString(),
            createdBy: command.createdBy,
        });

        return { success: true, id };
    }

    async updateVacancy(command: UpdateVacancyCommand): Promise<SimpleVacancyOutcome> {
        const uploads = await this.uploadAttachments(command.imageFile, command.documentFile);
        if (!uploads.success) {
            return { success: false, error: uploads.error };
        }

        const imagePatch = uploads.imageId
            ? { image: uploads.imageId }
            : command.removeImage
                ? { image: null }
                : {};
        const documentPatch = uploads.documentId
            ? { document: uploads.documentId }
            : command.removeDocument
                ? { document: null }
                : {};

        await this.vacancies.updateVacancy(command.id, {
            title: command.data.title,
            company: command.data.company,
            description: command.data.description,
            type: command.data.type,
            contactEmail: command.data.contact_email,
            contactPhone: command.data.contact_phone || null,
            contactWebsite: command.data.contact_website || null,
            location: command.data.location,
            salary: command.data.salary || null,
            employmentType: command.data.employment_type || null,
            workingHours: command.data.working_hours || null,
            isVisible: command.data.is_visible,
            skills: command.data.skills,
            directions: command.data.directions,
            ...imagePatch,
            ...documentPatch,
            updatedAt: new Date().toISOString(),
        });

        return { success: true };
    }

    async deleteVacancy(id: number): Promise<SimpleVacancyOutcome> {
        await this.vacancies.deleteVacancy(id);
        return { success: true };
    }

    async approveSubmission(submissionId: number, reviewerUserId: string): Promise<ApproveSubmissionOutcome> {
        const existing = await this.vacancies.findSubmissionById(submissionId);
        if (!existing) {
            return { success: false, error: 'Aanmelding niet gevonden.' };
        }
        if (existing.status !== 'pending_review') {
            return { success: false, error: 'Deze aanmelding is niet gereed voor goedkeuring.' };
        }

        const published = await this.vacancies.publishApprovedSubmission(
            submissionId,
            reviewerUserId,
            new Date().toISOString()
        );
        if (!published) {
            return { success: false, error: 'Deze aanmelding is niet gereed voor goedkeuring.' };
        }

        await this.mailer.sendMail(published.contactEmail, 'vacancy_approved', {
            firstName: published.company,
            title: published.title,
        });

        return {
            success: true,
            vacancyId: published.vacancyId,
            title: published.title,
        };
    }

    async rejectSubmission(
        submissionId: number,
        reason: string,
        reviewerUserId: string
    ): Promise<SubmissionMutationOutcome> {
        const trimmedReason = reason.trim();
        if (trimmedReason.length === 0) {
            return { success: false, error: 'Geef een reden op voor afwijzing.' };
        }

        const submission = await this.vacancies.findSubmissionById(submissionId);
        if (!submission) {
            return { success: false, error: 'Aanmelding niet gevonden.' };
        }

        await this.vacancies.markSubmissionRejected(
            submissionId,
            reason,
            reviewerUserId,
            new Date().toISOString()
        );

        await this.mailer.sendMail(submission.contactEmail ?? '', 'vacancy_rejected', {
            firstName: submission.company ?? '',
            title: submission.title ?? '',
            reason,
        });

        return { success: true, title: submission.title ?? '' };
    }

    async deleteSubmission(submissionId: number): Promise<SubmissionMutationOutcome> {
        const submission = await this.vacancies.findSubmissionById(submissionId);
        if (!submission) {
            return { success: false, error: 'Aanmelding niet gevonden.' };
        }

        await this.vacancies.deleteSubmission(submissionId);
        return { success: true, title: submission.title ?? '' };
    }

    async submitVacancy(command: SubmitVacancyCommand): Promise<SimpleVacancyOutcome> {
        const uploads = await this.uploadAttachments(command.imageFile, command.documentFile);
        if (!uploads.success) {
            return { success: false, error: uploads.error };
        }

        const dedupeSince = new Date(Date.now() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
        const existing = await this.vacancies.findRecentActiveSubmission({
            contactEmail: command.data.contact_email,
            company: command.data.company,
            title: command.data.title,
            sinceIso: dedupeSince,
        });

        let submissionId: number;
        if (existing) {
            submissionId = existing.id;
            if (existing.status === 'pending_review') {
                return { success: true };
            }
        } else {
            submissionId = await this.vacancies.createSubmission({
                title: command.data.title,
                company: command.data.company,
                description: command.data.description,
                type: command.data.type,
                contactEmail: command.data.contact_email,
                contactPhone: command.data.contact_phone || null,
                contactWebsite: command.data.contact_website || null,
                location: command.data.location,
                salary: command.data.salary || null,
                employmentType: command.data.employment_type || null,
                workingHours: command.data.working_hours || null,
                skills: command.data.skills,
                directions: command.data.directions,
                image: uploads.imageId,
                document: uploads.documentId,
                submitterIp: command.submitterIp,
            });
        }

        const token = crypto.randomUUID();
        const expiresAtIso = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
        await this.vacancies.createVerificationToken(submissionId, token, expiresAtIso);

        const confirmationUrl = `${command.baseUrl}/bijbanenbank/verifieer?token=${token}`;
        const sendTask = (): Promise<void> =>
            this.mailer
                .sendMail(command.data.contact_email, 'vacancy_verification', {
                    firstName: command.data.company,
                    title: command.data.title,
                    confirmationUrl,
                })
                .then(() => undefined);

        await this.runOrSchedule(sendTask, command.scheduleBackground);
        return { success: true };
    }

    async verifySubmission(
        token: string,
        options: { baseUrl: string; scheduleBackground?: BackgroundTaskScheduler }
    ): Promise<VerifySubmissionOutcome> {
        if (!token) {
            return { success: false, error: 'Ongeldige verificatielink.' };
        }

        const row = await this.vacancies.findVerificationTokenRecord(token);
        if (!row) {
            return { success: false, error: 'Deze verificatielink is ongeldig.' };
        }

        if (row.usedAt) {
            const isPendingVerification =
                row.status === 'pending_verification' || row.status === 'pending_vertification';
            return isPendingVerification
                ? { success: false, error: 'Deze verificatielink is al gebruikt.' }
                : { success: true, alreadyVerified: true };
        }

        if (!row.expiresAt || new Date(row.expiresAt).getTime() < Date.now()) {
            return {
                success: false,
                error: 'Deze verificatielink is verlopen. Vraag een nieuwe aan via het aanmeldformulier.',
            };
        }

        if (!row.submissionId) {
            return { success: false, error: 'Deze verificatielink is ongeldig.' };
        }

        await this.vacancies.markSubmissionVerified(row.tokenId, row.submissionId, new Date().toISOString());

        const notifyTask = async (): Promise<void> => {
            const mailRecipients = await this.vacancies.findBoardNotificationRecipients();
            if (mailRecipients.length === 0) return;

            const adminUrl = `${options.baseUrl}/beheer/bijbanenbank`;
            await this.mailer.sendBulkMail(
                mailRecipients,
                'Nieuwe Vacature ter Beoordeling',
                'vacancy_admin_notification',
                {
                    title: row.title ?? '',
                    company: row.company ?? '',
                    adminUrl,
                }
            );
        };

        await this.runOrSchedule(notifyTask, options.scheduleBackground);
        return { success: true };
    }

    private async uploadAttachments(
        imageFile: File | null,
        documentFile: File | null
    ): Promise<
        | { success: true; imageId: string | null; documentId: string | null }
        | { success: false; error: string }
    > {
        const imageUpload = await this.media.uploadImage(imageFile, MAX_IMAGE_SIZE_BYTES);
        if (!imageUpload.success) {
            return { success: false, error: imageUpload.error };
        }

        const documentUpload = await this.media.uploadDocument(documentFile);
        if (!documentUpload.success) {
            return { success: false, error: documentUpload.error };
        }

        return {
            success: true,
            imageId: imageUpload.id,
            documentId: documentUpload.id,
        };
    }

    private async runOrSchedule(
        task: () => Promise<void>,
        scheduleBackground?: BackgroundTaskScheduler
    ): Promise<void> {
        if (scheduleBackground) {
            scheduleBackground(task);
            return;
        }
        await task();
    }
}
