'use server';

import 'server-only';
import { query } from '@/lib/db';

export interface DbUserMetadata {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    fontys_email: string | null;
    membership_status: string | null;
    membership_expiry: string | null;
    phone_number: string | null;
    date_of_birth: string | null;
    avatar: string | null;
    minecraft_username: string | null;
}

export interface DbCommittee {
    id: number;
    name: string;
    is_leader: boolean;
}

/**
 * Fetches basic user metadata.
 */
export async function fetchUserMetadataDb(userId: string): Promise<DbUserMetadata | null> {
    try {
        const res = await query(
            `SELECT id, first_name, last_name, email, fontys_email, 
                    membership_status, membership_expiry, phone_number, 
                    date_of_birth, avatar, minecraft_username 
             FROM directus_users WHERE id = $1`,
            [userId]
        );

        if (res.rowCount === 0) return null;
        
        const row = res.rows[0];
        return {
            ...row,
            membership_expiry: row.membership_expiry instanceof Date ? row.membership_expiry.toISOString() : row.membership_expiry,
            date_of_birth: row.date_of_birth instanceof Date ? row.date_of_birth.toISOString() : row.date_of_birth,
        };
    } catch (error: any) {
        console.error('[UserDb#fetchMetadata] Error:', error);
        return null;
    }
}

/**
 * Fetches user committees.
 */
export async function fetchUserCommitteesDb(userId: string): Promise<DbCommittee[]> {
    try {
        const res = await query(
            `SELECT c.id, c.name, cm.is_leader
             FROM committee_members cm
             JOIN committees c ON cm.committee_id = c.id
             WHERE cm.user_id = $1`,
            [userId]
        );

        return res.rows.map(row => ({
            id: row.id,
            name: row.name,
            is_leader: !!row.is_leader
        }));
    } catch (error: any) {
        console.error('[UserDb#fetchCommittees] Error:', error);
        return [];
    }
}
