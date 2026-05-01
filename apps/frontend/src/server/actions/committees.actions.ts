'use server';

import { committeesSchema, type Committee } from '@salvemundi/validations/schema/committees.zod';
import { getSystemDirectus } from '@/lib/directus';
import { query } from '@/lib/database';
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

        const sql = `
            SELECT 
                c.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', cm.id,
                            'is_visible', cm.is_visible,
                            'is_leader', cm.is_leader,
                            'user_id', json_build_object(
                                'id', u.id,
                                'first_name', u.first_name,
                                'last_name', u.last_name,
                                'avatar', u.avatar,
                                'title', u.title
                            )
                        )
                    ) FILTER (WHERE cm.id IS NOT NULL), 
                    '[]'
                ) as members
            FROM committees c
            LEFT JOIN committee_members cm ON c.id = cm.committee_id AND cm.is_visible = true
            LEFT JOIN directus_users u ON cm.user_id = u.id
            WHERE c.is_visible = true
            GROUP BY c.id
        `;
        const { rows: committeesWithMembers } = await query(sql);

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

