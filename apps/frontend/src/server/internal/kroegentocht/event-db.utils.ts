import { query } from '@/lib/database';
import { type PubCrawlEvent } from '@salvemundi/validations/schema/pub-crawl.zod';
import { type DbPubCrawlEventRow } from './types';

/**
 * Fetches all pub crawl events.
 */
export async function fetchPubCrawlEventsDb(): Promise<PubCrawlEvent[]> {
    const res = await query(
        `SELECT * FROM pub_crawl_events ORDER BY date DESC LIMIT 100`,
        []
    );

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    return (res.rows as DbPubCrawlEventRow[]).map((raw) => ({
        ...raw,
        date: toLocalISOString(raw.date) ?? undefined,
        price: 1,
        max_tickets_per_person: 10
    })) as unknown as PubCrawlEvent[];
}
