import { z } from 'zod';
import { dateOfBirthSchema, phoneNumberSchema } from './shared.zod.js';

export const reisSiteSettingsSchema = z.object({
    id: z.string().optional(),
    show: z.boolean(),
    disabled_message: z.string().nullable().optional(),
});

export const reisTripSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    registration_open: z.boolean(),
    registration_start_date: z.string().nullable().optional(),
    max_participants: z.number().int(),
    max_crew: z.coerce.number().int().nullable().optional(),
    base_price: z.coerce.number().optional(),
    crew_discount: z.coerce.number().optional(),
    deposit_amount: z.coerce.number().optional(),
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
    document_expiry_date: z.string().nullable().optional(),
    extra_luggage: z.boolean().nullable().optional(),
    directus_relations: z.string().nullable().optional(),
    terms_accepted: z.boolean().optional(),
    status: z.enum(['registered', 'waitlist', 'confirmed', 'cancelled']),
    role: z.string().optional().nullable(),
    allergies: z.string().nullable().optional(),
    special_notes: z.string().nullable().optional(),
    willing_to_drive: z.boolean().nullable().optional(),
    deposit_paid: z.boolean().optional(),
    full_payment_paid: z.boolean().optional(),
    access_token: z.string().nullable().optional(),
    date_created: z.string().nullable().optional(),
});

const reisDateOfBirthSchema = dateOfBirthSchema.refine(val => {
    if (!val) return true;
    const dob = new Date(val);
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    return dob <= eighteenYearsAgo;
}, {
    message: 'Je moet minimaal 18 jaar oud zijn voor deze reis.'
});

export const reisSignupFormSchema = z.object({
    trip_id: z.number().min(1, 'Trip is verplicht'),
    first_name: z.string().min(1, 'Voornaam is verplicht'),
    last_name: z.string().min(1, 'Achternaam is verplicht'),
    email: z.string().email('Ongeldig emailadres'),
    phone_number: phoneNumberSchema,
    date_of_birth: reisDateOfBirthSchema,
    terms_accepted: z.boolean().refine(val => val === true, {
        message: 'Je moet de algemene voorwaarden accepteren.',
    }),
    website: z.string().optional(), // Honeypot
    allergies: z.string().optional().nullable(),
    special_notes: z.string().optional().nullable(),
});

export const reisPaymentEnrichmentSchema = z.object({
    first_name: z.string().min(1, 'Voornaam is verplicht'),
    last_name: z.string().min(1, 'Achternaam is verplicht'),
    phone_number: phoneNumberSchema,
    date_of_birth: reisDateOfBirthSchema,
    id_document: z.string().optional().nullable(),
    document_number: z.string().nullable().optional(),
    document_expiry_date: z.string().nullable().optional(),
    extra_luggage: z.boolean().optional().nullable(),
    allergies: z.string().optional().nullable(),
    special_notes: z.string().optional().nullable(),
    willing_to_drive: z.boolean().optional().nullable(),
    is_bus_trip: z.boolean().optional().nullable(),
}).superRefine((data, ctx) => {
    // Skip document checks if it's a bus trip
    if (data.is_bus_trip) return;

    // Enforce document selection if not a bus trip
    if (!data.id_document || data.id_document === 'none') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Maak een keuze voor het ID-document.',
            path: ['id_document']
        });
        return;
    }

    // Identity checks
    const docNum = data.document_number?.trim() || '';
    
    // 1. Required check
    if (docNum.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Documentnummer is verplicht.',
            path: ['document_number']
        });
        return;
    }

    // 2. Format check: 6-12 alphanumeric, must have both letters and digits
    const formatRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{6,12}$/;
    if (!formatRegex.test(docNum)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Ongeldig formaat (6-12 tekens, letters én cijfers verplicht).',
            path: ['document_number']
        });
    }

    // 3. BSN check: 9 digits only
    if (docNum.length === 9 && /^\d+$/.test(docNum)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Dit lijkt op een BSN (9 cijfers). Gebruik je Paspoort of ID nummer.',
            path: ['document_number']
        });
    }

    // 4. Repeating chars check
    if (/^(.)\1+$/.test(docNum)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Herhalende tekens zijn niet toegestaan.',
            path: ['document_number']
        });
    }

    // 5. Expiry Date check
    if (!data.document_expiry_date || data.document_expiry_date.trim().length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Vervaldatum is verplicht.',
            path: ['document_expiry_date']
        });
    }
});

export type ReisSiteSettings = z.infer<typeof reisSiteSettingsSchema>;
export type ReisTrip = z.infer<typeof reisTripSchema>;
export type ReisTripSignup = z.infer<typeof reisTripSignupSchema>;
export type ReisSignupForm = z.infer<typeof reisSignupFormSchema>;
export type ReisPaymentEnrichment = z.infer<typeof reisPaymentEnrichmentSchema>;
