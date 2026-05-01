import { z } from 'zod';

export const committeeMemberUserSchema = z.object({
    id: z.string().uuid().optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    avatar: z.string().uuid().nullable().optional(),
    title: z.string().nullable().optional(),
});

export const committeeMemberSchema = z.object({
    id: z.number().optional(),
    is_visible: z.boolean(),
    is_leader: z.boolean(),
    user_id: committeeMemberUserSchema.nullable().optional(),
});

export const committeeSchema = z.object({
    id: z.number(),
    name: z.string(),
    image: z.string().uuid().nullable().optional(),
    is_visible: z.boolean().optional(),
    short_description: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    azure_group_id: z.string().uuid().nullable().optional(),
    has_history: z.boolean().nullable().optional(),
    members: z.array(committeeMemberSchema).optional(),
});

export const committeesSchema = z.array(committeeSchema);

export type Committee = z.infer<typeof committeeSchema>;
export type CommitteeMember = z.infer<typeof committeeMemberSchema>;
