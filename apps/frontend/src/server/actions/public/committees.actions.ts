'use server';

import { committeesSchema, type Committee } from '@salvemundi/validations/schema/committees.zod';
import { db } from '@/lib/database/db';
import { safeConsoleError } from '@/server/utils/logger';

export async function getCommittees(): Promise<Committee[]> {
    try {
        const rows = await db.query.committees.findMany({
            where: (committees, { eq }) => eq(committees.is_visible, true),
            with: {
                committee_members: {
                    where: (committee_members, { eq }) => eq(committee_members.is_visible, true),
                    with: {
                        directus_user: {
                            columns: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                avatar: true,
                                title: true,
                            }
                        }
                    }
                }
            }
        });

        const mappedRows = rows.map(c => ({
            ...c,
            members: c.committee_members.map(cm => ({
                id: cm.id,
                committee_id: cm.committee_id,
                is_visible: cm.is_visible,
                is_leader: cm.is_leader,
                user_id: cm.directus_user ? {
                    id: cm.directus_user.id,
                    first_name: cm.directus_user.first_name,
                    last_name: cm.directus_user.last_name,
                    avatar: cm.directus_user.avatar,
                    title: cm.directus_user.title
                } : null
            }))
        }));

        const parsed = committeesSchema.safeParse(mappedRows);

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
        const all = await getCommittees();
        return all.find(c => {
            const cleaned = c.name.replace(/\s*(\|\||[-–—])?\s*SALVE MUNDI\s*$/gi, '').trim();
            return slugify(cleaned) === slug || c.commissie_token === slug;
        }) || null;
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