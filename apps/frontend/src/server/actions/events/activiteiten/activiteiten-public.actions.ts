'use server';

import { type EventSignupForm } from '@salvemundi/validations/schema/activity.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import * as service from '@/server/services/activity-registration';

export async function getActivities(email?: string) { return service.getActivities(email); }
export async function getActivityById(id: string) { return service.getActivityById(id); }
export async function getActivityBySlug(slug: string) { return service.getActivityBySlug(slug); }
export async function getActivitySignupCount(eventId: number) { return service.getActivitySignupCount(eventId); }
export async function checkUserSignupStatus(eventId: number, email: string, userId?: string | null) {
    return service.checkUserSignupStatus(eventId, email, userId);
}
export async function signupForActivity(data: EventSignupForm) {
    return service.signupForActivityForUser(data, await getEnrichedSession());
}
