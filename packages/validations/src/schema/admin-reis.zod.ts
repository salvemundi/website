import { z } from 'zod';

export const tripSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    description: z.preprocess((v) => v === null ? null : String(v), z.string().nullable().optional()),
    image: z.preprocess((v) => v === null ? null : String(v), z.string().nullable().optional()),
    event_date: z.preprocess((v) => v === null ? null : String(v), z.string().nullable().optional()),
    start_date: z.preprocess((v) => v === null ? null : String(v), z.string().nullable().optional()),
    end_date: z.preprocess((v) => v === null ? null : String(v), z.string().nullable().optional()),
    registration_start_date: z.preprocess((v) => v === null ? null : String(v), z.string().nullable().optional()),
    registration_open: z.any().transform(v => !!v),
    max_participants: z.coerce.number().int(),
    max_crew: z.coerce.number().int().nullable().optional(),
    base_price: z.coerce.number(),
    crew_discount: z.coerce.number(),
    deposit_amount: z.coerce.number(),
    is_bus_trip: z.any().transform(v => !!v),
    allow_final_payments: z.any().transform(v => !!v).nullable().optional(),
});

export const tripSignupSchema = z.object({
    id: z.number().int(),
    user_id: z.string().nullable().optional(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone_number: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    id_document: z.string().nullable().optional(),
    document_number: z.string().nullable().optional(),
    allergies: z.string().nullable().optional(),
    special_notes: z.string().nullable().optional(),
    willing_to_drive: z.boolean().nullable().optional(),
    terms_accepted: z.boolean().nullable().optional(),
    directus_relations: z.string().nullable().optional(),
    role: z.string(),
    status: z.string(),
    deposit_paid: z.boolean(),
    deposit_paid_at: z.string().nullable().optional(),
    full_payment_paid: z.boolean(),
    full_payment_paid_at: z.string().nullable().optional(),
    deposit_email_sent: z.boolean().nullable().optional(),
    final_email_sent: z.boolean().nullable().optional(),
    created_at: z.string().optional(),
    access_token: z.string().nullable().optional(),
    trip_id: z.coerce.number().int().nullable().optional(),
});

export const tripSignupActivitySchema = z.object({
    id: z.number().int().optional(),
    trip_signup_id: z.number().int(),
    trip_activity_id: z.any(), // Can be an ID (number) or a nested object from Directus
    selected_options: z.record(z.any()).nullable().optional(),
});

export const tripActivitySchema = z.object({
    id: z.number().int(),
    trip_id: z.number().int(),
    name: z.string(),
    description: z.string().nullable().optional(),
    price: z.coerce.number(),
    image: z.string().nullable().optional(),
    max_participants: z.coerce.number().int().nullable().optional(),
    is_active: z.any().transform(v => !!v),
    display_order: z.coerce.number().int(),
    options: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.coerce.number()
    })).nullable().optional(),
    max_selections: z.coerce.number().int().nullable().optional(),
});

export type Trip = z.infer<typeof tripSchema>;
export type TripSignup = z.infer<typeof tripSignupSchema>;
export type TripSignupActivity = z.infer<typeof tripSignupActivitySchema>;
export type TripActivity = z.infer<typeof tripActivitySchema>;
