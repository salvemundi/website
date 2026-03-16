import { z } from 'zod';

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
    inschrijf_deadline: z.string().nullable().optional(),
    only_members: z.boolean().nullable().optional().default(false),
    status: z.string().nullable().optional(),
});

export type Activity = z.infer<typeof activitySchema>;

export const activitiesResponseSchema = z.object({
    data: z.array(activitySchema),
});

export const eventSignupFormSchema = z.object({
    event_id: z.number(),
    name: z.string().min(1, 'Naam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    phoneNumber: z.string().min(1, 'Telefoonnummer is verplicht'),
    website: z.string().optional(), // Honeypot
});

export type EventSignupForm = z.infer<typeof eventSignupFormSchema>;

export const attendanceSchema = z.object({
    signupId: z.number(),
    status: z.boolean(),
});
