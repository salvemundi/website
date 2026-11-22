import { z } from 'zod';
import { selectCommitteesSchema, selectCommitteeMembersSchema, selectDirectusUsersSchema } from './db.zod.js';

export const committeeMemberUserSchema = selectDirectusUsersSchema.pick({
    id: true,
    first_name: true,
    last_name: true,
    avatar: true,
    title: true,
});

export const committeeMemberSchema = selectCommitteeMembersSchema.extend({
    user_id: committeeMemberUserSchema.nullable().optional(),
});

export const committeeSchema = selectCommitteesSchema.extend({
    members: z.array(committeeMemberSchema).optional(),
});

export const committeesSchema = z.array(committeeSchema);

export type Committee = z.infer<typeof committeeSchema>;
export type CommitteeMember = z.infer<typeof committeeMemberSchema>;

export const updateCommitteeDetailsSchema = z.object({
    committeeId: z.string(),
    payload: z.object({
        short_description: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        image: z.string().uuid().nullable().optional(),
    }),
});

export const addCommitteeMemberSchema = z.object({
    azureGroupId: z.string().uuid(),
    committeeId: z.string(),
    userEmail: z.string().email(),
});

export const toggleCommitteeLeaderSchema = z.object({
    membershipId: z.number(),
    currentIsLeader: z.boolean(),
    azureGroupId: z.string().uuid().nullable().optional(),
    entraId: z.string().uuid(),
});

export const removeCommitteeMemberSchema = z.object({
    azureGroupId: z.string().uuid(),
    entraId: z.string().uuid(),
    isLeader: z.boolean().optional(),
});
