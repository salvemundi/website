import type { VacancyAdminForm, VacancyDTO, VacancySubmissionDTO, VacancyType } from '@salvemundi/validations';

export type { VacancyDTO, VacancySubmissionDTO, VacancyType };

export interface VacancyDirectionLinkRecord {
    vacancy_ict_direction?: {
        id?: number;
        name: string | null;
    } | null;
}

export interface VacancySourceRow {
    id: number;
    title: string | null;
    company: string | null;
    description: string | null;
    type: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_website: string | null;
    location: string | null;
    salary: string | null;
    employment_type: string | null;
    working_hours: string | null;
    is_visible: boolean | null;
    published_at: string | null;
    skills: unknown;
    image: string | null;
    document: string | null;
    vacancy_direction_links: readonly VacancyDirectionLinkRecord[];
}

export interface VacancySubmissionSourceRow {
    id: number;
    title: string | null;
    company: string | null;
    description: string | null;
    type: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_website: string | null;
    location: string | null;
    salary: string | null;
    employment_type: string | null;
    working_hours: string | null;
    skills: unknown;
    image: string | null;
    document: string | null;
    status: string | null;
    rejection_reason: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    approved_vacancy_id: number | null;
    verified_at: string | null;
    created_at: string | null;
    vacancy_submission_direction_links: readonly VacancyDirectionLinkRecord[];
}

export interface AdminVacancyListItemDTO {
    id: number;
    title: string | null;
    company: string | null;
    type: string | null;
    is_visible: boolean | null;
    published_at: string | null;
}

export interface AdminVacancyDetailDTO {
    id: number;
    title: string;
    company: string;
    description: string;
    type: VacancyAdminForm['type'];
    contact_email: string;
    contact_phone: string;
    contact_website: string;
    location: string;
    salary: string;
    employment_type: string;
    working_hours: string;
    is_visible: boolean;
    directions: string[];
    skills: string[];
    image: string | null;
    document: string | null;
}

function normalizeVacancyType(type: string | null): VacancyType {
    return type === 'internship' ? 'internship' : 'parttime';
}

function normalizeSubmissionStatus(status: string | null): VacancySubmissionDTO['status'] {
    if (status === 'pending_vertification' || status === 'pending_verification') {
        return 'pending_verification';
    }
    if (status === 'pending_review' || status === 'approved' || status === 'rejected') {
        return status;
    }
    return 'pending_verification';
}

function normalizeSkills(skills: unknown): string[] {
    if (!Array.isArray(skills)) return [];
    return skills.filter((item): item is string => typeof item === 'string');
}

function extractDirectionNames(links: readonly VacancyDirectionLinkRecord[]): string[] {
    return links
        .map((link) => link.vacancy_ict_direction?.name)
        .filter((name): name is string => Boolean(name));
}

export function toVacancyDTO(row: VacancySourceRow): VacancyDTO {
    return {
        id: row.id,
        title: row.title ?? '',
        company: row.company ?? '',
        description: row.description ?? '',
        type: normalizeVacancyType(row.type),
        contact_email: row.contact_email ?? '',
        contact_phone: row.contact_phone,
        contact_website: row.contact_website,
        location: row.location ?? '',
        salary: row.salary,
        employment_type: row.employment_type,
        working_hours: row.working_hours,
        is_visible: row.is_visible ?? false,
        published_at: row.published_at ?? '',
        directions: extractDirectionNames(row.vacancy_direction_links),
        skills: normalizeSkills(row.skills),
        image: row.image,
        document: row.document,
    };
}

export function toAdminVacancyListItemDTO(row: {
    id: number;
    title: string | null;
    company: string | null;
    type: string | null;
    is_visible: boolean | null;
    published_at: string | null;
}): AdminVacancyListItemDTO {
    return {
        id: row.id,
        title: row.title,
        company: row.company,
        type: row.type,
        is_visible: row.is_visible,
        published_at: row.published_at,
    };
}

export function toAdminVacancyDetailDTO(row: VacancySourceRow): AdminVacancyDetailDTO {
    return {
        id: row.id,
        title: row.title ?? '',
        company: row.company ?? '',
        description: row.description ?? '',
        type: normalizeVacancyType(row.type),
        contact_email: row.contact_email ?? '',
        contact_phone: row.contact_phone ?? '',
        contact_website: row.contact_website ?? '',
        location: row.location ?? '',
        salary: row.salary ?? '',
        employment_type: row.employment_type ?? '',
        working_hours: row.working_hours ?? '',
        is_visible: row.is_visible ?? false,
        directions: extractDirectionNames(row.vacancy_direction_links),
        skills: normalizeSkills(row.skills),
        image: row.image,
        document: row.document,
    };
}

export function toVacancySubmissionDTO(row: VacancySubmissionSourceRow): VacancySubmissionDTO {
    return {
        id: row.id,
        title: row.title ?? '',
        company: row.company ?? '',
        description: row.description ?? '',
        type: normalizeVacancyType(row.type),
        contact_email: row.contact_email ?? '',
        contact_phone: row.contact_phone,
        contact_website: row.contact_website,
        location: row.location ?? '',
        salary: row.salary,
        employment_type: row.employment_type,
        working_hours: row.working_hours,
        directions: extractDirectionNames(row.vacancy_submission_direction_links),
        skills: normalizeSkills(row.skills),
        image: row.image,
        document: row.document,
        status: normalizeSubmissionStatus(row.status),
        rejection_reason: row.rejection_reason,
        reviewed_by: row.reviewed_by,
        reviewed_at: row.reviewed_at,
        approved_vacancy_id: row.approved_vacancy_id,
        verified_at: row.verified_at,
        created_at: row.created_at ?? '',
    };
}
