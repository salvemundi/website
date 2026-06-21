'use server';

import { cache } from "react";
import { AdminActivitySchema } from "@salvemundi/validations";
import { getActivitiesWithSignupCountsInternal } from "@/server/queries/admin-event.queries";
import { ensureActivitiesView } from "@/server/actions/events/activiteiten/auth-check";
import { safeConsoleError } from '@/server/utils/logger';

export const getAdminActivities = cache(async (search?: string, filter: 'all' | 'upcoming' | 'past' = 'all') => {
    await ensureActivitiesView();

    try {
        const eventsWithCounts = await getActivitiesWithSignupCountsInternal(search, filter);
        const parsed = AdminActivitySchema.array().parse(eventsWithCounts);
        return parsed;
    } catch (error: unknown) {
        safeConsoleError(`[activities-read.actions.ts][getAdminActivities] Failed to get activities:`, error);
        return [];
    }
});
