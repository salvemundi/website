import { z } from 'zod';
import { dateOfBirthSchema, phoneNumberSchema } from './shared.zod.js';
import { selectTripsSchema, selectTripSignupsSchema } from './db.zod.js';

export const reisSiteSettingsSchema = z.object({
    id: z.string().optional(),
    show: z.boolean(),
    disabled_message: z.string().nullable().optional(),
});
export type ReisSiteSettings = z.infer<typeof reisSiteSettingsSchema>;

export const reisTripSchema = selectTripsSchema.extend({
    image: z.union([
        z.string(),
        z.object({
            id: z.string(),
            type: z.string().nullable().optional(),
        }),
    ]).nullable().optional(),
});
export type ReisTrip = z.infer<typeof reisTripSchema>;

export const reisTripSignupSchema = selectTripSignupsSchema.extend({
    first_name: z.string().min(1, 'Voornaam is verplicht'),
    last_name: z.string().min(1, 'Achternaam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    status: z.enum(['registered', 'waitlist', 'confirmed', 'cancelled']).optional().nullable(),
});
export type ReisTripSignup = z.infer<typeof reisTripSignupSchema>;

const reisDateOfBirthSchema = dateOfBirthSchema.refine(dateOfBirthValue => {
    if (!dateOfBirthValue) return true;
    const dob = new Date(dateOfBirthValue);
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
    terms_accepted: z.boolean().refine(termsValue => termsValue === true, {
        message: 'Je moet de algemene voorwaarden accepteren.',
    }),
    website: z.string().optional(),
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
    if (data.is_bus_trip) return;

    if (!data.id_document || data.id_document === 'none') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Maak een keuze voor het ID-document.',
            path: ['id_document'],
        });
    }

    if (!data.document_number) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Documentnummer is verplicht.',
            path: ['document_number'],
        });
    }

    if (!data.document_expiry_date) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Verloopdatum is verplicht.',
            path: ['document_expiry_date'],
        });
    } else {
        const expiryDate = new Date(data.document_expiry_date);

        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 14);

        if (expiryDate <= returnDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Document moet geldig zijn tot na terugkomst.',
                path: ['document_expiry_date'],
            });
        }
    }
});

export type ReisSignupForm = z.infer<typeof reisSignupFormSchema>;
export type ReisPaymentEnrichment = z.infer<typeof reisPaymentEnrichmentSchema>;