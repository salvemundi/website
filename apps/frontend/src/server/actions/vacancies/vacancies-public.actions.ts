'use server';

import { db } from '@salvemundi/db';
import type { VacancyDTO } from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';

export async function getVacancies(): Promise<VacancyDTO[]> {
    try {
        const rows = await db.query.vacancies.findMany({
            where: (v, { eq }) => eq(v.is_visible, true),
            orderBy: (v, { desc }) => [desc(v.published_at)],
            with: {
                vacancy_direction_links: {
                    with: { vacancy_ict_direction: true }
                }
            }
        });

        return rows.map((row) => ({
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
            directions: row.vacancy_direction_links.map((link) => link.vacancy_ict_direction.name)
        }));
    } catch (error) {
        safeConsoleError('[vacancies-public.actions.ts][getVacancies] ', error);
        return [];
    }
}
