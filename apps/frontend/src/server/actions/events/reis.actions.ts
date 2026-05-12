'use server';

import { type ReisSignupForm } from '@salvemundi/validations/schema/reis.zod';
import * as queries from './reis/reis-queries.actions';
import * as mutations from './reis/reis-mutations.actions';

export async function getReisSiteSettings() {
    return queries.getReisSiteSettings();
}

export async function getCurrentUserProfileAction() {
    return queries.getCurrentUserProfileAction();
}

export async function getUpcomingTrips() {
    return queries.getUpcomingTrips();
}

export async function getTripParticipantsCount(tripId: number) {
    return queries.getTripParticipantsCount(tripId);
}

export async function getUserTripSignup(tripId: number) {
    return queries.getUserTripSignup(tripId);
}

export async function getTripSignupsInternal(tripId: number) {
    return queries.getTripSignupsInternal(tripId);
}

export async function createTripSignup(data: ReisSignupForm, tripId: number) {
    return mutations.createTripSignup(data, tripId);
}

export async function revalidateReisAction() {
    return mutations.revalidateReisAction();
}
