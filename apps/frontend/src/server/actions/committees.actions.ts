'use server';

import { committeesSchema, type Committee } from '@salvemundi/validations/schema/committees.zod';
import { COMMITTEE_FIELDS, COMMITTEE_MEMBER_FIELDS } from '@salvemundi/validations/directus/fields';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getRedis } from '@/server/auth/redis-client';

const COMMITTEES_CACHE_KEY = 'cache:committees:all';
const COMMITTEES_TTL = 3600; // 1 hour

export async function getCommittees(): Promise<Committee[]> {
    try {
        try {
            const redis = await getRedis();
            const cached = await redis.get(COMMITTEES_CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                const parsed = committeesSchema.safeParse(data);
                if (parsed.success) {
                    return parsed.data;
                }
            }
        } catch (cacheErr) {
            
        }

        const committeesData = await getSystemDirectus().request(readItems('committees', {
            filter: { is_visible: { _eq: true } },
            fields: [...COMMITTEE_FIELDS],
            limit: 100
        }));

        if (committeesData.length === 0) {
            return [];
        }

        const committeeIds = (committeesData as any[]).map((c: { id: string | number }) => c.id);
        const allMembers = await getSystemDirectus().request(readItems('committee_members', {
            fields: [
                ...COMMITTEE_MEMBER_FIELDS, 
                { user_id: ['id', 'first_name', 'last_name', 'avatar', 'title'] } as unknown as any
            ],
            filter: { 
                committee_id: { _in: committeeIds as (string | number)[] },
                is_visible: { _eq: true }
            },
            limit: 500
        }));

        const committeesWithMembers = committeesData.map((committee: Record<string, unknown>) => ({
            ...committee,
            members: (allMembers as any[]).filter((m: { committee_id: string | number | { id: string | number } }) => (typeof m.committee_id === 'object' ? m.committee_id.id : m.committee_id) === committee.id)
        }));

        const parsed = committeesSchema.safeParse(committeesWithMembers);

        if (!parsed.success) {
            
            return [];
        }

        try {
            const redis = await getRedis();
            await redis.setex(COMMITTEES_CACHE_KEY, COMMITTEES_TTL, JSON.stringify(parsed.data));
        } catch (cacheStoreErr) {
            
        }

        return parsed.data;
    } catch (err: unknown) {
        console.error('[Committees] Failed to fetch committees:', err);
        return [];
    }
}

export async function getCommitteeBySlug(slug: string): Promise<Committee | null> {
    const committees = await getCommittees();
    
    const found = committees.find(c => {
        const cleaned = c.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
        return slugify(cleaned) === slug;
    });

    return found || null;
}

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

