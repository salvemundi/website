import 'server-only';
import { query } from '@/lib/database';
import { type QueryParam } from './types';

export async function createPubCrawlTicketsDb(signupId: number, tickets: { name: string, initial: string, qr_token: string }[]): Promise<void> {
    if (tickets.length === 0) return;

    try {
        const values: QueryParam[] = [];
        const placeHolders = tickets.map((t, i) => {
            const offset = i * 4;
            values.push(signupId, t.name, t.initial, t.qr_token);
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, NOW())`;
        }).join(', ');

        await query<never>(
            `INSERT INTO pub_crawl_tickets (signup_id, name, initial, qr_token, created_at)
             VALUES ${placeHolders}`,
            values
        );
    } catch (error: unknown) {
        throw error;
    }
}

export async function deletePubCrawlTicketsBySignupIdDb(signupId: number): Promise<void> {
    await query<never>(`DELETE FROM pub_crawl_tickets WHERE signup_id = $1`, [signupId]);
}

export async function updatePubCrawlTicketDb(id: number, data: { name: string, initial: string }): Promise<void> {
    await query<never>(
        `UPDATE pub_crawl_tickets SET name = $1, initial = $2 WHERE id = $3`,
        [data.name, data.initial, id]
    );
}