import { z } from 'zod';
import { insertEventsSchema, selectDirectusUsersSchema, selectCommitteeMembersSchema, selectEventSignupsSchema } from './db.zod.js';

export const AdminActivitySchema = insertEventsSchema.extend({
    id: z.coerce.number(),
    max_sign_ups: z.coerce.number().optional().nullable(),
    price_members: z.coerce.number().optional().nullable(),
    price_non_members: z.coerce.number().optional().nullable(),
    only_members: z.coerce.boolean().optional().default(false),
    committee_id: z.coerce.number().optional().nullable(),
    image: z.union([
        z.string(),
        z.object({
            id: z.string(),
            type: z.string().nullable().optional()
        })
    ]).optional().nullable(),
    committee_name: z.string().optional().nullable(),
    signup_count: z.coerce.number().optional().default(0),
    status: z.enum(['published', 'draft', 'archived', 'scheduled']).optional().nullable(),
});

export type AdminActivity = z.infer<typeof AdminActivitySchema>;

export const AdminMemberSchema = selectDirectusUsersSchema.pick({
    id: true,
    first_name: true,
    last_name: true,
    date_of_birth: true,
    membership_expiry: true,
    status: true,
    phone_number: true,
    avatar: true,
    entra_id: true,
}).extend({
    email: z.string().email(),
});

export type AdminMember = z.infer<typeof AdminMemberSchema>;

export const CommitteeMembershipSchema = selectCommitteeMembersSchema.extend({
    id: z.coerce.string(),
    committee_id: z.object({
        id: z.coerce.string(),
        name: z.string(),
        is_visible: z.boolean(),
        azure_group_id: z.string().nullable().optional(),
    }),
});

export type CommitteeMembership = z.infer<typeof CommitteeMembershipSchema>;

export const AdminSignupSchema = selectEventSignupsSchema.extend({
    id: z.coerce.number(),
    event_id: z.object({
        id: z.coerce.string(),
        name: z.string(),
        event_date: z.string(),
    }),
});

export type AdminSignup = z.infer<typeof AdminSignupSchema>;
