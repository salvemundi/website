import {
    getTripsAction,
    getTripByIdAction,
    createTripAction,
    updateTripAction,
    deleteTripAction,
    getTripActivitiesByTripIdAction,
    getAllTripActivitiesByTripIdAction,
    createTripActivityAction,
    updateTripActivityAction,
    deleteTripActivityAction,
    createTripSignupAction,
    getTripSignupByIdAction,
    updateTripSignupAction,
    getTripSignupsByTripIdAction,
    createTripSignupActivityAction,
    deleteTripSignupActivityAction,
    getTripSignupActivitiesBySignupIdAction,
    getTripSignupActivitiesByActivityIdAction
} from '@/shared/api/data-actions';
import type { Trip, TripActivity, TripSignup } from './types';

export const tripsApi = {
    getAll: async () => {
        return await getTripsAction();
    },
    getById: async (id: number) => {
        return await getTripByIdAction(id);
    },
    create: async (data: Partial<Trip>) => {
        return await createTripAction(data);
    },
    update: async (id: number, data: Partial<Trip>) => {
        return await updateTripAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteTripAction(id);
    },
};

export const tripActivitiesApi = {
    getByTripId: async (tripId: number) => {
        return await getTripActivitiesByTripIdAction(tripId);
    },
    getAllByTripId: async (tripId: number) => {
        return await getAllTripActivitiesByTripIdAction(tripId);
    },
    create: async (data: Partial<TripActivity>) => {
        return await createTripActivityAction(data);
    },
    update: async (id: number, data: Partial<TripActivity>) => {
        return await updateTripActivityAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteTripActivityAction(id);
    },
};

export const tripSignupsApi = {
    create: async (data: Partial<TripSignup>) => {
        return await createTripSignupAction(data);
    },
    getById: async (id: number) => {
        return await getTripSignupByIdAction(id);
    },
    update: async (id: number, data: Partial<TripSignup>) => {
        return await updateTripSignupAction(id, data);
    },
    getByTripId: async (tripId: number) => {
        return await getTripSignupsByTripIdAction(tripId);
    },
};

export const tripSignupActivitiesApi = {
    create: async (data: { trip_signup_id: number; trip_activity_id: number; selected_options?: any }) => {
        return await createTripSignupActivityAction(data);
    },
    delete: async (id: number) => {
        return await deleteTripSignupActivityAction(id);
    },
    getBySignupId: async (signupId: number) => {
        return await getTripSignupActivitiesBySignupIdAction(signupId);
    },
    getByActivityId: async (activityId: number) => {
        return await getTripSignupActivitiesByActivityIdAction(activityId);
    },
};
