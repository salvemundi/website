import { getSafeHavens } from '@/shared/api/safe-haven-actions';
import { getSafeHavenByUserIdAction } from '@/shared/api/data-actions';
import type { SafeHavenAvailability } from './types';

export const safeHavensApi = {
    getAll: async () => {
        // Use Server Action to fetch data with Admin Token, bypassing client-side user permissions
        return await getSafeHavens();
    },
    getByUserId: async (userId: string) => {
        return await getSafeHavenByUserIdAction(userId);
    }
};

// Safe Haven Availability Functions
export async function getSafeHavenAvailability(userId: string): Promise<SafeHavenAvailability | null> {
    // Availability fields were removed from the Directus schema.
    // To prevent runtime errors, this helper no longer attempts to read availability fields
    // and returns null to indicate availability data is not available.
    console.warn('[getSafeHavenAvailability] Availability support removed; returning null for userId:', userId);
    return null;
}

export async function updateSafeHavenAvailability(
    userId: string,
    _availability: SafeHavenAvailability,
    _token: string
): Promise<void> {
    // Availability editing has been removed. Do not attempt to PATCH Directus.
    // Keep a no-op implementation so callers won't cause network errors.
    console.warn('[updateSafeHavenAvailability] Availability updates disabled for userId:', userId);
    return Promise.resolve();
}
