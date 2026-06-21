'use server';

import { checkAdminAccess } from '@/server/internal/activiteit-utils';
import { getActivitySignupsInternal } from "@/server/queries/admin-event.queries";
import { safeConsoleError } from '@/server/utils/logger';

export async function getActivitySignups(eventId: string) {
    const session = await checkAdminAccess();
    if (!session) throw new Error('Je hebt geen toegang tot deze pagina');

    try {
        return await getActivitySignupsInternal(eventId);
    } catch (error) {
        safeConsoleError('[admin-activiteit.actions.ts][getActivitySignups] ', error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de inschrijvingen');
    }
}