import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { type Committee } from '@/shared/lib/permissions';
import {
    type DirectusUser,
    type UserBasic
} from '@salvemundi/validations';
import { selectDirectusUsersSchema } from '@salvemundi/validations/schema/db.zod';
export type { Committee, UserBasic };

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

export type UserMetadata = Partial<Pick<
    DirectusUser,
    'membership_status' | 'membership_expiry' | 'phone_number' | 'date_of_birth' | 'minecraft_username' | 'entra_id'
>>;

export async function fetchUserProfileByEmailDb(email: string): Promise<UserProfile | null> {
    const result = await db.select({
        id: schema.directus_users.id,
        first_name: schema.directus_users.first_name,
        last_name: schema.directus_users.last_name,
        email: schema.directus_users.email,
        avatar: schema.directus_users.avatar,
        membership_status: schema.directus_users.membership_status,
        phone_number: schema.directus_users.phone_number,
        date_of_birth: schema.directus_users.date_of_birth,
        entra_id: schema.directus_users.entra_id,
        membership_expiry: schema.directus_users.membership_expiry,
        description: schema.directus_users.description,
        location: schema.directus_users.location,
        title: schema.directus_users.title,
        tags: schema.directus_users.tags,
    })
    .from(schema.directus_users)
    .where(sql`LOWER(${schema.directus_users.email}) = LOWER(${email})`)
    .limit(1);

    if (result.length === 0) return null;

    const raw = result[0];
    return userProfileSchema.parse({
        ...raw,
        date_of_birth: toLocalISOString(raw.date_of_birth),
        membership_expiry: toLocalISOString(raw.membership_expiry)
    });
}

export async function fetchUserCommitteesDb(userId: string): Promise<Committee[]> {
    if (!userId || userId === '') return [];
    
    const rows = await db.select({
        id: schema.committees.id,
        name: schema.committees.name,
        azure_group_id: schema.committees.azure_group_id,
        is_leader: schema.committee_members.is_leader
    })
    .from(schema.committees)
    .innerJoin(schema.committee_members, eq(schema.committees.id, schema.committee_members.committee_id))
    .where(eq(schema.committee_members.user_id, userId));
    
    return rows as Committee[];
}

export async function fetchUserMetadataDb(userId: string): Promise<UserMetadata | null> {
    if (!userId || userId === '') return null;
    
    const rows = await db.select({
        membership_status: schema.directus_users.membership_status,
        membership_expiry: schema.directus_users.membership_expiry,
        phone_number: schema.directus_users.phone_number,
        date_of_birth: schema.directus_users.date_of_birth,
        minecraft_username: schema.directus_users.minecraft_username,
        entra_id: schema.directus_users.entra_id
    })
    .from(schema.directus_users)
    .where(eq(schema.directus_users.id, userId))
    .limit(1);

    if (rows.length === 0) return null;

    const raw = rows[0];
    return {
        membership_status: raw.membership_status,
        membership_expiry: toLocalISOString(raw.membership_expiry),
        phone_number: raw.phone_number,
        date_of_birth: toLocalISOString(raw.date_of_birth),
        minecraft_username: raw.minecraft_username,
        entra_id: raw.entra_id
    };
}