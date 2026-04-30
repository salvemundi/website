import { z } from 'zod';

// Admin Activity schemas

export const AdminActivitySchema = z.object({
    id: z.coerce.number(),
    name: z.string(),
    event_date: z.string(),
    event_date_end: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    max_sign_ups: z.coerce.number().optional().nullable(),
    price_members: z.coerce.number().optional().nullable(),
    price_non_members: z.coerce.number().optional().nullable(),
    registration_deadline: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    image: z.union([
        z.string(),
        z.object({
            id: z.string(),
            type: z.string().nullable().optional()
        })
    ]).optional().nullable(),
    committee_id: z.coerce.number().optional().nullable(),
    committee_name: z.string().optional().nullable(),
    status: z.enum(['published', 'draft', 'archived', 'scheduled']).optional().nullable(),
    publish_date: z.string().optional().nullable(),
    signup_count: z.coerce.number().optional().default(0)
});

export type AdminActivity = z.infer<typeof AdminActivitySchema>;
