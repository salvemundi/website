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
