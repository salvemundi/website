import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/trip.zod';
import type { EnrichedTripSignupActivity } from './reis-signup-db.utils';

export function groupActivitiesBySignup(
    signups: TripSignup[],
    allSignupSelections: (TripSignupActivity | EnrichedTripSignupActivity)[]
): Record<number, (TripSignupActivity | EnrichedTripSignupActivity)[]> {
    const activitiesMap = new Map<number, (TripSignupActivity | EnrichedTripSignupActivity)[]>();
    
    signups.forEach((s: TripSignup) => {
        if (s.id) {
            activitiesMap.set(s.id, []);
        }
    });

    allSignupSelections.forEach((sa) => {
        const signupId = Number(sa.trip_signup_id);
        const existing = activitiesMap.get(signupId);
        if (existing) {
            existing.push(sa);
        }
    });

    return Object.fromEntries(activitiesMap);
}