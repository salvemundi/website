import { z } from 'zod';

export const reisSiteSettingsSchema = z.object({
    id: z.string().optional(),
    show: z.boolean(),
    disabled_message: z.string().nullable().optional(),
});

export const reisTripSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    event_date: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    registration_open: z.boolean(),
    registration_start_date: z.string().nullable().optional(),
    max_participants: z.number().int(),
    max_crew: z.number().int().optional(),
    base_price: z.string().nullable().optional(),
    crew_discount: z.string().nullable().optional(),
    deposit_amount: z.string().nullable().optional(),
    is_bus_trip: z.boolean().nullable().optional(),
    allow_final_payments: z.boolean().nullable().optional(),
    status: z.string().nullable().optional(),
});

export const reisTripSignupSchema = z.object({
    id: z.number().int(),
    trip_id: z.number().int(),
    first_name: z.string().min(1, 'Voornaam is verplicht'),
    last_name: z.string().min(1, 'Achternaam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    phone_number: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    id_document: z.string().nullable().optional(),
    document_number: z.string().nullable().optional(),
    directus_relations: z.string().nullable().optional(),
    terms_accepted: z.boolean().optional(),
    status: z.enum(['registered', 'waitlist', 'confirmed', 'cancelled']),
    role: z.enum(['participant', 'crew']).optional(),
    allergies: z.string().nullable().optional(),
    special_notes: z.string().nullable().optional(),
    willing_to_drive: z.boolean().nullable().optional(),
    deposit_paid: z.boolean().optional(),
    full_payment_paid: z.boolean().optional(),
    date_created: z.string().nullable().optional(),
});

export const reisSignupFormSchema = z.object({
    first_name: z.string().min(1, 'Voornaam is verplicht'),
    last_name: z.string().min(1, 'Achternaam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    phone_number: z.string().min(5, 'Telefoonnummer is verplicht'),
    date_of_birth: z.string().min(1, 'Geboortedatum is verplicht'),
    terms_accepted: z.boolean().refine(val => val === true, {
        message: 'Je moet de algemene voorwaarden accepteren.',
    }),
});

export const reisPaymentEnrichmentSchema = z.object({
    first_name: z.string().min(1, 'Voornaam is verplicht'),
    last_name: z.string().min(1, 'Achternaam is verplicht'),
    phone_number: z.string().min(5, 'Telefoonnummer is verplicht'),
    date_of_birth: z.string().min(1, 'Geboortedatum is verplicht'),
    id_document: z.string().min(1, 'ID-documenttype is verplicht'),
    document_number: z.string().optional().nullable(),
    allergies: z.string().optional().nullable(),
    special_notes: z.string().optional().nullable(),
    willing_to_drive: z.boolean().optional().nullable(),
}).refine(data => {
    if (data.id_document && data.id_document !== 'none') {
        return !!data.document_number && data.document_number.length > 0;
    }
    return true;
}, {
    message: 'Documentnummer is verplicht bij een gekozen ID-document.',
    path: ['document_number'],
});

export type ReisSiteSettings = z.infer<typeof reisSiteSettingsSchema>;
export type ReisTrip = z.infer<typeof reisTripSchema>;
export type ReisTripSignup = z.infer<typeof reisTripSignupSchema>;
export type ReisSignupForm = z.infer<typeof reisSignupFormSchema>;
export type ReisPaymentEnrichment = z.infer<typeof reisPaymentEnrichmentSchema>;
