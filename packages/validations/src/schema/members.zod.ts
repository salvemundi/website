import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { directus_users as directus_usersTable } from '@salvemundi/db/schema';

const selectDirectusUsersSchema = createSelectSchema(directus_usersTable);

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
}).partial({
    last_name: true,
    avatar: true,
    membership_status: true,
});

export type UserBasic = z.infer<typeof userBasicSchema>;

export const userProfileSchema = selectDirectusUsersSchema.pick({
    id: true,
    first_name: true,
    last_name: true,
    avatar: true,
    membership_status: true,
    phone_number: true,
    date_of_birth: true,
    entra_id: true,
    membership_expiry: true,
    description: true,
    location: true,
    title: true,
}).extend({
    email: z.string().email(),
    date_of_birth: z.string().nullable().optional(),
    membership_expiry: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional()
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type DirectusUser = z.infer<typeof selectDirectusUsersSchema>;
