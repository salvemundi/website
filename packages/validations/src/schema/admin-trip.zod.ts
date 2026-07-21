import { z } from 'zod';
import { insertTripsSchema, insertTripSignupsSchema, insertTripSignupActivitiesSchema, insertTripActivitiesSchema } from './db.zod.js';
import type { Trip as DirectusTrip } from '../directus/schema.js';

export const tripSchema = insertTripsSchema.extend({
    id: z.coerce.number().int(),
    description: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    image: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'object') return value;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.custom<DirectusTrip['image']>().nullable().optional()),
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
    max_crew: z.coerce.number().int().nullable().optional(),
    base_price: z.coerce.number(),
    crew_discount: z.coerce.number(),
    deposit_amount: z.coerce.number(),
    is_bus_trip: z.unknown().transform(isBusTripValue => !!isBusTripValue),
    allow_final_payments: z.unknown().transform(allowFinalPaymentsValue => !!allowFinalPaymentsValue).nullable().optional(),
    allow_deposit_payments: z.unknown().transform(allowDepositPaymentsValue => !!allowDepositPaymentsValue).nullable().optional(),
});

export const tripSignupSchema = insertTripSignupsSchema.extend({
    id: z.coerce.number().int(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone_number: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    id_document: z.string().nullable().optional(),
    document_number: z.string().nullable().optional(),
    document_expiry_date: z.string().nullable().optional(),
    extra_luggage: z.boolean().nullable().optional(),
    allergies: z.string().nullable().optional(),
    special_notes: z.string().nullable().optional(),
    willing_to_drive: z.boolean().nullable().optional(),
    terms_accepted: z.boolean().nullable().optional(),
    directus_relations: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    deposit_paid: z.boolean().nullable().optional(),
    deposit_paid_at: z.string().nullable().optional(),
    full_payment_paid: z.boolean().nullable().optional(),
    full_payment_paid_at: z.string().nullable().optional(),
    deposit_email_sent: z.boolean().nullable().optional(),
    final_email_sent: z.boolean().nullable().optional(),
    created_at: z.string().nullable().optional(),
    access_token: z.string().nullable().optional(),
    trip_id: z.coerce.number().int().nullable().optional(),
});

export const tripSignupActivitySchema = insertTripSignupActivitiesSchema.extend({
    id: z.coerce.number().int().optional(),
    trip_signup_id: z.unknown(),
    trip_activity_id: z.unknown(),
    selected_options: z.unknown().nullable().optional(),
});

export const tripActivitySchema = insertTripActivitiesSchema.extend({
    id: z.coerce.number().int().optional(),
    trip_id: z.coerce.number().int().nullable().optional(),
    name: z.string(),
    description: z.string().nullable().optional(),
    price: z.coerce.number().nullable().optional(),
    image: z.string().nullable().optional(),
    max_participants: z.coerce.number().int().nullable().optional(),
    is_active: z.unknown().transform(isActiveValue => !!isActiveValue).nullable().optional(),
    display_order: z.coerce.number().int().nullable().optional(),
    options: z.preprocess(
        (optionsValue) => (optionsValue && typeof optionsValue === 'object' && !Array.isArray(optionsValue) ? null : optionsValue),
        z.array(z.object({
            id: z.string().optional().nullable(),
            name: z.string().optional().nullable(),
            price: z.coerce.number().optional().nullable()
        })).nullable().optional()
    ),
    max_selections: z.coerce.number().int().nullable().optional(),
});

export type Trip = z.infer<typeof tripSchema>;
export type TripSignup = z.infer<typeof tripSignupSchema>;
export type TripSignupActivity = z.infer<typeof tripSignupActivitySchema>;
export type TripActivity = z.infer<typeof tripActivitySchema>;