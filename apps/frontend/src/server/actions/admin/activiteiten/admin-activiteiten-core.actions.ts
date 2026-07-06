'use server';

import { enforceFeatureAccess } from '@/server/actions/admin/admin-utils.actions';
import { getActivitySignupsInternal } from "@/server/queries/activiteiten/admin-activiteiten.queries";
import { safeConsoleError } from '@/server/utils/logger';

export async function getActivitySignups(eventId: string) {
    await enforceFeatureAccess('activiteiten');

    try {
        return await getActivitySignupsInternal(eventId);
    } catch (error) {
        safeConsoleError('[admin-activiteit.actions.ts][getActivitySignups] ', error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de inschrijvingen');
    }
}