import { z } from 'zod';

export const CAMERA_REQUEST_STATUSES = ['requested', 'approved', 'rejected', 'cancelled'] as const;
export type CameraRequestStatus = (typeof CAMERA_REQUEST_STATUSES)[number];

export const CAMERA_PHOTO_STATUSES = ['not_started', 'editing', 'done'] as const;
export type CameraPhotoStatus = (typeof CAMERA_PHOTO_STATUSES)[number];
export const CAMERA_PHOTO_STATUS_LABEL: Record<CameraPhotoStatus, string> = {
    not_started: 'Nog niet begonnen',
    editing: 'Aan het editen',
    done: 'Klaar',
};

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
    photo_status: CameraPhotoStatus;
    proposed_photographer_name: string | null;
    assigned_photographer_name: string | null;
    note_admin: string | null;
}

// ---- Beheer ----

export const saveCameraRequestSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(CAMERA_REQUEST_STATUSES),
    photo_status: z.enum(CAMERA_PHOTO_STATUSES).default('not_started'),
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
export const updateCameraPhotographerSchema = z.object({
    id: z.string().uuid(),
    admitted_on: dateString,
    route: optionalText(100),
    experienced: z.boolean(),
    note: optionalText(300),
});
export type UpdateCameraPhotographerInput = z.output<typeof updateCameraPhotographerSchema>;

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

// ---- Uitleenlog ----

export const CAMERA_CHECKLIST_ITEMS = [
    { key: 'camera', label: 'Camera' },
    { key: 'lens', label: 'Lens' },
    { key: 'flash', label: 'Flitser' },
    { key: 'battery', label: 'Accu' },
    { key: 'card', label: 'Geheugenkaart' },
] as const;

export type CameraChecklistKey = (typeof CAMERA_CHECKLIST_ITEMS)[number]['key'];
export type CameraChecklist = Record<CameraChecklistKey, boolean>;

const checklistSchema = z.object({
    camera: z.boolean(),
    lens: z.boolean(),
    flash: z.boolean(),
    battery: z.boolean(),
    card: z.boolean(),
});

export const handoutCameraSchema = z.object({
    request_id: z.string().uuid(),
    checklist: checklistSchema,
    note: optionalText(500),
});
export type HandoutCameraInput = z.output<typeof handoutCameraSchema>;

export const returnCameraSchema = z.object({
    id: z.string().uuid(),
    returned_on: dateString,
    condition: optionalText(500),
});
export type ReturnCameraInput = z.output<typeof returnCameraSchema>;

export interface CameraAdminLoan {
    id: string;
    request_id: string;
    borrower_name: string;
    event_name: string;
    photographer_name: string | null;
    start_date: string;
    agreed_end_date: string;
    handed_out_at: string;
    returned_on: string | null;
    checklist: CameraChecklist;
    complete: boolean;
    handout_note: string | null;
    condition_on_return: string | null;
    days_late: number;
}
