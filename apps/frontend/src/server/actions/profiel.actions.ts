'use server';

import { 
    type Transaction,
    type WhatsAppGroup,
    type EventSignup,
    eventSignupSchema,
    transactionSchema,
    whatsappGroupSchema
} from '@salvemundi/validations/schema/profiel.zod';
import { 
    EVENT_SIGNUP_FIELDS,
    TRANSACTION_FIELDS,
    WHATSAPP_GROUP_FIELDS
} from '@salvemundi/validations/directus/fields';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { query } from '@/lib/database';
import { fetchUserPubCrawlSignupsDb } from './kroegentocht-db.utils';
import { fetchUserEventSignupsDb } from './event-db.utils';


export async function getUserEventSignups(overrideUserId?: string): Promise<EventSignup[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) return [];

    try {
        const registrations = await fetchUserEventSignupsDb(targetUserId);
        const parsed = eventSignupSchema.array().safeParse(registrations);

        if (!parsed.success) {
            
            return registrations as any;
        }

        return parsed.data;
    } catch (err: any) {
        
        return [];
    }
}


export async function getUserPubCrawlSignups(overrideUserId?: string): Promise<any[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) return [];

    try {
        return await fetchUserPubCrawlSignupsDb(targetUserId);
    } catch (err: any) {
        
        return [];
    }
}


export async function getUserTransactions(overrideUserId?: string): Promise<Transaction[]> {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;

    const targetUserId = overrideUserId || user?.id;
    if (!targetUserId) return [];

    try {
        const res = await query(
            `SELECT * FROM transactions 
             WHERE user_id = $1 OR email = $2
             ORDER BY created_at DESC`,
            [targetUserId, user?.email || null]
        );

        const parsed = transactionSchema.array().safeParse(res.rows);

        if (!parsed.success) {
            
            return res.rows as any;
        }

        return parsed.data;
    } catch (err: any) {
        
        return [];
    }
}


export async function getWhatsAppGroups(): Promise<WhatsAppGroup[]> {
    try {
        const res = await query(
            `SELECT id, name, invite_link, is_active 
             FROM whatsapp_groups 
             WHERE is_active = true 
             ORDER BY id ASC`
        );

        const parsed = whatsappGroupSchema.array().safeParse(res.rows);

        if (!parsed.success) {
            
            return res.rows as any;
        }

        return parsed.data;
    } catch (err: any) {
        
        return [];
    }
}

