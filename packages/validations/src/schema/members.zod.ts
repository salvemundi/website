import { z } from 'zod';
import { selectDirectusUsersSchema } from './db.zod.js';

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

export const userBasicSchema = selectDirectusUsersSchema.pick({
    id: true,
    first_name: true,
    last_name: true,
    email: true,
    avatar: true,
    membership_status: true,
});

export type UserBasic = z.infer<typeof userBasicSchema>;
