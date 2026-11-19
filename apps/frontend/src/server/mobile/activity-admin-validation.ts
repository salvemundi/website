import { z } from 'zod';
import { activityAdminSchema } from '@salvemundi/validations';
import { amsterdamToUTC } from '@/lib/utils/date-utils';
import { MobileError } from './http';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Ongeldige datum.');
const timeOnly = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/);
const text = z.string().nullable().optional();
const instant = z.iso.datetime({ offset: true }).nullable().optional();
export const adminActivityFormSchema = z.object({
    title: z.string().trim().min(1).max(255), description: z.string().min(1).max(100000),
    shortDescription: text, memberDescription: text,
    startsOn: dateOnly, startTime: timeOnly.nullable().optional(), endsOn: dateOnly.nullable().optional(), endTime: timeOnly.nullable().optional(),
    location: z.string().max(255).nullable().optional(), capacity: z.number().int().min(1).max(1000).nullable().optional(),
    memberPriceCents: z.number().int().min(0).max(2147483647), guestPriceCents: z.number().int().min(0).max(2147483647),
    membersOnly: z.boolean(), committeeID: z.number().int().min(1).max(2147483647).nullable().optional(),
    contactEmail: z.union([z.email().max(255), z.literal('')]).nullable().optional(),
    registrationDeadline: instant, publishAt: instant, status: z.enum(['draft', 'published', 'scheduled']),
    externalSignupURL: z.union([z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol)), z.literal('')]).nullable().optional(),
    removeImage: z.boolean().optional()
}).strict();
export type AdminActivityForm = z.infer<typeof adminActivityFormSchema>;
export function validateAdminActivityForm(input: unknown): AdminActivityForm {
    const parsed = adminActivityFormSchema.safeParse(input);
    if (!parsed.success) throw new MobileError('invalid_request', 'Controleer de ingevulde activiteitgegevens.');
    const form = parsed.data;
    const start = amsterdamToUTC(`${form.startsOn}T${form.startTime || '00:00'}`);
    const end = form.endsOn ? amsterdamToUTC(`${form.endsOn}T${form.endTime || '23:59'}`) : null;
    if (!start || (end && Date.parse(end) < Date.parse(start))) throw new MobileError('invalid_request', 'De eindtijd moet na de begintijd liggen.');
    if (form.registrationDeadline && Date.parse(form.registrationDeadline) > Date.parse(start)) throw new MobileError('invalid_request', 'De inschrijfdeadline mag niet na de begintijd liggen.');
    if (form.status === 'scheduled' && (!form.publishAt || Date.parse(form.publishAt) <= Date.now())) throw new MobileError('invalid_request', 'Kies een publicatiemoment in de toekomst.');
    const shared = activityAdminSchema.safeParse({
        name: form.title, description: form.description, short_description: form.shortDescription || null,
        description_logged_in: form.memberDescription || null, event_date: form.startsOn, event_time: form.startTime || null,
        event_date_end: form.endsOn || null, event_time_end: form.endTime || null, location: form.location || null,
        max_sign_ups: form.capacity ?? null, price_members: form.memberPriceCents / 100, price_non_members: form.guestPriceCents / 100,
        only_members: form.membersOnly, committee_id: form.committeeID ?? null, contact: form.contactEmail || null,
        registration_deadline: form.registrationDeadline || null, publish_date: form.publishAt || null,
        status: form.status, custom_url: form.externalSignupURL || null
    });
    if (!shared.success) throw new MobileError('invalid_request', shared.error.issues[0]?.message || 'Controleer de activiteitgegevens.');
    return form;
}
export function activityWriteValues(form: AdminActivityForm) {
    return [form.title, form.description, form.shortDescription || null, form.memberDescription || null,
        form.startsOn, form.startTime || null, form.endsOn || null, form.endTime || null, form.location || null,
        form.capacity ?? null, (form.memberPriceCents / 100).toFixed(2), (form.guestPriceCents / 100).toFixed(2),
        form.membersOnly, form.committeeID ?? null, form.contactEmail || null, form.registrationDeadline || null,
        form.externalSignupURL || null, form.status === 'scheduled' ? 'published' : form.status,
        form.status === 'published' ? null : form.publishAt || null];
}
