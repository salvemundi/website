import { z } from 'zod';
import { phoneNumberSchema } from './shared.zod.js';

export const ICT_DIRECTIONS = [
    'Artificial Intelligence',
    'Business Intelligence & Data',
    'Business IT & Management',
    'Cyber Security',
    'Embedded Software Engineering',
    'Game Design & Development',
    'Infrastructure & Cloud',
    'Multimedia Design & Concepts',
    'Robotics',
    'Smart Industry & Internet of Things',
    'Software Engineering',
    'Software Engineering Accelerated Programme',
    'User Interaction Design & Development',
] as const;

export const vacancyTypeSchema = z.enum(['internship', 'parttime']);
export type VacancyType = z.infer<typeof vacancyTypeSchema>;

const vacancyBaseSchema = z.object({
    title: z.string().min(1, 'Titel is verplicht').max(255),
    company: z.string().min(1, 'Bedrijfsnaam is verplicht').max(255),
    description: z.string().min(1, 'Omschrijving is verplicht'),
    type: vacancyTypeSchema,
    contact_email: z.string().email('Ongeldig e-mailadres'),
    contact_phone: phoneNumberSchema.optional().or(z.literal('')),
    contact_website: z.string().url('Ongeldige website URL').optional().or(z.literal('')),
    location: z.string().min(1, 'Locatie is verplicht').max(255),
    salary: z.string().max(255).optional().or(z.literal('')),
    employment_type: z.string().max(100).optional().or(z.literal('')),
    working_hours: z.string().max(255).optional().or(z.literal('')),
    directions: z.array(z.string()),
    skills: z.array(z.string()),
});

// Public submission form: internships must select at least one ICT direction, plus a honeypot field.
export const vacancySubmissionSchema = vacancyBaseSchema.extend({
    hp_confirm: z.string().optional(), // Honeypot, must stay empty — checked explicitly in the action
}).refine((data) => data.type !== 'internship' || data.directions.length > 0, {
    message: 'Selecteer minimaal één ICT-richting voor een stage',
    path: ['directions'],
});
export type VacancySubmissionForm = z.infer<typeof vacancySubmissionSchema>;

// Admin create/edit: same shape, no honeypot, directions still required for internships.
export const vacancyAdminSchema = vacancyBaseSchema.extend({
    is_visible: z.boolean(),
}).refine((data) => data.type !== 'internship' || data.directions.length > 0, {
    message: 'Selecteer minimaal één ICT-richting voor een stage',
    path: ['directions'],
});
export type VacancyAdminForm = z.infer<typeof vacancyAdminSchema>;

export const rejectSubmissionSchema = z.object({
    submissionId: z.union([z.string(), z.number()]),
    reason: z.string().min(1, 'Geef een reden op voor afwijzing').max(1000),
});
export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>;

export interface VacancyDTO {
    id: number;
    title: string;
    company: string;
    description: string;
    type: VacancyType;
    contact_email: string;
    contact_phone: string | null;
    contact_website: string | null;
    location: string;
    salary: string | null;
    employment_type: string | null;
    working_hours: string | null;
    is_visible: boolean;
    published_at: string;
    directions: string[];
    skills: string[];
    image: string | null;
    document: string | null;
}

export interface VacancySubmissionDTO extends Omit<VacancyDTO, 'id' | 'is_visible' | 'published_at'> {
    id: number;
    status: 'pending_verification' | 'pending_review' | 'approved' | 'rejected';
    rejection_reason: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    approved_vacancy_id: number | null;
    verified_at: string | null;
    created_at: string;
}
