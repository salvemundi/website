import { z } from 'zod';
import { selectEventsSchema, insertEventsSchema } from './db.zod.js';
import { phoneNumberSchema } from './shared.zod.js';
import { userBasicSchema } from './members.zod.js';

const phoneRegex = /(?:\+31|0)[1-9][0-9\s-]{7,12}/;
const noPhoneMessage = "Om privacyredenen (AVG) mogen er geen telefoonnummers in de tekst staan.";

export const activitySchema = selectEventsSchema.extend({
    id: z.union([z.string(), z.number()]),
    committee_name: z.string().nullable().optional(),
    afbeelding_id: z.object({
        id: z.string(),
        type: z.string().optional()
    }).nullable().optional(),
    signup_count: z.number().optional()
});
export type Activiteit = z.infer<typeof activitySchema>;
export type Activity = Activiteit;

export const activitiesSchema = z.array(activitySchema);

export const activitiesResponseSchema = z.object({
    data: activitiesSchema,
});

export const eventSignupFormSchema = z.object({
    event_id: z.number(),
    name: z.string().min(1, 'Naam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    phoneNumber: phoneNumberSchema,
    website: z.string().optional(),
});

export type EventSignupForm = z.infer<typeof eventSignupFormSchema>;

export const attendanceSchema = z.object({
    signupId: z.number(),
    status: z.boolean(),
});

export const activityAdminSchema = insertEventsSchema.extend({
    name: z.string().min(1, 'Naam is verplicht'),
    description: z.string()
        .min(1, 'Beschrijving is verplicht')
        .refine((descriptionValue) => !phoneRegex.test(descriptionValue), { message: noPhoneMessage }),
    short_description: z.string().nullable().optional().transform(shortDescription => shortDescription === '' ? null : shortDescription)
        .refine((shortDescription) => !shortDescription || !phoneRegex.test(shortDescription), { message: noPhoneMessage }),
    description_logged_in: z.string().nullable().optional().transform(descriptionValue => descriptionValue === '' ? null : descriptionValue)
        .refine((descriptionValue) => !descriptionValue || !phoneRegex.test(descriptionValue), { message: noPhoneMessage }),
    event_date: z.string().min(1, 'Startdatum is verplicht'),
    event_time: z.string().nullable().optional().transform(timeString => timeString === '' ? null : timeString),
    event_date_end: z.string().nullable().optional().transform(dateString => dateString === '' ? null : dateString),
    event_time_end: z.string().nullable().optional().transform(timeString => timeString === '' ? null : timeString),
    location: z.string().nullable().optional().transform(locationString => locationString === '' ? null : locationString),
    max_sign_ups: z.union([z.string(), z.number()]).nullable().optional().transform(maxSignups => {
        if (maxSignups === '' || maxSignups === undefined) return null;
        return typeof maxSignups === 'string' ? parseInt(maxSignups) : maxSignups;
    }).refine((maxSignupsNumber) => maxSignupsNumber === null || maxSignupsNumber <= 1000, {
        message: "Maximum aantal deelnemers mag niet groter zijn dan 1000."
    }),
    price_members: z.union([z.string(), z.number()]).nullable().optional().transform(price => {
        if (price === '' || price === undefined || price === null) return 0;
        return typeof price === 'string' ? parseFloat(price) : price;
    }),
    price_non_members: z.union([z.string(), z.number()]).nullable().optional().transform(price => {
        if (price === '' || price === undefined || price === null) return 0;
        return typeof price === 'string' ? parseFloat(price) : price;
    }),
    registration_deadline: z.string().nullable().optional().transform(deadlineString => deadlineString === '' ? null : deadlineString),
    custom_url: z.string().nullable().optional().transform(urlString => urlString === '' ? null : urlString),
    committee_id: z.union([z.string(), z.number()]).nullable().optional().transform(committeeId => {
        if (committeeId === '' || committeeId === undefined) return null;
        return typeof committeeId === 'string' ? parseInt(committeeId) : committeeId;
    }),
    contact: z.string().nullable().optional().transform(contactString => contactString === '' ? null : contactString),
    only_members: z.union([z.boolean(), z.string()]).optional().transform(onlyMembersValue => onlyMembersValue === true || onlyMembersValue === 'on' || onlyMembersValue === 'true'),
    status: z.enum(['published', 'draft', 'scheduled']).optional().default('published'),
    publish_date: z.string().nullable().optional().transform(publishDateString => publishDateString === '' ? null : publishDateString),
}).refine((data: { event_date?: string | null, event_time?: string | null, event_date_end?: string | null, event_time_end?: string | null }) => {
    if (data.event_date) {
        const startTimeStr = data.event_time ? `T${String(data.event_time)}` : 'T00:00';
        const start = new Date(`${String(data.event_date)}${startTimeStr}`);

        if (data.event_date_end) {
            const endTimeStr = data.event_time_end ? `T${String(data.event_time_end)}` : 'T23:59';
            const end = new Date(`${String(data.event_date_end)}${endTimeStr}`);
            return end >= start;
        }
    }
    return true;
}, {
    message: "Einddatum en -tijd moeten na de startdatum en -tijd liggen.",
    path: ["event_date_end"]
}).refine((data: { event_date?: string | null, event_time?: string | null, registration_deadline?: string | null }) => {
    if (data.event_date && data.registration_deadline) {
        const startTimeStr = data.event_time ? `T${String(data.event_time)}` : 'T00:00';
        const start = new Date(`${String(data.event_date)}${startTimeStr}`);
        const deadline = new Date(data.registration_deadline);
        return deadline <= start;
    }
    return true;
}, {
    message: "Inschrijfdeadline mag niet na de startdatum en -tijd liggen.",
    path: ["registration_deadline"]
});

export type ActivityAdmin = z.infer<typeof activityAdminSchema>;

export const deleteSignupSchema = z.object({
    signupId: z.number(),
    eventId: z.union([z.string(), z.number()]),
    participantEmail: z.string().email().optional(),
    eventName: z.string().optional(),
});

export const createManualSignupSchema = z.object({
    eventId: z.number(),
    eventName: z.string(),
    signupType: z.enum(['member', 'guest']),
    guestData: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional().nullable(),
    }).optional(),
    memberData: userBasicSchema.optional(),
});

export const toggleCheckInSchema = z.object({
    signupId: z.number(),
    eventId: z.number(),
    checkedIn: z.boolean(),
});
