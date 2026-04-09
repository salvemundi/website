import { z } from 'zod';
import { phoneNumberSchema } from './shared.zod.js';

export const activitySchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    description: z.string().nullable().optional(),
    description_logged_in: z.string().nullable().optional(),
    event_date: z.string(),
    event_date_end: z.string().nullable().optional(),
    event_time: z.string().nullable().optional(),
    event_time_end: z.string().nullable().optional(),
    time_end: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    price_members: z.number().nullable().optional(),
    price_non_members: z.number().nullable().optional(),
    committee_name: z.string().nullable().optional(),
    contact: z.string().nullable().optional(),
    registration_deadline: z.string().nullable().optional(),
    only_members: z.boolean().nullable().optional().default(false),
    status: z.string().nullable().optional(),
    custom_url: z.string().nullable().optional(),
});

export type Activity = z.infer<typeof activitySchema>;

export const activitiesResponseSchema = z.object({
    data: z.array(activitySchema),
});

export const eventSignupFormSchema = z.object({
    event_id: z.number(),
    name: z.string().min(1, 'Naam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    phoneNumber: phoneNumberSchema,
    website: z.string().optional(), // Honeypot
});

export type EventSignupForm = z.infer<typeof eventSignupFormSchema>;

export const attendanceSchema = z.object({
    signupId: z.number(),
    status: z.boolean(),
});

export const activityAdminSchema = z.object({
    name: z.string().min(1, 'Naam is verplicht'),
    description: z.string().min(1, 'Beschrijving is verplicht'),
    description_logged_in: z.string().nullable().optional(),
    event_date: z.string().min(1, 'Startdatum is verplicht'),
    event_time: z.string().nullable().optional(),
    event_date_end: z.string().nullable().optional(),
    event_time_end: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    max_sign_ups: z.union([z.string(), z.number()]).nullable().optional().transform(v => {
        if (v === '' || v === undefined) return null;
        return typeof v === 'string' ? parseInt(v) : v;
    }),
    price_members: z.union([z.string(), z.number()]).nullable().optional().transform(v => {
        if (v === '' || v === undefined) return null;
        return typeof v === 'string' ? parseFloat(v) : v;
    }),
    price_non_members: z.union([z.string(), z.number()]).nullable().optional().transform(v => {
        if (v === '' || v === undefined) return null;
        return typeof v === 'string' ? parseFloat(v) : v;
    }),
    registration_deadline: z.string().nullable().optional(),
    committee_id: z.union([z.string(), z.number()]).nullable().optional().transform(v => {
        if (v === '' || v === undefined) return null;
        return typeof v === 'string' ? parseInt(v) : v;
    }),
    contact: z.string().nullable().optional(),
    only_members: z.union([z.boolean(), z.string()]).optional().transform(v => v === true || v === 'on' || v === 'true'),
    status: z.enum(['published', 'draft', 'scheduled']).optional().default('published'),
    publish_date: z.string().nullable().optional(),
});

export type ActivityAdmin = z.infer<typeof activityAdminSchema>;
