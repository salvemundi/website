import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, desc } from 'drizzle-orm';
import { type PubCrawlEvent } from '@salvemundi/validations/schema/pub-crawl.zod';

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

export async function fetchPubCrawlEventsDb(): Promise<PubCrawlEvent[]> {
    const rows = await db.select().from(schema.pub_crawl_events).orderBy(desc(schema.pub_crawl_events.date)).limit(100);

    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    return rows.map((raw) => {
        const groups = normalizeGroups(raw.groups);
        return {
            ...raw,
            date: raw.date ? toLocalISOString(raw.date) : undefined,
            price: 1,
            max_tickets_per_person: 10,
            groups
        };
    }) as unknown as PubCrawlEvent[];
}

export async function fetchPubCrawlEventByIdDb(id: number): Promise<PubCrawlEvent | null> {
    const rows = await db.select().from(schema.pub_crawl_events).where(eq(schema.pub_crawl_events.id, id)).limit(1);

    if (rows.length === 0) return null;
    const raw = rows[0];
    const { toLocalISOString } = await import('@/lib/utils/date-utils');
    
    const groups = normalizeGroups(raw.groups);

    return {
        ...raw,
        date: raw.date ? toLocalISOString(raw.date) : undefined,
        price: 1,
        max_tickets_per_person: 10,
        groups
    } as unknown as PubCrawlEvent;
}
