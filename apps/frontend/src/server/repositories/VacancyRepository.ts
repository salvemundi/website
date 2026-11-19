import 'server-only';

import { and, eq, gt, inArray } from 'drizzle-orm';
import { db, schema } from '@salvemundi/db';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import {
    toAdminVacancyDetailDTO,
    toAdminVacancyListItemDTO,
    toVacancyDTO,
    toVacancySubmissionDTO,
    type AdminVacancyDetailDTO,
    type AdminVacancyListItemDTO,
    type VacancyDTO,
    type VacancySubmissionDTO,
} from '@/server/dto/vacancy.dto';

export interface CreateVacancyRecordInput {
    title: string;
    company: string;
    description: string;
    type: 'internship' | 'parttime';
    contactEmail: string;
    contactPhone: string | null;
    contactWebsite: string | null;
    location: string;
    salary: string | null;
    employmentType: string | null;
    workingHours: string | null;
    isVisible: boolean;
    skills: string[];
    directions: string[];
    image: string | null;
    document: string | null;
    publishedAt: string;
    createdBy: string;
}

export interface UpdateVacancyRecordInput {
    title: string;
    company: string;
    description: string;
    type: 'internship' | 'parttime';
    contactEmail: string;
    contactPhone: string | null;
    contactWebsite: string | null;
    location: string;
    salary: string | null;
    employmentType: string | null;
    workingHours: string | null;
    isVisible: boolean;
    skills: string[];
    directions: string[];
    image?: string | null;
    document?: string | null;
    updatedAt: string;
}

export interface CreateSubmissionRecordInput {
    title: string;
    company: string;
    description: string;
    type: 'internship' | 'parttime';
    contactEmail: string;
    contactPhone: string | null;
    contactWebsite: string | null;
    location: string;
    salary: string | null;
    employmentType: string | null;
    workingHours: string | null;
    skills: string[];
    directions: string[];
    image: string | null;
    document: string | null;
    submitterIp: string;
}

export interface VerificationTokenLookupRecord {
    tokenId: number;
    submissionId: number | null;
    expiresAt: string | null;
    usedAt: string | null;
    title: string | null;
    company: string | null;
    status: string | null;
}

export interface SubmissionSummaryRecord {
    id: number;
    title: string | null;
    company: string | null;
    contactEmail: string | null;
    status: string | null;
}

export interface PublishedApprovedVacancyRecord {
    vacancyId: number;
    title: string;
    company: string;
    contactEmail: string;
}

export class VacancyRepository {
    async findVisibleVacancies(): Promise<VacancyDTO[]> {
        const rows = await db.query.vacancies.findMany({
            where: (v, { eq: isEq }) => isEq(v.is_visible, true),
            orderBy: (v, { desc }) => [desc(v.published_at)],
            with: {
                vacancy_direction_links: {
                    with: { vacancy_ict_direction: true },
                },
            },
        });

        return rows.map(toVacancyDTO);
    }

    async findVisibleVacancyById(id: number): Promise<VacancyDTO | null> {
        const row = await db.query.vacancies.findFirst({
            where: and(eq(schema.vacancies.id, id), eq(schema.vacancies.is_visible, true)),
            with: {
                vacancy_direction_links: {
                    with: { vacancy_ict_direction: true },
                },
            },
        });

        return row ? toVacancyDTO(row) : null;
    }

    async findAllAdminVacancies(): Promise<AdminVacancyListItemDTO[]> {
        const rows = await db.query.vacancies.findMany({
            columns: {
                id: true,
                title: true,
                company: true,
                type: true,
                is_visible: true,
                published_at: true,
            },
            orderBy: (v, { desc }) => [desc(v.published_at)],
        });

        return rows.map(toAdminVacancyListItemDTO);
    }

    async findAdminVacancyById(id: number): Promise<AdminVacancyDetailDTO | null> {
        const row = await db.query.vacancies.findFirst({
            where: eq(schema.vacancies.id, id),
            with: {
                vacancy_direction_links: {
                    with: { vacancy_ict_direction: true },
                },
            },
        });

        return row ? toAdminVacancyDetailDTO(row) : null;
    }

    async findAllSubmissions(): Promise<VacancySubmissionDTO[]> {
        const rows = await db.query.vacancy_submissions.findMany({
            orderBy: (s, { desc }) => [desc(s.created_at)],
            with: {
                vacancy_submission_direction_links: {
                    with: { vacancy_ict_direction: true },
                },
            },
        });

        return rows.map(toVacancySubmissionDTO);
    }

