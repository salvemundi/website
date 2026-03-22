'use server';

import { committeesSchema, type Committee } from '@salvemundi/validations';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

/**
 * Haalt alle zichtbare commissies op.
 * We gebruiken een twee-staps fetch om de 403 op de JOIN te omzeilen.
 */
export async function getCommittees(): Promise<Committee[]> {
    try {
        // Stap 1: Haal de commissies op
        const committeesData = await getSystemDirectus().request(readItems('committees', {
            filter: { is_visible: { _eq: true } },
            limit: 100
        }));

        if (committeesData.length === 0) {
            console.warn('[committees.actions#getCommittees] No committees found matching visibility filter.');
            return [];
        }

        // Stap 2: Haal alle leden op voor deze commissies (twee-staps fetch)
        const committeeIds = committeesData.map((c: any) => c.id);
        const allMembers = await getSystemDirectus().request(readItems('committee_members', {
            fields: ['id', 'committee_id', 'is_leader', 'is_visible', { user_id: ['id', 'first_name', 'last_name', 'avatar', 'title'] } as any],
            filter: { 
                committee_id: { _in: committeeIds as any },
                is_visible: { _eq: true }
            },
            limit: 500
        }));

        // Voeg de leden toe aan de juiste commissie
        const committeesWithMembers = committeesData.map((committee: any) => ({
            ...committee,
            members: allMembers.filter((m: any) => (typeof m.committee_id === 'object' ? m.committee_id.id : m.committee_id) === committee.id)
        }));

        // Validatie met Zod
        const parsed = committeesSchema.safeParse(committeesWithMembers);

        if (!parsed.success) {
            console.error('[committees.actions#getCommittees] Validation failed:', JSON.stringify(parsed.error.format(), null, 2));
            return [];
        }

        return parsed.data;
    } catch (err) {
        console.error('[committees.actions#getCommittees] Error:', err);
        return [];
    }
}

/**
 * Haalt één commissie op basis van slug (naam).
 */
export async function getCommitteeBySlug(slug: string): Promise<Committee | null> {
    const committees = await getCommittees();
    
    // We gebruiken dezelfde slugify-logica om de match te vinden
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

