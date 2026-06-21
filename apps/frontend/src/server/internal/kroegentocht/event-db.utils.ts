import { query } from '@/lib/database';
import { type PubCrawlEvent } from '@salvemundi/validations/schema/pub-crawl.zod';
import { type PubCrawlEventRow } from './types';

interface GroupConfig {
    name: string;
    leaders?: { name: string; signupId?: number | null }[];
}

function normalizeGroups(rawGroups: unknown): GroupConfig[] {
    if (!rawGroups) return [];
    
    let parsed: unknown[] = [];
    if (Array.isArray(rawGroups)) {
        parsed = rawGroups;
    } else if (typeof rawGroups === 'string') {
        try {
            const res = JSON.parse(rawGroups) as unknown;
            if (Array.isArray(res)) {
                parsed = res;
            }
        } catch {}
    }

    return parsed.map((item) => {
        if (typeof item === 'string') {
            return { name: item, leaders: [] };
        } else if (item && typeof item === 'object') {
            const obj = item as { name?: unknown; leaders?: unknown };
            return {
                name: typeof obj.name === 'string' ? obj.name : '',
                leaders: Array.isArray(obj.leaders) ? (obj.leaders as { name: string; signupId?: number | null }[]) : []
            };
        }
        return { name: '', leaders: [] };
    }).filter(g => g.name !== '');
}

/**
 * Fetches all pub crawl events.
 */
export async function fetchPubCrawlEventsDb(): Promise<PubCrawlEvent[]> {
    const res = await query(
        `SELECT * FROM pub_crawl_events ORDER BY date DESC LIMIT 100`,
        []
    );

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    return (res.rows as (PubCrawlEventRow & { groups?: unknown })[]).map((raw) => {
        const groups = normalizeGroups(raw.groups);
        return {
            ...raw,
            date: toLocalISOString(raw.date) ?? undefined,
            price: 1,
            max_tickets_per_person: 10,
            groups
        };
    }) as unknown as PubCrawlEvent[];
}

/**
 * Fetches a single pub crawl event by ID directly from PostgreSQL.
 */
export async function fetchPubCrawlEventByIdDb(id: number): Promise<PubCrawlEvent | null> {
    const res = await query(
        `SELECT * FROM pub_crawl_events WHERE id = $1 LIMIT 1`,
        [id]
    );

    if (res.rowCount === 0) return null;
    const raw = res.rows[0] as PubCrawlEventRow & { groups?: unknown };
    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    
    const groups = normalizeGroups(raw.groups);

    return {
        ...raw,
        date: toLocalISOString(raw.date) ?? undefined,
        price: 1,
        max_tickets_per_person: 10,
        groups
    } as unknown as PubCrawlEvent;
}