    async createVacancy(input: CreateVacancyRecordInput): Promise<number> {
        return db.transaction(async (tx) => {
            const [inserted] = await tx
                .insert(schema.vacancies)
                .values({
                    title: input.title,
                    company: input.company,
                    description: input.description,
                    type: input.type,
                    contact_email: input.contactEmail,
                    contact_phone: input.contactPhone,
                    contact_website: input.contactWebsite,
                    location: input.location,
                    salary: input.salary,
                    employment_type: input.employmentType,
                    working_hours: input.workingHours,
                    is_visible: input.isVisible,
                    skills: input.skills,
                    image: input.image,
                    document: input.document,
                    published_at: input.publishedAt,
                    created_by: input.createdBy,
                })
                .returning({ id: schema.vacancies.id });

            if (input.type === 'internship' && input.directions.length > 0) {
                const directionRows = await tx
                    .select({ id: schema.vacancy_ict_directions.id })
                    .from(schema.vacancy_ict_directions)
                    .where(inArray(schema.vacancy_ict_directions.name, input.directions));

                if (directionRows.length > 0) {
                    await tx.insert(schema.vacancy_direction_links).values(
                        directionRows.map((dir) => ({
                            vacancies_id: inserted.id,
                            vacancy_ict_directions_id: dir.id,
                        }))
                    );
                }
            }

            return inserted.id;
        });
    }

    async updateVacancy(id: number, input: UpdateVacancyRecordInput): Promise<void> {
        await db.transaction(async (tx) => {
            await tx
                .update(schema.vacancies)
                .set({
                    title: input.title,
                    company: input.company,
                    description: input.description,
                    type: input.type,
                    contact_email: input.contactEmail,
                    contact_phone: input.contactPhone,
                    contact_website: input.contactWebsite,
                    location: input.location,
                    salary: input.salary,
                    employment_type: input.employmentType,
                    working_hours: input.workingHours,
                    is_visible: input.isVisible,
                    skills: input.skills,
                    ...(input.image !== undefined ? { image: input.image } : {}),
                    ...(input.document !== undefined ? { document: input.document } : {}),
                    updated_at: input.updatedAt,
                })
                .where(eq(schema.vacancies.id, id));

            await tx
                .delete(schema.vacancy_direction_links)
                .where(eq(schema.vacancy_direction_links.vacancies_id, id));

            if (input.type === 'internship' && input.directions.length > 0) {
                const directionRows = await tx
                    .select({ id: schema.vacancy_ict_directions.id })
                    .from(schema.vacancy_ict_directions)
                    .where(inArray(schema.vacancy_ict_directions.name, input.directions));

                if (directionRows.length > 0) {
                    await tx.insert(schema.vacancy_direction_links).values(
                        directionRows.map((dir) => ({
                            vacancies_id: id,
                            vacancy_ict_directions_id: dir.id,
                        }))
                    );
                }
            }
        });
    }

    async deleteVacancy(id: number): Promise<void> {
        await db.delete(schema.vacancies).where(eq(schema.vacancies.id, id));
    }

    async findSubmissionById(submissionId: number): Promise<SubmissionSummaryRecord | null> {
        const submission = await db.query.vacancy_submissions.findFirst({
            where: eq(schema.vacancy_submissions.id, submissionId),
            columns: {
                id: true,
                title: true,
                company: true,
                contact_email: true,
                status: true,
            },
        });

        if (!submission) return null;

        return {
            id: submission.id,
            title: submission.title,
            company: submission.company,
            contactEmail: submission.contact_email,
            status: submission.status,
        };
    }

    async publishApprovedSubmission(
        submissionId: number,
        reviewerUserId: string,
        nowIso: string
    ): Promise<PublishedApprovedVacancyRecord | null> {
        return db.transaction(async (tx) => {
            const submission = await tx.query.vacancy_submissions.findFirst({
                where: and(
                    eq(schema.vacancy_submissions.id, submissionId),
                    eq(schema.vacancy_submissions.status, 'pending_review')
                ),
                with: {
                    vacancy_submission_direction_links: {
                        with: { vacancy_ict_direction: true },
                    },
                },
            });

            if (!submission) return null;

            const [vacancy] = await tx
                .insert(schema.vacancies)
                .values({
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
                    skills: submission.skills,
                    image: submission.image,
                    document: submission.document,
                    is_visible: true,
                    published_at: nowIso,
                })
                .returning({ id: schema.vacancies.id });

            const directionIds = submission.vacancy_submission_direction_links
                .map((link) => link.vacancy_ict_direction?.id)
                .filter((id): id is number => typeof id === 'number');

            if (directionIds.length > 0) {
                await tx.insert(schema.vacancy_direction_links).values(
                    directionIds.map((directionId) => ({
                        vacancies_id: vacancy.id,
                        vacancy_ict_directions_id: directionId,
                    }))
                );
            }

            await tx
                .update(schema.vacancy_submissions)
                .set({
                    status: 'approved',
                    approved_vacancy_id: vacancy.id,
                    reviewed_by: reviewerUserId,
                    reviewed_at: nowIso,
                })
                .where(eq(schema.vacancy_submissions.id, submissionId));

            return {
                vacancyId: vacancy.id,
                title: submission.title ?? '',
                company: submission.company ?? '',
                contactEmail: submission.contact_email ?? '',
            };
        });
    }

    async markSubmissionRejected(
        submissionId: number,
        reason: string,
        reviewerUserId: string,
        reviewedAtIso: string
    ): Promise<void> {
        await db
            .update(schema.vacancy_submissions)
            .set({
                status: 'rejected',
                rejection_reason: reason,
                reviewed_by: reviewerUserId,
                reviewed_at: reviewedAtIso,
            })
            .where(eq(schema.vacancy_submissions.id, submissionId));
    }

