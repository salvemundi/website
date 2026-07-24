'use server';

import { eq, and } from 'drizzle-orm';
import { db, schema } from '@salvemundi/db';
import type { VacancyDTO } from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';

type VacancyWithDirections = {
    id: number;
    title: string;
    company: string;
    description: string;
    type: string;
    contact_email: string;
    contact_phone: string | null;
    contact_website: string | null;
    location: string;
    salary: string | null;
    employment_type: string | null;
    working_hours: string | null;
    is_visible: boolean;
    published_at: string;
    skills: unknown;
    image: string | null;
    document: string | null;
    vacancy_direction_links: { vacancy_ict_direction: { name: string } }[];
};

function mapVacancy(row: VacancyWithDirections): VacancyDTO {
    return {
        id: row.id,
        title: row.title,
        company: row.company,
        description: row.description,
        type: row.type as VacancyDTO['type'],
        contact_email: row.contact_email,
        contact_phone: row.contact_phone,
        contact_website: row.contact_website,
        location: row.location,
        salary: row.salary,
        employment_type: row.employment_type,
        working_hours: row.working_hours,
        is_visible: row.is_visible,
        published_at: row.published_at,
        directions: row.vacancy_direction_links.map((link) => link.vacancy_ict_direction.name),
        skills: Array.isArray(row.skills) ? row.skills as string[] : [],
        image: row.image,
        document: row.document
    };
}

export async function getVacancies(): Promise<VacancyDTO[]> {
    try {
        const rows = await db.query.vacancies.findMany({
            where: (v, { eq: isEq }) => isEq(v.is_visible, true),
            orderBy: (v, { desc }) => [desc(v.published_at)],
            with: {
                vacancy_direction_links: {
                    with: { vacancy_ict_direction: true }
                }
            }
        });

        return rows.map(mapVacancy);
    } catch (error) {
        safeConsoleError('[vacancies-public.actions.ts][getVacancies] ', error);
        return [];
    }
}

export async function getVacancyById(id: number): Promise<VacancyDTO | null> {
    try {
        const row = await db.query.vacancies.findFirst({
            where: and(eq(schema.vacancies.id, id), eq(schema.vacancies.is_visible, true)),
            with: {
                vacancy_direction_links: {
                    with: { vacancy_ict_direction: true }
                }
            }
        });

        return row ? mapVacancy(row) : null;
    } catch (error) {
        safeConsoleError('[vacancies-public.actions.ts][getVacancyById] ', error);
        return null;
    }
}
