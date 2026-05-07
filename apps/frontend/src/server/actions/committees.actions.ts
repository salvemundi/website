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
              AND (c.commissie_token = $1 OR LOWER(REGEXP_REPLACE(c.name, '\\s*(\\|\\||[-–—])\\s*SALVE MUNDI\\s*$', '', 'gi')) = LOWER($1))
            GROUP BY c.id
            LIMIT 1
        `;
        
        // Note: The second part of the WHERE clause handles the "slugified name" fallback in SQL
        // We also use a more robust regex replacement in PostgreSQL
        
        const { rows } = await query(sql, [slug]);
        
        if (!rows || rows.length === 0) {
            // Last resort: fetch all and filter if SQL regex was too strict
            const all = await getCommittees();
            return all.find(c => {
                const cleaned = c.name.replace(/\s*(\|\||[-–—])?\s*SALVE MUNDI\s*$/gi, '').trim();
                return slugify(cleaned) === slug || c.commissie_token === slug;
            }) || null;
        }

        const parsed = committeesSchema.element.safeParse(rows[0]);
        return parsed.success ? parsed.data : null;
    } catch (err: unknown) {
        console.error('[Committees] Failed to fetch committee by slug:', err);
        return null;
    }
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

