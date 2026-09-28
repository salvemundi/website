import { z } from 'zod';
import { selectTripsSchema, selectTripActivitiesSchema } from './db.zod.js';

export const tripSchema = selectTripsSchema.extend({
    id: z.coerce.number().int(),
    description: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    image: z.preprocess((value) => {
        if (!value) return null;
        if (typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id;
        return typeof value === 'string' ? value : null;
    }, selectTripsSchema.shape.image),
    start_date: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    end_date: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    registration_start_date: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    registration_open: z.unknown().transform(registrationOpenValue => !!registrationOpenValue),
    max_participants: z.coerce.number().int(),
    deposit_amount: z.coerce.number().nonnegative().optional(),
    location: z.string().nullable().optional(),
});

export type Trip = z.infer<typeof tripSchema>;
export type BeheerTrip = Trip;

export const tripActivitySchema = selectTripActivitiesSchema.extend({
    id: z.coerce.number().int(),
    trip_id: z.coerce.number().int(),
    price: z.coerce.number().nonnegative(),
    activity_date: z.string().nullable().optional(),
    activity_time: z.string().nullable().optional(),
    activity_date_end: z.string().nullable().optional(),
    activity_time_end: z.string().nullable().optional(),
    is_included_by_default: z.unknown().transform(val => !!val),
    max_participants: z.coerce.number().int().nullable().optional(),
    registration_deadline: z.string().nullable().optional(),
    status: z.string().optional().default('published'),
});

export type TripActivity = z.infer<typeof tripActivitySchema>;
export type BeheerTripActivity = TripActivity;