    async deleteSubmission(submissionId: number): Promise<void> {
        await db.delete(schema.vacancy_submissions).where(eq(schema.vacancy_submissions.id, submissionId));
    }

    async findRecentActiveSubmission(input: {
        contactEmail: string;
        company: string;
        title: string;
        sinceIso: string;
    }): Promise<{ id: number; status: string | null } | null> {
        const rows = await db
            .select({
                id: schema.vacancy_submissions.id,
                status: schema.vacancy_submissions.status,
            })
            .from(schema.vacancy_submissions)
            .where(
                and(
                    eq(schema.vacancy_submissions.contact_email, input.contactEmail),
                    eq(schema.vacancy_submissions.company, input.company),
                    eq(schema.vacancy_submissions.title, input.title),
                    gt(schema.vacancy_submissions.created_at, input.sinceIso),
                    inArray(schema.vacancy_submissions.status, [
                        'pending_verification',
                        'pending_vertification',
                        'pending_review',
                    ])
                )
            )
            .limit(1);

        return rows.at(0) ?? null;
    }

    async createSubmission(input: CreateSubmissionRecordInput): Promise<number> {
        return db.transaction(async (tx) => {
            const [inserted] = await tx
                .insert(schema.vacancy_submissions)
                .values({
                    title: input.title,
                    company: input.company,
                    description: input.description,
                    type: input.type,
                    contact_email: input.contactEmail,
                    contact_phone: input.contactPhone,
                    contact_website: input.contactWebsite,
                    location: input.location,
                    salary: input.salary,
                    employment_type: input.employmentType,
                    working_hours: input.workingHours,
                    status: 'pending_verification',
                    skills: input.skills,
                    image: input.image,
                    document: input.document,
                    submitter_ip: input.submitterIp,
                })
                .returning({ id: schema.vacancy_submissions.id });

            if (input.type === 'internship' && input.directions.length > 0) {
                const directionRows = await tx
                    .select({ id: schema.vacancy_ict_directions.id })
                    .from(schema.vacancy_ict_directions)
                    .where(inArray(schema.vacancy_ict_directions.name, input.directions));

                if (directionRows.length > 0) {
                    await tx.insert(schema.vacancy_submission_direction_links).values(
                        directionRows.map((dir) => ({
                            vacancy_submissions_id: inserted.id,
                            vacancy_ict_directions_id: dir.id,
                        }))
                    );
                }
            }

            return inserted.id;
        });
    }

    async createVerificationToken(submissionId: number, token: string, expiresAtIso: string): Promise<void> {
        await db.insert(schema.vacancy_verification_tokens).values({
            submission_id: submissionId,
            token,
            expires_at: expiresAtIso,
        });
    }

    async findVerificationTokenRecord(token: string): Promise<VerificationTokenLookupRecord | null> {
        const rows = await db
            .select({
                tokenId: schema.vacancy_verification_tokens.id,
                submissionId: schema.vacancy_verification_tokens.submission_id,
                expiresAt: schema.vacancy_verification_tokens.expires_at,
                usedAt: schema.vacancy_verification_tokens.used_at,
                title: schema.vacancy_submissions.title,
                company: schema.vacancy_submissions.company,
                status: schema.vacancy_submissions.status,
            })
            .from(schema.vacancy_verification_tokens)
            .innerJoin(
                schema.vacancy_submissions,
                eq(schema.vacancy_verification_tokens.submission_id, schema.vacancy_submissions.id)
            )
            .where(eq(schema.vacancy_verification_tokens.token, token))
            .limit(1);

        return rows.at(0) ?? null;
    }

    async markSubmissionVerified(tokenId: number, submissionId: number, verifiedAtIso: string): Promise<void> {
        await db.transaction(async (tx) => {
            await tx
                .update(schema.vacancy_verification_tokens)
                .set({ used_at: verifiedAtIso })
                .where(eq(schema.vacancy_verification_tokens.id, tokenId));

            await tx
                .update(schema.vacancy_submissions)
                .set({ status: 'pending_review', verified_at: verifiedAtIso })
                .where(eq(schema.vacancy_submissions.id, submissionId));
        });
    }

    async findBoardNotificationRecipients(): Promise<{ email: string; name: string }[]> {
        const recipients = await db
            .select({
                email: schema.directus_users.email,
                first_name: schema.directus_users.first_name,
                last_name: schema.directus_users.last_name,
            })
            .from(schema.committee_members)
            .innerJoin(schema.directus_users, eq(schema.committee_members.user_id, schema.directus_users.id))
            .innerJoin(schema.committees, eq(schema.committee_members.committee_id, schema.committees.id))
            .where(
                and(
                    eq(schema.committees.azure_group_id, COMMITTEES.BESTUUR),
                    eq(schema.committee_members.is_visible, true)
                )
            );

        return recipients
            .filter((recipient): recipient is typeof recipient & { email: string } => Boolean(recipient.email))
            .map((recipient) => ({
                email: recipient.email,
                name: `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || 'Bestuur',
            }));
    }
}
