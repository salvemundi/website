import { z } from 'zod';

export const CAMERA_REQUEST_STATUSES = ['requested', 'approved', 'rejected', 'cancelled'] as const;
export type CameraRequestStatus = (typeof CAMERA_REQUEST_STATUSES)[number];

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Vul een geldige datum in');

// Tijd is optioneel: lege invoer wordt null (dan geldt de hele dag).
const optionalTime = z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v.slice(0, 5)))
    .nullish()
    .transform((v) => v ?? null)
    .refine((v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), 'Vul een geldige tijd in');

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max, `Maximaal ${max} tekens`)
        .transform((v) => (v === '' ? null : v))
        .nullish()
        .transform((v) => v ?? null);

export const createCameraRequestSchema = z
    .object({
        // Optioneel: een activiteit van de website. Zonder koppeling is event_name verplicht.
        event_id: z.coerce.number().int().positive().nullish().transform((v) => v ?? null),
        event_name: z.string().trim().min(1, 'Vul de naam van de activiteit in').max(255, 'Maximaal 255 tekens'),
        start_date: dateString,
        start_time: optionalTime,
        end_date: dateString,
        end_time: optionalTime,
        proposed_photographer_id: z
            .string()
            .uuid()
            .nullish()
            .or(z.literal('').transform(() => null))
            .transform((v) => v ?? null),
        note: optionalText(500),
    })
    .superRefine((v, ctx) => {
        if (v.end_date < v.start_date) {
            ctx.addIssue({ code: 'custom', path: ['end_date'], message: 'De einddatum mag niet voor de startdatum liggen' });
            return;
        }
        if (v.start_date === v.end_date && v.start_time && v.end_time && v.end_time <= v.start_time) {
            ctx.addIssue({ code: 'custom', path: ['end_time'], message: 'De eindtijd moet na de starttijd liggen' });
        }
    });

export type CreateCameraRequestInput = z.output<typeof createCameraRequestSchema>;

export interface CameraEventOption {
    id: number;
    name: string;
    start_date: string;
    start_time: string | null;
    end_date: string;
    end_time: string | null;
    committee_id: number | null;
    /** Alleen 'draft' (concept) en 'scheduled' wijken af van gepubliceerd. */
    status: string | null;
}

export interface CameraCommitteeOption {
    id: number;
    name: string;
}

export interface CameraPhotographerOption {
    id: string;
    name: string;
}

export interface CameraRequestSummary {
    id: string;
    event_name: string;
    start_date: string;
    start_time: string | null;
    end_date: string;
    end_time: string | null;
    status: CameraRequestStatus;
    proposed_photographer_name: string | null;
    assigned_photographer_name: string | null;
    note_admin: string | null;
}

// ---- Beheer ----

export const saveCameraRequestSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(CAMERA_REQUEST_STATUSES),
    assigned_photographer_id: z
        .string()
        .uuid()
        .nullish()
        .or(z.literal('').transform(() => null))
        .transform((v) => v ?? null),
    note_admin: optionalText(500),
});
export type SaveCameraRequestInput = z.output<typeof saveCameraRequestSchema>;

export const addCameraPhotographerSchema = z.object({
    user_id: z.string().uuid('Kies een lid'),
    route: optionalText(100),
    experienced: z.boolean().default(false),
    note: optionalText(300),
});
export type AddCameraPhotographerInput = z.output<typeof addCameraPhotographerSchema>;

export interface CameraAdminRequest extends CameraRequestSummary {
    requester_name: string;
    requester_email: string | null;
    note: string | null;
    proposed_photographer_id: string | null;
    assigned_photographer_id: string | null;
    /** Overlapt met een andere actieve (aangevraagd/goedgekeurd) aanvraag. */
    overlap: boolean;
    created_at: string | null;
}

export interface CameraAdminPhotographer {
    id: string;
    user_id: string;
    name: string;
    admitted_on: string;
    route: string | null;
    experienced: boolean;
    note: string | null;
}

export interface CameraMemberOption {
    id: string;
    name: string;
}
