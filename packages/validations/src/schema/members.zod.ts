import { z } from 'zod';

export const memberSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    azureOid: z.string().optional(),
});

export const memberUpdateSchema = memberSchema.partial();

export type Member = z.infer<typeof memberSchema>;
export type MemberUpdate = z.infer<typeof memberUpdateSchema>;

export const userBasicSchema = z.object({
    id: z.string(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    email: z.string().email(),
    avatar: z.string().nullable().optional(),
    membership_status: z.string().nullable().optional(),
});

export type UserBasic = z.infer<typeof userBasicSchema>;
