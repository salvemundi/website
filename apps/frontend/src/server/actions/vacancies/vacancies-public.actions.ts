'use server';

import { z } from 'zod';
import type { VacancyDTO } from '@salvemundi/validations';
import { isActionFailure, withAction } from '@/server/actions/action-wrapper';
import { createVacancyService } from './vacancy-service.utils';

const vacancyIdSchema = z.number().int().positive();

const executeGetVacancies = withAction<void, void, VacancyDTO[]>({
    actionName: 'vacancies-public.actions.ts][getVacancies',
    handler: async () => createVacancyService().getPublicVacancies(),
});

const executeGetVacancyById = withAction<number, number, VacancyDTO | null>({
    actionName: 'vacancies-public.actions.ts][getVacancyById',
    schema: vacancyIdSchema,
    handler: async (id) => createVacancyService().getPublicVacancyById(id),
});

export async function getVacancies(): Promise<VacancyDTO[]> {
    const result = await executeGetVacancies(undefined);
    return isActionFailure(result) ? [] : result;
}

export async function getVacancyById(id: number): Promise<VacancyDTO | null> {
    const result = await executeGetVacancyById(id);
    return isActionFailure(result) ? null : result;
}
