'use server';

import { z } from 'zod';
import { activitiesResponseSchema } from '@salvemundi/validations';

const DIRECTUS_STATIC_TOKEN = process.env.DIRECTUS_STATIC_TOKEN;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.salvemundi.nl';

/**
 * Fetch all upcoming and past activities
 * Features 'use cache' to ensure static rendering & caching
 */
export async function getActivities() {
    'use cache';

    try {
        if (!DIRECTUS_STATIC_TOKEN) {
            console.error('[Activities] DIRECTUS_STATIC_TOKEN is missing');
            return [];
        }

        const url = new URL(`${API_URL}/items/activiteiten`);
        // We want almost all activities. Maybe we can filter by status='published' but let's just get all for now
        // according to the legacy logic all were fetched then filtered on the client
        url.searchParams.append('limit', '-1');
        url.searchParams.append('filter[status][_eq]', 'published');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${DIRECTUS_STATIC_TOKEN}`,
            },
        });

        if (!response.ok) {
            console.error(`[Activities] Fetch failed with status: ${response.status}`);
            return [];
        }

        const rawData = await response.json();

        // Zod validation (Zero-Trust)
        const parsed = activitiesResponseSchema.safeParse(rawData);

        if (!parsed.success) {
            console.error('[Activities] Zod validation failed:', parsed.error);
            return [];
        }

        return parsed.data.data;
    } catch (error) {
        console.error('[Activities] Error fetching activities:', error);
        return [];
    }
}
