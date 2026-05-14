import { z } from 'zod';

// Admin Activity schemas

export const AdminActivitySchema = z.object({
    id: z.coerce.number(),
    name: z.string(),
    event_date: z.string(),
    event_date_end: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    description_logged_in: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    max_sign_ups: z.coerce.number().optional().nullable(),
    price_members: z.coerce.number().optional().nullable(),
    price_non_members: z.coerce.number().optional().nullable(),
    registration_deadline: z.string().optional().nullable(),
    contact: z.string().optional().nullable(),
    event_time: z.string().optional().nullable(),
    event_time_end: z.string().optional().nullable(),
    only_members: z.coerce.boolean().optional().default(false),
    custom_url: z.string().optional().nullable(),
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

// Admin Member schemas (detailed view)
export const AdminMemberSchema = z.object({
    id: z.string(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    email: z.string().email(),
    date_of_birth: z.string().nullable().optional(),
    membership_expiry: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    entra_id: z.string().nullable().optional(),
});

export type AdminMember = z.infer<typeof AdminMemberSchema>;

export const CommitteeMembershipSchema = z.object({
    id: z.coerce.string(),
    is_leader: z.boolean(),
    committee_id: z.object({
        id: z.coerce.string(),
        name: z.string(),
        is_visible: z.boolean(),
        azure_group_id: z.string().nullable().optional(),
    }),
});

export type CommitteeMembership = z.infer<typeof CommitteeMembershipSchema>;

export const AdminSignupSchema = z.object({
    id: z.coerce.number(),
    payment_status: z.string().optional().nullable(),
    created_at: z.string(),
    event_id: z.object({
        id: z.coerce.string(),
        name: z.string(),
        event_date: z.string(),
    }),
});

export type AdminSignup = z.infer<typeof AdminSignupSchema>;
