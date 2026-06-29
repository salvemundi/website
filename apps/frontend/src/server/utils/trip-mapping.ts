import type { TripSignup, TripSignupActivity } from '@salvemundi/validations';

export function groupActivitiesBySignup(
    signups: TripSignup[],
    allSignupSelections: TripSignupActivity[]
): Record<number, TripSignupActivity[]> {
    const activitiesMap = new Map<number, TripSignupActivity[]>();
    
    signups.forEach(s => {
        if (s.id) {
            activitiesMap.set(s.id, []);
        }
    });

    allSignupSelections.forEach((sa) => {
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
