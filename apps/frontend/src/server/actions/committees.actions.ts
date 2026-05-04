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
        console.error(`[DEBUG] getCommittees: fetched ${committeesWithMembers.length} rows`);
        
        const parsed = committeesSchema.safeParse(committeesWithMembers);

        if (!parsed.success) {
            console.error('[Validation Error] getCommittees:', JSON.stringify(parsed.error.format(), null, 2));
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
    console.error(`[DEBUG] getCommitteeBySlug: searching for "${slug}" in ${committees.length} committees`);
    
    const found = committees.find(c => {
        const cleaned = c.name.replace(/\s*(\|\||[-–—])?\s*SALVE MUNDI\s*$/gi, '').trim();
        const nameSlug = slugify(cleaned);
        const tokenMatch = c.commissie_token === slug;
        const slugMatch = nameSlug === slug;
        
        if (tokenMatch || slugMatch) {
            console.error(`[DEBUG] Found match! name="${c.name}", token="${c.commissie_token}", nameSlug="${nameSlug}"`);
            return true;
        }
        return false;
    });

    if (!found) {
        console.error(`[DEBUG] No committee found for slug "${slug}". Available:`, committees.map(c => `[name="${c.name}", token="${c.commissie_token}"]`).join(', '));
    }

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

