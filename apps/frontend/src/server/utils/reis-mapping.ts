import type { TripSignup, TripSignupActivity } from '@salvemundi/validations';

/**
 * Groups trip signup activities by their signup ID for efficient lookup.
 */
export function groupActivitiesBySignup(
    signups: TripSignup[],
    allSignupSelections: TripSignupActivity[]
): Record<number, TripSignupActivity[]> {
    const activitiesMap = new Map<number, TripSignupActivity[]>();
    
    // Initialize map with empty arrays for all signups
    signups.forEach(s => {
        if (s.id) {
            activitiesMap.set(s.id, []);
        }
    });

    // Populate map
    allSignupSelections.forEach((sa) => {
        // Directus can return nested objects for relations, extract ID if needed
        const signupId = (sa.trip_signup_id && typeof sa.trip_signup_id === 'object') 
            ? (sa.trip_signup_id as { id: number }).id 
            : sa.trip_signup_id as number;
            
        const existing = activitiesMap.get(signupId);
        if (existing) {
            existing.push(sa);
        }
    });

    return Object.fromEntries(activitiesMap);
}
