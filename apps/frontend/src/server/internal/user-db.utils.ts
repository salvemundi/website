import 'server-only';
import { query } from '@/lib/database';
import { z } from 'zod';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { type Committee } from '@/shared/lib/permissions';
export type { Committee };

export const userProfileSchema = z.object({
    id: z.string().uuid(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    email: z.string().email(),
    avatar: z.string().uuid().nullable().optional(),
    membership_status: z.string().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    entra_id: z.string().nullable().optional(),
    membership_expiry: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    admin_access: z.boolean().nullable().optional()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export interface UserBasic {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
}

export interface UserMetadata {
    membership_status: string | null;
    membership_expiry: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    minecraft_username: string | null;
    entra_id: string | null;
}

interface RawUserRow {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar: string | null;
    membership_status: string | null;
    phone_number: string | null;
    date_of_birth: string | Date | null;
    entra_id: string | null;
    membership_expiry: string | Date | null;
    description: string | null;
    location: string | null;
    title: string | null;
    tags: string[] | null;
    admin_access: boolean | null;
}

interface RawUserMetadataRow {
    membership_status: string | null;
    membership_expiry: string | Date | null;
    phone_number: string | null;
    date_of_birth: string | Date | null;
    minecraft_username: string | null;
    entra_id: string | null;
}

export async function fetchUserProfileByEmailDb(email: string): Promise<UserProfile | null> {
    const { rows } = await query<RawUserRow>(
        `SELECT id, first_name, last_name, email, avatar, 
                membership_status, phone_number, date_of_birth, 
                entra_id, membership_expiry, description, 
                location, title, tags, admin_access
         FROM directus_users 
         WHERE LOWER(email) = LOWER($1) 
         LIMIT 1`,
        [email]
    );

    if (rows.length === 0) return null;

    const raw = rows[0];
    const parsed = userProfileSchema.safeParse({
        ...raw,
        date_of_birth: toLocalISOString(raw.date_of_birth),
        membership_expiry: toLocalISOString(raw.membership_expiry)
    });

    if (!parsed.success) {
        return raw as unknown as UserProfile;
    }

    return parsed.data;
}

export async function fetchUserCommitteesDb(userId: string): Promise<Committee[]> {
    if (!userId || userId === '') return [];
    const { rows } = await query<Committee>(
        `SELECT c.id, c.name, c.azure_group_id, cm.is_leader
         FROM committees c
         JOIN committee_members cm ON c.id = cm.committee_id
         WHERE cm.user_id = $1`,
        [userId]
    );
    return rows;
}

export async function fetchUserMetadataDb(userId: string): Promise<UserMetadata | null> {
    if (!userId || userId === '') return null;
    const { rows } = await query<RawUserMetadataRow>(
        `SELECT membership_status, membership_expiry, phone_number, date_of_birth, minecraft_username, entra_id
         FROM directus_users 
         WHERE id = $1 
         LIMIT 1`,
        [userId]
    );

    if (rows.length === 0) return null;

    const raw = rows[0];
    return {
        membership_status: raw.membership_status,
        membership_expiry: raw.membership_expiry instanceof Date ? raw.membership_expiry.toISOString() : raw.membership_expiry,
        phone_number: raw.phone_number,
        date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : raw.date_of_birth,
        minecraft_username: raw.minecraft_username,
        entra_id: raw.entra_id
    };
}