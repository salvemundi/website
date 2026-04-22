'use server';

import { cache } from "react";
import { AdminActivitySchema } from "@salvemundi/validations";
import { getActivitiesWithSignupCountsInternal } from "@/server/queries/admin-event.queries";
import { ensureActivitiesView } from "./auth-check";

/**
 * READ ACTIONS: Fetching activities and metadata.
 * Gated by: ActivitiesView (Any committee member)
 */

export const getAdminActivities = cache(async (search?: string, filter: 'all' | 'upcoming' | 'past' = 'all') => {
    // SECURITY: Ensure the user is in a committee
    await ensureActivitiesView();

    try {
        const eventsWithCounts = await getActivitiesWithSignupCountsInternal(search, filter);
        const parsed = AdminActivitySchema.array().parse(eventsWithCounts);
        return parsed;
    } catch (error) {
        
        return [];
    }
});
