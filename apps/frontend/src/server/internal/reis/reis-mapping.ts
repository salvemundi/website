import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/trip.zod';

export function groupActivitiesBySignup(
    signups: TripSignup[],
    allSignupSelections: TripSignupActivity[]
): Record<number, TripSignupActivity[]> {
    const activitiesMap = new Map<number, TripSignupActivity[]>();
    
    signups.forEach((s: TripSignup) => {
        if (s.id) {
            activitiesMap.set(s.id, []);
        }
    });

    allSignupSelections.forEach((sa: TripSignupActivity) => {
        const signupId = Number(sa.trip_signup_id);
        const existing = activitiesMap.get(signupId);
        if (existing) {
            existing.push(sa);
        }
    });

    return Object.fromEntries(activitiesMap);
}