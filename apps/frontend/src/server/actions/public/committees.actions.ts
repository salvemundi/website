'use server';

import { committeesSchema, type Committee } from '@salvemundi/validations/schema/committees.zod';
import { query } from '@/lib/database';
import { safeConsoleError } from '@/server/utils/logger';

interface CommitteeMemberJson {
    id: string;
    is_visible: boolean;
    is_leader: boolean;
    user_id: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        avatar: string | null;
        title: string | null;
    };
}

interface CommitteeRow {
    id: string;
    name: string;
    commissie_token: string | null;
    is_visible: boolean;
    members: CommitteeMemberJson[];
    description?: string | null;
    short_description?: string | null;
    image?: string | null;
    azure_group_id?: string | null;
}

export async function getCommittees(): Promise<Committee[]> {
    try {
        const sql = `
            SELECT 
                c.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', cm.id,
                            'committee_id', cm.committee_id,
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
        const { rows: committeesWithMembers } = await query<CommitteeRow>(sql);

        const parsed = committeesSchema.safeParse(committeesWithMembers);

        if (!parsed.success) {
            safeConsoleError('[committees.actions.ts][getCommittees] Schema validation failed:', parsed.error.format());
            return [];
        }

        return parsed.data;
    } catch (error: unknown) {
        safeConsoleError('[committees.actions.ts][getCommittees] Failed to fetch committees:', error);
        return [];
    }
}

export async function getCommitteeBySlug(slug: string): Promise<Committee | null> {
    try {
        const sql = `
            SELECT 
                c.*,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', cm.id,
                            'committee_id', cm.committee_id,
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
              AND (c.commissie_token = $1 OR LOWER(REGEXP_REPLACE(c.name, '\\s*(\\|\\|[-–—])\\s*SALVE MUNDI\\s*$', '', 'gi')) = LOWER($1))
            GROUP BY c.id
            LIMIT 1
        `;

        const { rows } = await query<CommitteeRow>(sql, [slug]);

        if (rows.length === 0) {
            const all = await getCommittees();
            return all.find(c => {
                const cleaned = c.name.replace(/\s*(\|\||[-–—])?\s*SALVE MUNDI\s*$/gi, '').trim();
                return slugify(cleaned) === slug || c.commissie_token === slug;
            }) || null;
        }

        const parsed = committeesSchema.element.safeParse(rows[0]);
        return parsed.success ? parsed.data : null;
    } catch (error: unknown) {
        safeConsoleError('[committees.actions.ts][getCommitteeBySlug] Failed to fetch committee by slug:', error);
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