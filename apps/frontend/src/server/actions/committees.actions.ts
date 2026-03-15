'use server';

import { committeesSchema, type Committee } from '@salvemundi/validations';

const getDirectusUrl = () =>
    process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';

const getDirectusHeaders = (): HeadersInit | null => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) {
        console.warn('[committees.actions] DIRECTUS_STATIC_TOKEN missing.');
        return null;
    }
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    };
};

/**
 * Haalt alle zichtbare commissies op.
 * We gebruiken een twee-staps fetch om de 403 op de JOIN te omzeilen.
 */
export async function getCommittees(): Promise<Committee[]> {
    const directusUrl = getDirectusUrl();
    const headers = getDirectusHeaders();

    if (!headers) {
        return [];
    }

    try {
        // Stap 1: Haal de commissies op
        const committeesUrl = `${directusUrl}/items/committees?filter[is_visible][_eq]=true&limit=100`;
        const committeesRes = await fetch(committeesUrl, { 
            headers, 
            next: { tags: ['committees'] } 
        });

        if (!committeesRes.ok) {
            console.error(`[committees.actions#getCommittees] Committees error: ${committeesRes.status}`);
            await committeesRes.text(); // Consume body
            return [];
        }

        const committeesJson = await committeesRes.json();
        type RawCommittee = {
            id: number;
            name: string;
            image?: string | null;
            is_visible?: boolean;
            short_description?: string | null;
            description?: string | null;
            email?: string | null;
        };
        const committeesData: RawCommittee[] = committeesJson?.data ?? [];

        if (committeesData.length === 0) {
            console.warn('[committees.actions#getCommittees] No committees found matching visibility filter.');
            return [];
        }

        // Stap 2: Haal alle leden op voor deze commissies
        const committeeIds = committeesData.map((c) => c.id);
        const membersFields = '*,user_id.id,user_id.first_name,user_id.last_name,user_id.avatar,user_id.title';
        const membersUrl = `${directusUrl}/items/committee_members?fields=${membersFields}&filter[committee_id][_in]=${committeeIds.join(',')}&filter[is_visible][_eq]=true&limit=500`;
        
        const membersRes = await fetch(membersUrl, { headers, next: { revalidate: 60 } });
        type RawCommitteeMember = {
            id?: number;
            committee_id?: number;
            is_visible?: boolean;
            is_leader?: boolean;
            user_id?: {
                id?: string;
                first_name?: string | null;
                last_name?: string | null;
                avatar?: string | null;
                title?: string | null;
            } | null;
        };
        let allMembers: RawCommitteeMember[] = [];

        if (membersRes.ok) {
            const membersJson = await membersRes.json();
            allMembers = membersJson?.data ?? [];
        } else {
            console.warn(`[committees.actions#getCommittees] Members junction fetch failed: ${membersRes.status}`);
            await membersRes.text(); // Consume body
        }

        // Voeg de leden toe aan de juiste commissie
        const committeesWithMembers = committeesData.map((committee) => ({
            ...committee,
            members: allMembers.filter((m) => m.committee_id === committee.id)
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
