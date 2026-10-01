'use server';

import { enforceFeatureAccess } from '@/server/actions/beheer/beheer-utils.actions';
import { getActivitySignupsInternal } from "@/server/queries/activiteiten/beheer-activiteiten.queries";
import { safeConsoleError } from '@/server/utils/logger';

export async function getActivitySignups(eventId: string) {
    await enforceFeatureAccess('activiteiten');

    try {
        return await getActivitySignupsInternal(eventId);
    } catch (error) {
        safeConsoleError('[beheer-activiteiten-core.actions.ts][getActivitySignups] ', error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de inschrijvingen');
    }
}