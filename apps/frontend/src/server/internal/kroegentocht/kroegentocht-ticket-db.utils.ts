import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';

export async function createPubCrawlTicketsDb(signupId: number, tickets: { name: string, initial: string, qr_token: string }[]): Promise<void> {
    if (tickets.length === 0) return;

    try {
        const values = tickets.map(t => ({
            signup_id: signupId,
            name: t.name,
            initial: t.initial,
            qr_token: t.qr_token,
            created_at: new Date().toISOString()
        }));

        await db.insert(schema.pub_crawl_tickets).values(values);
    } catch (error: unknown) {
        throw error;
    }
}

export async function deletePubCrawlTicketsBySignupIdDb(signupId: number): Promise<void> {
    await db.delete(schema.pub_crawl_tickets).where(eq(schema.pub_crawl_tickets.signup_id, signupId));
}

export async function updatePubCrawlTicketDb(id: number, data: { name: string, initial: string }): Promise<void> {
    await db.update(schema.pub_crawl_tickets).set({
        name: data.name,
        initial: data.initial
    }).where(eq(schema.pub_crawl_tickets.id, BigInt(id)));
}