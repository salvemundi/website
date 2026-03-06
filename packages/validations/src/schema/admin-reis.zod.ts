import { z } from 'zod';

export const tripSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    event_date: z.string(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    registration_open: z.boolean(),
    max_participants: z.number().int(),
    base_price: z.number(),
    crew_discount: z.number(),
    deposit_amount: z.number(),
    is_bus_trip: z.boolean(),
    allow_final_payments: z.boolean().nullable().optional(),
});

export const tripSignupSchema = z.object({
    id: z.number().int(),
    first_name: z.string(),
    middle_name: z.string().nullable().optional(),
    last_name: z.string(),
    email: z.string().email(),
    phone_number: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    id_document_type: z.string().nullable().optional(),
    document_number: z.string().nullable().optional(),
    allergies: z.string().nullable().optional(),
    special_notes: z.string().nullable().optional(),
    willing_to_drive: z.boolean().nullable().optional(),
    role: z.string(),
    status: z.string(),
    deposit_paid: z.boolean(),
    deposit_paid_at: z.string().nullable().optional(),
    full_payment_paid: z.boolean(),
    full_payment_paid_at: z.string().nullable().optional(),
    deposit_email_sent: z.boolean().nullable().optional(),
    final_email_sent: z.boolean().nullable().optional(),
    created_at: z.string(),
});

export const tripSignupActivitySchema = z.object({
    id: z.number().int().optional(),
    trip_signup_id: z.number().int(),
    trip_activity_id: z.any(), // Kan een ID zijn of een genest object vanuit Directus
    selected_options: z.any().nullable().optional(), // Array of strings meestal
});

export type Trip = z.infer<typeof tripSchema>;
export type TripSignup = z.infer<typeof tripSignupSchema>;
export type TripSignupActivity = z.infer<typeof tripSignupActivitySchema>;
