import { query } from '@/lib/database';
import { z } from 'zod';

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
    admin_access: z.boolean().nullable().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * Fetches a user profile directly from the database by email.
 */
export async function fetchUserProfileByEmailDb(email: string): Promise<UserProfile | null> {
    const { rows } = await query(
        `SELECT id, first_name, last_name, email, avatar, 
                membership_status, phone_number, date_of_birth, 
                entra_id, membership_expiry, description, 
                location, title, tags, admin_access
         FROM directus_users 
         WHERE LOWER(email) = LOWER($1) 
         LIMIT 1`,
        [email]
    );

    if (!rows || rows.length === 0) return null;

    const raw = rows[0];
    const parsed = userProfileSchema.safeParse({
        ...raw,
        date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : raw.date_of_birth,
        membership_expiry: raw.membership_expiry instanceof Date ? raw.membership_expiry.toISOString() : raw.membership_expiry,
    });

    if (!parsed.success) {
        // Fallback to raw if validation fails slightly but we have the ID (common in Directus nullable fields)
        return raw as UserProfile;
    }

    return parsed.data;
}

/**
 * Fetches the committees a user belongs to.
 */
export async function fetchUserCommitteesDb(userId: string): Promise<any[]> {
    const { rows } = await query(
        `SELECT c.id, c.name, c.azure_group_id, cm.is_leader
         FROM committees c
         JOIN committee_members cm ON c.id = cm.committee_id
         WHERE cm.user_id = $1`,
        [userId]
    );
    return rows || [];
}

/**
 * Fetches user metadata (membership, phone, dob) directly by ID.
 */
export async function fetchUserMetadataDb(userId: string): Promise<any | null> {
    const { rows } = await query(
        `SELECT membership_status, membership_expiry, phone_number, date_of_birth, minecraft_username, entra_id
         FROM directus_users 
         WHERE id = $1 
         LIMIT 1`,
        [userId]
    );

    if (!rows || rows.length === 0) return null;

    const raw = rows[0];
    return {
        ...raw,
        date_of_birth: raw.date_of_birth instanceof Date ? raw.date_of_birth.toISOString() : raw.date_of_birth,
        membership_expiry: raw.membership_expiry instanceof Date ? raw.membership_expiry.toISOString() : raw.membership_expiry,
    };
}
