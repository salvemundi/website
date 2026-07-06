'use server';

import { cache } from "react";
import { AdminActivitySchema } from "@salvemundi/validations";
import { getActivitiesWithSignupCountsInternal } from "@/server/queries/activiteiten/admin-activiteiten.queries";
import { enforceFeatureAccess } from "@/server/actions/admin/admin-utils.actions";
import { safeConsoleError } from '@/server/utils/logger';

export const getAdminActivities = cache(async (search?: string, filter: 'all' | 'upcoming' | 'past' = 'all') => {
    await enforceFeatureAccess('activiteiten');

    try {
        const eventsWithCounts = await getActivitiesWithSignupCountsInternal(search, filter);
        return AdminActivitySchema.array().parse(eventsWithCounts);
    } catch (error: unknown) {
        safeConsoleError(`[activities-read.actions.ts][getAdminActivities] Failed to get activities:`, error);
        return [];
    }
});