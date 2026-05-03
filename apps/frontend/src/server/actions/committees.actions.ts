'use server';

import { committeesSchema, type Committee } from '@salvemundi/validations/schema/committees.zod';
import { query } from '@/lib/database';

const COMMITTEES_CACHE_KEY = 'cache:committees:all';
const COMMITTEES_TTL = 3600; // 1 hour

import { cacheLife } from 'next/cache';

export async function getCommittees(): Promise<Committee[]> {
    'use cache';
    cacheLife('hours');
    
    try {
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
            console.error('[Validation Error] getCommittees:', parsed.error);
            return [];
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

