'use server';

/**
 * Central server action file for all Directus data fetching.
 * Uses admin token to bypass user permission issues.
 * User tokens are ONLY for identifying users, not for data access.
 */

import { fetchDirectus, mutateDirectus, buildQuery } from '@/shared/lib/server-directus';
import { getCurrentUserAction } from '@/shared/api/auth-actions';
import { revalidateTag } from 'next/cache';


// =====================
// EVENTS
// =====================
export async function getEventsAction(): Promise<any[]> {
    try {
        const now = new Date().toISOString();
        const query = buildQuery({
            'fields': 'id,name,event_date,event_time,inschrijf_deadline,description,description_logged_in,price_members,price_non_members,max_sign_ups,only_members,image,committee_id,contact,status,publish_date',
            'sort': '-event_date',
            'filter': {
                _or: [
                    { status: { _eq: 'published' }, publish_date: { _null: true } },
                    { status: { _eq: 'published' }, publish_date: { _lte: now } }
                ]
            }
        });
        const events = await fetchDirectus<any[]>(`/items/events?${query}`, 120);
        if (!Array.isArray(events)) return [];

        // Enrich events with committee info and contact
        const enriched = await Promise.all(events.map(async (event) => {
            if (event.committee_id) {
                try {
                    const committee = await fetchDirectus<any>(`/items/committees/${event.committee_id}?fields=id,name,email`, 600);
                    if (committee) {
                        event.committee_name = cleanName(committee.name);
                        event.committee_email = committee.email || undefined;
                    }
                } catch { /* silent */ }
            }

            if (!event.contact && event.committee_id) {
                try {
                    const q = buildQuery({
                        filter: { committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } },
                        fields: 'user_id.first_name,user_id.last_name',
                        limit: '1'
                    });
                    const leaders = await fetchDirectus<any[]>(`/items/committee_members?${q}`, 600);
                    if (leaders && leaders.length > 0) {
                        event.contact_name = `${leaders[0].user_id?.first_name || ''} ${leaders[0].user_id?.last_name || ''}`.trim();
                    }
                } catch { /* silent */ }
            } else if (event.contact) {
                if (typeof event.contact === 'string' && event.contact.includes('@')) {
                    event.contact_email = event.contact;
                } else {
                    event.contact_phone = event.contact;
                }
            }
            return event;
        }));

        return enriched;
    } catch (error) {
        console.error('[data-actions] getEventsAction error:', error);
        return [];
    }
}

export async function getEventByIdAction(id: string): Promise<any | null> {
    try {
        const event = await fetchDirectus<any>(
            `/items/events/${id}?fields=id,name,event_date,event_time,inschrijf_deadline,description,description_logged_in,price_members,price_non_members,max_sign_ups,only_members,image,committee_id,contact`,
            120
        );

        if (!event) return null;

        if (event.committee_id) {
            try {
                const committee = await fetchDirectus<any>(`/items/committees/${event.committee_id}?fields=id,name,email`, 600);
                if (committee) {
                    event.committee_name = cleanName(committee.name);
                    event.committee_email = committee.email || undefined;
                }
            } catch { /* silent */ }
        }

        if (!event.contact && event.committee_id) {
            try {
                const q = buildQuery({
                    filter: { committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } },
                    fields: 'user_id.first_name,user_id.last_name',
                    limit: '1'
                });
                const leaders = await fetchDirectus<any[]>(`/items/committee_members?${q}`, 600);
                if (leaders && leaders.length > 0) {
                    event.contact_name = `${leaders[0].user_id?.first_name || ''} ${leaders[0].user_id?.last_name || ''}`.trim();
                }
            } catch { /* silent */ }
        } else if (event.contact) {
            if (typeof event.contact === 'string' && event.contact.includes('@')) {
                event.contact_email = event.contact;
            } else {
                event.contact_phone = event.contact;
            }
        }

        return event;
    } catch (error) {
        console.error('[data-actions] getEventByIdAction error:', error);
        return null;
    }
}

export async function getEventsByCommitteeAction(committeeId: number): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { committee_id: { _eq: committeeId } },
            fields: 'id,name,event_date,event_time,event_time_end,location,description,price_members,price_non_members,image',
            sort: '-event_date'
        });
        const res = await fetchDirectus<any[]>(`/items/events?${query}`, 120);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getEventsByCommitteeAction error:', error);
        return [];
    }
}

// =====================
// COMMITTEES
// =====================
export async function getCommitteesAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,name,email,image.id,is_visible,short_description,created_at,updated_at',
            sort: 'name'
        });
        const res = await fetchDirectus<any[]>(`/items/committees?${query}`, 600);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getCommitteesAction error:', error);
        return [];
    }
}

export async function getCommitteesWithMembersAction(): Promise<any[]> {
    try {
        const committees = await getCommitteesAction();
        const visible = committees.filter(c => c.is_visible !== false);

        return await Promise.all(visible.map(async (committee) => {
            try {
                const q = buildQuery({
                    filter: { committee_id: { _eq: committee.id } },
                    fields: '*,user_id.first_name,user_id.last_name,user_id.avatar'
                });
                const members = await fetchDirectus<any[]>(`/items/committee_members?${q}`, 600);
                return { ...committee, committee_members: Array.isArray(members) ? members : [] };
            } catch {
                return { ...committee, committee_members: [] };
            }
        }));
    } catch (error) {
        console.error('[data-actions] getCommitteesWithMembersAction error:', error);
        return [];
    }
}

export async function getCommitteeByIdAction(id: number): Promise<any | null> {
    try {
        const committee = await fetchDirectus<any>(
            `/items/committees/${id}?fields=id,name,email,image.id,is_visible,short_description,description,created_at,updated_at`,
            600
        );
        if (!committee) return null;

        const q = buildQuery({
            filter: { committee_id: { _eq: id } },
            fields: '*,user_id.*'
        });
        const members = await fetchDirectus<any[]>(`/items/committee_members?${q}`, 600);
        committee.committee_members = Array.isArray(members) ? members : [];
        return committee;
    } catch (error) {
        console.error(`[data-actions] getCommitteeByIdAction(${id}) error:`, error);
        return null;
    }
}

export async function updateCommitteeAction(id: number | string, data: any): Promise<any> {
    try {
        const result = await mutateDirectus(`/items/committees/${id}`, 'PATCH', data);
        return { success: true, committee: result };
    } catch (error: any) {
        console.error(`[data-actions] updateCommitteeAction(${id}) error:`, error);
        return { success: false, error: error.message || 'Kon commissie niet bijwerken' };
    }
}

/**
 * Upload a file to Directus via absolute path (on server) or Buffer.
 * For now, this is a placeholder as the client still uses fetch('/files') below.
 * But we want a server action for consistency if possible.
 */
export async function uploadFileAction(formData: FormData): Promise<any> {
    try {
        const result = await mutateDirectus('/files', 'POST', formData);
        // @ts-expect-error - Next.js 15+ may expect a second profile argument, but 1 arg is valid at runtime
        revalidateTag('assets'); // Make sure the new asset becomes immediately visible
        return { success: true, file: result };
    } catch (error: any) {
        console.error('[data-actions] uploadFileAction error:', error);
        return { success: false, error: error.message || 'Upload mislukt' };
    }
}

// =====================
// MEMBERS
// =====================
export async function getMembersAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,first_name,last_name,email,picture,is_current_student',
            sort: 'last_name,first_name'
        });
        const res = await fetchDirectus<any[]>(`/items/members?${query}`, 600);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getMembersAction error:', error);
        return [];
    }
}

export async function getMemberByIdAction(id: number): Promise<any | null> {
    try {
        return await fetchDirectus<any>(
            `/items/members/${id}?fields=id,first_name,last_name,email,picture,phone_number,date_of_birth,is_current_student`,
            600
        );
    } catch (error) {
        console.error(`[data-actions] getMemberByIdAction(${id}) error:`, error);
        return null;
    }
}

// =====================
// CLUBS
// =====================
export async function getClubsAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,name,description,image,whatsapp_link,discord_link,website_link',
            sort: 'name'
        });
        const res = await fetchDirectus<any[]>(`/items/clubs?${query}`, 600);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getClubsAction error:', error);
        return [];
    }
}

export async function getClubByIdAction(id: number): Promise<any | null> {
    try {
        return await fetchDirectus<any>(
            `/items/clubs/${id}?fields=id,name,description,image,whatsapp_link,discord_link,website_link,created_at`,
            600
        );
    } catch (error) {
        console.error(`[data-actions] getClubByIdAction(${id}) error:`, error);
        return null;
    }
}

// =====================
// SPONSORS
// =====================
export async function getSponsorsAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'sponsor_id,image,website_url',
            sort: 'sponsor_id'
        });
        const res = await fetchDirectus<any[]>(`/items/sponsors?${query}`, 3600);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getSponsorsAction error:', error);
        return [];
    }
}

// =====================
// JOBS
// =====================
export async function getJobsAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'job_id,name,description,pay,location,skills,profile_description,created_at',
            sort: '-created_at'
        });
        const res = await fetchDirectus<any[]>(`/items/jobs?${query}`, 600);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getJobsAction error:', error);
        return [];
    }
}

export async function getJobByIdAction(id: number): Promise<any | null> {
    try {
        return await fetchDirectus<any>(
            `/items/jobs/${id}?fields=job_id,name,description,pay,location,skills,profile_description,created_at`,
            600
        );
    } catch (error) {
        console.error(`[data-actions] getJobByIdAction(${id}) error:`, error);
        return null;
    }
}

// =====================
// PUB CRAWL EVENTS
// =====================
export async function getPubCrawlEventsAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,name,email,date,description,image,created_at',
            sort: '-date'
        });
        const res = await fetchDirectus<any[]>(`/items/pub_crawl_events?${query}`, 120);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getPubCrawlEventsAction error:', error);
        return [];
    }
}

export async function getPubCrawlEventByIdAction(id: number | string): Promise<any | null> {
    try {
        return await fetchDirectus<any>(`/items/pub_crawl_events/${id}?fields=*`, 120);
    } catch (error) {
        console.error(`[data-actions] getPubCrawlEventByIdAction(${id}) error:`, error);
        return null;
    }
}

export async function createPubCrawlEventAction(data: any): Promise<any> {
    return mutateDirectus<any>('/items/pub_crawl_events', 'POST', data);
}

export async function updatePubCrawlEventAction(id: number | string, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/pub_crawl_events/${id}`, 'PATCH', data);
}

export async function deletePubCrawlEventAction(id: number | string): Promise<void> {
    await mutateDirectus<any>(`/items/pub_crawl_events/${id}`, 'DELETE');
}

// =====================
// PUB CRAWL SIGNUPS
// =====================
export async function getPubCrawlSignupsAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,pub_crawl_event_id,name,email,association,amount_tickets,payment_status,created_at,updated_at',
            sort: '-created_at'
        });
        const res = await fetchDirectus<any[]>(`/items/pub_crawl_signups?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getPubCrawlSignupsAction error:', error);
        return [];
    }
}

export async function getPubCrawlSignupsByEventIdAction(eventId: number): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { pub_crawl_event_id: { _eq: eventId } },
            fields: 'id,name,email,association,amount_tickets,payment_status,created_at',
            sort: '-created_at'
        });
        const res = await fetchDirectus<any[]>(`/items/pub_crawl_signups?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error(`[data-actions] getPubCrawlSignupsByEventIdAction(${eventId}) error:`, error);
        return [];
    }
}

export async function getPubCrawlSignupByIdAction(id: number | string): Promise<any | null> {
    try {
        return await fetchDirectus<any>(`/items/pub_crawl_signups/${id}?fields=*`, 0);
    } catch (error) {
        console.error(`[data-actions] getPubCrawlSignupByIdAction(${id}) error:`, error);
        return null;
    }
}

export async function createPubCrawlSignupAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/pub_crawl_signups`, 'POST', data);
}

export async function updatePubCrawlSignupAction(id: number | string, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/pub_crawl_signups/${id}`, 'PATCH', data);
}

export async function deletePubCrawlSignupAction(id: number | string): Promise<void> {
    await mutateDirectus<any>(`/items/pub_crawl_signups/${id}`, 'DELETE');
}

// =====================
// PUB CRAWL TICKETS
// =====================
export async function getPubCrawlTicketsAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: '*,signup_id.*',
            limit: '-1'
        });
        const res = await fetchDirectus<any[]>(`/items/pub_crawl_tickets?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getPubCrawlTicketsAction error:', error);
        return [];
    }
}

export async function getPubCrawlTicketsBySignupIdAction(signupId: number | string): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { signup_id: { _eq: signupId } },
            fields: '*'
        });
        const res = await fetchDirectus<any[]>(`/items/pub_crawl_tickets?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error(`[data-actions] getPubCrawlTicketsBySignupIdAction(${signupId}) error:`, error);
        return [];
    }
}

export async function getPubCrawlTicketsByEventIdAction(eventId: number | string): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { signup_id: { pub_crawl_event_id: { _eq: eventId } } },
            fields: 'id,name,initial,signup_id'
        });
        const res = await fetchDirectus<any[]>(`/items/pub_crawl_tickets?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error(`[data-actions] getPubCrawlTicketsByEventIdAction(${eventId}) error:`, error);
        return [];
    }
}

// =====================
// STICKERS
// =====================
export async function getStickersAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: '*,user_created.*,created_by.*',
            sort: '-date_created',
            limit: '-1'
        });
        const res = await fetchDirectus<any[]>(`/items/Stickers?${query}`, 120);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getStickersAction error:', error);
        return [];
    }
}

export async function createStickerAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/Stickers`, 'POST', data);
}

export async function deleteStickerAction(id: number): Promise<void> {
    await mutateDirectus<any>(`/items/Stickers/${id}`, 'DELETE');
}

// =====================
// WHATSAPP GROUPS
// =====================
export async function getWhatsappGroupsAction(memberOnly: boolean = false): Promise<any[]> {
    try {
        const filter = memberOnly
            ? { is_active: { _eq: true }, requires_membership: { _eq: true } }
            : { is_active: { _eq: true } };
        const query = buildQuery({
            filter,
            sort: 'name'
        });
        const res = await fetchDirectus<any[]>(`/items/whatsapp_groups?${query}`, 600);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getWhatsappGroupsAction error:', error);
        return [];
    }
}

// =====================
// DOCUMENTS
// =====================
export async function getDocumentsAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,title,description,file,category,display_order',
            filter: { is_active: { _eq: true } },
            sort: 'display_order,title'
        });
        const res = await fetchDirectus<any[]>(`/items/documents?${query}`, 3600);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getDocumentsAction error:', error);
        return [];
    }
}

// =====================
// HERO BANNERS
// =====================
export async function getHeroBannersAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,image,title,sort',
            sort: 'sort,-date_created'
        });
        const res = await fetchDirectus<any[]>(`/items/hero_banners?${query}`, 3600);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getHeroBannersAction error:', error);
        return [];
    }
}

// =====================
// SITE SETTINGS
// =====================
export async function getSiteSettingsAction(page?: string, includeAuthorizedTokens: boolean = false): Promise<any[] | any | null> {
    try {
        const fields = includeAuthorizedTokens
            ? 'id,page,show,disabled_message,authorized_tokens'
            : 'id,page,show,disabled_message';

        const params: Record<string, any> = { fields };
        if (page) {
            params.filter = { page: { _eq: page } };
            params.limit = '1';
        } else {
            params.limit = '-1';
        }

        const query = buildQuery(params);
        const data = await fetchDirectus<any[] | any>(`/items/site_settings?${query}`, 3600);

        if (page) {
            if (Array.isArray(data)) return data[0] || null;
            return data ?? null;
        }

        return Array.isArray(data) ? data : [];
    } catch {
        return page ? null : [];
    }
}

// =====================
// SITE SETTINGS MUTATIONS
// =====================
export async function createSiteSettingsAction(data: { page: string; show?: boolean; disabled_message?: string; authorized_tokens?: string }): Promise<any> {
    return mutateDirectus<any>(`/items/site_settings`, 'POST', data);
}

export async function updateSiteSettingsAction(id: number, data: { show?: boolean; disabled_message?: string; authorized_tokens?: string }): Promise<any> {
    return mutateDirectus<any>(`/items/site_settings/${id}`, 'PATCH', data);
}

export async function upsertSiteSettingsByPageAction(page: string, data: { show?: boolean; disabled_message?: string; authorized_tokens?: string }): Promise<any> {
    const existing = await getSiteSettingsAction(page);
    if (existing && existing.id) {
        return updateSiteSettingsAction(existing.id, data);
    }
    return createSiteSettingsAction({ page, ...data });
}

// =====================
// USERS (search)
// =====================
export async function searchUsersAction(searchQuery: string): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,first_name,last_name,email',
            search: searchQuery,
            limit: '10'
        });
        const res = await fetchDirectus<any[]>(`/users?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] searchUsersAction error:', error);
        return [];
    }
}

// =====================
// TRANSACTIONS
// =====================
export async function getTransactionsAction(userId: string): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { user_id: { _eq: userId } },
            sort: '-created_at'
        });
        const res = await fetchDirectus<any[]>(`/items/transactions?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getTransactionsAction error:', error);
        return [];
    }
}

export async function getTransactionByIdAction(id: number | string): Promise<any | null> {
    try {
        return await fetchDirectus<any>(`/items/transactions/${id}?fields=*`, 0);
    } catch (error) {
        console.error(`[data-actions] getTransactionByIdAction(${id}) error:`, error);
        return null;
    }
}

// =====================
// SAFE HAVEN (user-specific)
// =====================
export async function getSafeHavenByUserIdAction(userId: string): Promise<any | null> {
    try {
        const query = buildQuery({
            fields: 'id,user_id.id,user_id.first_name,user_id.last_name,contact_name,phone_number,email,image,created_at',
            filter: { user_id: { _eq: userId } }
        });
        const results = await fetchDirectus<any[]>(`/items/safe_havens?${query}`, 120);
        return (Array.isArray(results) && results.length > 0) ? results[0] : null;
    } catch (error) {
        console.error(`[data-actions] getSafeHavenByUserIdAction error:`, error);
        return null;
    }
}

// =====================
// INTRO SIGNUPS
// =====================
export async function getIntroSignupsAction(): Promise<any[]> {
    try {
        const res = await fetchDirectus<any[]>(`/items/intro_signups?fields=*&sort=-created_at`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getIntroSignupsAction error:', error);
        return [];
    }
}

export async function createIntroSignupAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/intro_signups`, 'POST', data);
}

export async function updateIntroSignupAction(id: number, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/intro_signups/${id}`, 'PATCH', data);
}

export async function deleteIntroSignupAction(id: number): Promise<void> {
    await mutateDirectus<any>(`/items/intro_signups/${id}`, 'DELETE');
}

// =====================
// INTRO BLOGS
// =====================
function normalizeLikes(row: any): any {
    const raw = row?.likes;
    let likes = 0;
    if (raw !== undefined && raw !== null) {
        likes = typeof raw === 'number' ? raw : parseInt(String(raw), 10) || 0;
    }
    return { ...row, likes };
}

export async function getIntroBlogsAction(): Promise<any[]> {
    try {
        const res = await fetchDirectus<any[]>(
            `/items/intro_blogs?fields=id,title,slug,content,excerpt,image.id,likes,updated_at,is_published,blog_type,created_at&filter[is_published][_eq]=true&sort=-updated_at`,
            120
        );
        return (Array.isArray(res) ? res : []).map(normalizeLikes);
    } catch (error) {
        console.error('[data-actions] getIntroBlogsAction error:', error);
        return [];
    }
}

export async function getIntroBlogsAdminAction(): Promise<any[]> {
    try {
        const res = await fetchDirectus<any[]>(
            `/items/intro_blogs?fields=id,title,slug,content,excerpt,image.id,likes,updated_at,is_published,blog_type,created_at&sort=-updated_at`,
            0
        );
        return (Array.isArray(res) ? res : []).map(normalizeLikes);
    } catch (error) {
        console.error('[data-actions] getIntroBlogsAdminAction error:', error);
        return [];
    }
}

export async function getIntroBlogByIdAction(id: number): Promise<any | null> {
    try {
        const row = await fetchDirectus<any>(
            `/items/intro_blogs/${id}?fields=id,title,slug,content,excerpt,image.id,likes,updated_at,is_published,blog_type,created_at`,
            120
        );
        return row ? normalizeLikes(row) : null;
    } catch (error) {
        console.error(`[data-actions] getIntroBlogByIdAction(${id}) error:`, error);
        return null;
    }
}

export async function getIntroBlogsByTypeAction(type: string): Promise<any[]> {
    try {
        const res = await fetchDirectus<any[]>(
            `/items/intro_blogs?fields=id,title,slug,content,excerpt,image.id,likes,updated_at,is_published,blog_type,created_at&filter[is_published][_eq]=true&filter[blog_type][_eq]=${type}&sort=-updated_at`,
            120
        );
        return (Array.isArray(res) ? res : []).map(normalizeLikes);
    } catch (error) {
        console.error('[data-actions] getIntroBlogsByTypeAction error:', error);
        return [];
    }
}

export async function createIntroBlogAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/intro_blogs`, 'POST', data);
}

export async function updateIntroBlogAction(id: number, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/intro_blogs/${id}`, 'PATCH', data);
}

export async function deleteIntroBlogAction(id: number): Promise<void> {
    await mutateDirectus<any>(`/items/intro_blogs/${id}`, 'DELETE');
}

// =====================
// INTRO PLANNING
// =====================
export async function getIntroPlanningAction(): Promise<any[]> {
    try {
        const res = await fetchDirectus<any[]>(
            `/items/intro_planning?fields=id,day,date,time_start,time_end,title,description,location,is_mandatory,icon,sort_order&filter[status][_eq]=published&sort=sort_order`,
            120
        );
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getIntroPlanningAction error:', error);
        return [];
    }
}

export async function getIntroPlanningAdminAction(): Promise<any[]> {
    try {
        const res = await fetchDirectus<any[]>(
            `/items/intro_planning?fields=id,day,date,time_start,time_end,title,description,location,is_mandatory,icon,sort_order,status&sort=sort_order`,
            0
        );
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getIntroPlanningAdminAction error:', error);
        return [];
    }
}

export async function createIntroPlanningAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/intro_planning`, 'POST', data);
}

export async function updateIntroPlanningAction(id: number, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/intro_planning/${id}`, 'PATCH', data);
}

export async function deleteIntroPlanningAction(id: number): Promise<void> {
    await mutateDirectus<any>(`/items/intro_planning/${id}`, 'DELETE');
}

// =====================
// INTRO PARENT SIGNUPS
// =====================
export async function getIntroParentSignupsAction(): Promise<any[]> {
    try {
        const res = await fetchDirectus<any[]>(`/items/intro_parent_signups?fields=*&sort=-created_at`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getIntroParentSignupsAction error:', error);
        return [];
    }
}

export async function getIntroParentSignupsByUserIdAction(userId: string): Promise<any[]> {
    try {
        const res = await fetchDirectus<any[]>(
            `/items/intro_parent_signups?fields=*&filter[user_id][_eq]=${encodeURIComponent(userId)}`,
            0
        );
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getIntroParentSignupsByUserIdAction error:', error);
        return [];
    }
}

export async function createIntroParentSignupAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/intro_parent_signups`, 'POST', data);
}

export async function updateIntroParentSignupAction(id: number, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/intro_parent_signups/${id}`, 'PATCH', data);
}

export async function deleteIntroParentSignupAction(id: number): Promise<void> {
    await mutateDirectus<any>(`/items/intro_parent_signups/${id}`, 'DELETE');
}

// =====================
// TRIPS
// =====================
export async function getTripsAction(): Promise<any[]> {
    try {
        const query = buildQuery({
            fields: 'id,name,description,image,event_date,start_date,end_date,registration_start_date,registration_open,max_participants,max_crew,base_price,crew_discount,deposit_amount,is_bus_trip,allow_final_payments,created_at,updated_at',
            sort: '-event_date'
        });
        const res = await fetchDirectus<any[]>(`/items/trips?${query}`, 120);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getTripsAction error:', error);
        return [];
    }
}


export async function getUserCommitteesAction(userId: string): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { user_id: { _eq: userId } },
            fields: 'committee_id.id,committee_id.name,committee_id.is_visible,committee_id.commissie_token,is_leader',
            limit: '-1'
        });
        const res = await fetchDirectus<any[]>(`/items/committee_members?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error(`[data-actions] getUserCommitteesAction(${userId}) error:`, error);
        return [];
    }
}

/**
 * Delete a committee member.
 */
export async function deleteCommitteeMemberAction(id: number | string) {
    try {
        await mutateDirectus(`/items/committee_members/${id}`, 'DELETE');
        return { success: true };
    } catch (error: any) {
        console.error(`[DataAction] deleteCommitteeMemberAction(${id}) error:`, error);
        return { success: false, error: error.message || 'Kon lid niet verwijderen' };
    }
}

/**
 * Update a committee member (e.g. toggle leader status).
 */
export async function updateCommitteeMemberAction(id: number | string, payload: any) {
    try {
        const result = await mutateDirectus(`/items/committee_members/${id}`, 'PATCH', payload);
        return { success: true, member: result };
    } catch (error: any) {
        console.error(`[DataAction] updateCommitteeMemberAction(${id}) error:`, error);
        return { success: false, error: error.message || 'Kon lid niet bijwerken' };
    }
}

export async function getTripByIdAction(id: number): Promise<any | null> {
    try {
        return await fetchDirectus<any>(`/items/trips/${id}?fields=*`, 120);
    } catch (error) {
        console.error(`[data-actions] getTripByIdAction(${id}) error:`, error);
        return null;
    }
}

export async function createTripAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/trips`, 'POST', data);
}

export async function updateTripAction(id: number, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/trips/${id}`, 'PATCH', data);
}

export async function deleteTripAction(id: number): Promise<void> {
    await mutateDirectus<any>(`/items/trips/${id}`, 'DELETE');
}

// =====================
// TRIP ACTIVITIES
// =====================
export async function getTripActivitiesByTripIdAction(tripId: number): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { trip_id: { _eq: tripId }, is_active: { _eq: true } },
            sort: 'display_order,name',
            fields: '*,options,max_selections'
        });
        const res = await fetchDirectus<any[]>(`/items/trip_activities?${query}`, 120);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getTripActivitiesByTripIdAction error:', error);
        return [];
    }
}

export async function getAllTripActivitiesByTripIdAction(tripId: number): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { trip_id: { _eq: tripId } },
            sort: 'display_order,name',
            fields: '*,options,max_selections'
        });
        const res = await fetchDirectus<any[]>(`/items/trip_activities?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getAllTripActivitiesByTripIdAction error:', error);
        return [];
    }
}

export async function createTripActivityAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/trip_activities`, 'POST', data);
}

export async function updateTripActivityAction(id: number, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/trip_activities/${id}`, 'PATCH', data);
}

export async function deleteTripActivityAction(id: number): Promise<void> {
    await mutateDirectus<any>(`/items/trip_activities/${id}`, 'DELETE');
}

// =====================
// TRIP SIGNUPS
// =====================
// [SECURITY] Deprecated for public use. Only used for admin checks or strictly protected contexts.
// Do NOT use this for client-side lists where users can see others.
export async function getTripSignupsByTripIdAction(tripId: number): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { trip_id: { _eq: tripId } },
            sort: '-created_at',
            fields: 'id,status,created_at,is_crew' // Reduced fields for safety if acccidentally usage
        });
        const res = await fetchDirectus<any[]>(`/items/trip_signups?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getTripSignupsByTripIdAction error:', error);
        return [];
    }
}

export async function getTripParticipantsCountAction(tripId: number): Promise<number> {
    try {
        const query = buildQuery({
            filter: {
                trip_id: { _eq: tripId },
                status: { _in: ['registered', 'confirmed', 'waitlist'] }
            },
            fields: 'id',
            limit: -1
        });
        const res = await fetchDirectus<any[]>(`/items/trip_signups?${query}`, 0);
        return Array.isArray(res) ? res.length : 0;
    } catch (error) {
        console.error('[data-actions] getTripParticipantsCountAction error:', error);
        return 0;
    }
}

export async function getMyTripSignupAction(tripId: number): Promise<any | null> {
    const user = await getCurrentUserAction();
    if (!user) return null;

    try {
        const query = buildQuery({
            filter: {
                trip_id: { _eq: tripId },
                status: { _neq: 'cancelled' },
                _or: [
                    { email: { _eq: user.email } }
                ]
            },
            fields: '*'
        });

        console.log(`[getMyTripSignupAction] Checking signup for Trip: ${tripId}, User: ${user.id} (${user.email})`);

        const res = await fetchDirectus<any[]>(`/items/trip_signups?${query}`, 0);

        console.log(`[getMyTripSignupAction] Found ${Array.isArray(res) ? res.length : 0} signups.`);

        return (Array.isArray(res) && res.length > 0) ? res[0] : null;
    } catch (error) {
        console.error('[data-actions] getMyTripSignupAction error:', error);
        return null;
    }
}

export async function getTripSignupByIdAction(id: number): Promise<any | null> {
    try {
        return await fetchDirectus<any>(`/items/trip_signups/${id}?fields=*`, 0);
    } catch (error) {
        console.error(`[data-actions] getTripSignupByIdAction(${id}) error:`, error);
        return null;
    }
}

export async function createTripSignupAction(data: any): Promise<any> {
    return mutateDirectus<any>(`/items/trip_signups`, 'POST', data);
}

export async function updateTripSignupAction(id: number, data: any): Promise<any> {
    return mutateDirectus<any>(`/items/trip_signups/${id}`, 'PATCH', data);
}

// =====================
// TRIP SIGNUP ACTIVITIES
// =====================
export async function createTripSignupActivityAction(data: { trip_signup_id: number; trip_activity_id: number; selected_options?: any }): Promise<any> {
    return mutateDirectus<any>(`/items/trip_signup_activities`, 'POST', data);
}

export async function deleteTripSignupActivityAction(id: number): Promise<void> {
    await mutateDirectus<any>(`/items/trip_signup_activities/${id}`, 'DELETE');
}

export async function getTripSignupActivitiesBySignupIdAction(signupId: number): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { trip_signup_id: { _eq: signupId } },
            fields: 'id,selected_options,trip_activity_id.*'
        });
        const res = await fetchDirectus<any[]>(`/items/trip_signup_activities?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getTripSignupActivitiesBySignupIdAction error:', error);
        return [];
    }
}

export async function getTripSignupActivitiesByActivityIdAction(activityId: number): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { trip_activity_id: { _eq: activityId } },
            fields: 'id,selected_options,trip_signup_id.*'
        });
        const res = await fetchDirectus<any[]>(`/items/trip_signup_activities?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error('[data-actions] getTripSignupActivitiesByActivityIdAction error:', error);
        return [];
    }
}

// =====================
// EVENT SIGNUPS (complex)
// =====================
export async function createEventSignupAction(signupData: {
    event_id: number;
    email: string;
    name: string;
    phone_number?: string;
    user_id?: string;
    event_name?: string;
    event_date?: string;
    event_price?: number;
    payment_status?: string;
    directus_relations?: string; // Support for user relation
    submission_file_url?: string;
}): Promise<any> {
    // Check for existing signup first
    if (signupData.event_id && (signupData.user_id || signupData.directus_relations)) {
        const userId = signupData.user_id || signupData.directus_relations;
        const query = buildQuery({
            filter: {
                event_id: { _eq: signupData.event_id },
                directus_relations: { _eq: userId }
            },
            fields: 'id'
        });
        const existing = await fetchDirectus<any[]>(`/items/event_signups?${query}`, 0);
        if (existing && existing.length > 0) {
            throw new Error('Je bent al ingeschreven voor deze activiteit');
        }
    }

    return mutateDirectus<any>(`/items/event_signups`, 'POST', signupData);
}

/**
 * Get all signups for a specific user.
 * Usually called from the user's dashboard.
 */
export async function getUserEventSignupsAction(userId: string): Promise<any[]> {
    try {
        const query = buildQuery({
            filter: { directus_relations: { _eq: userId } },
            fields: 'id,event_id.id,event_id.name,event_id.event_date,event_id.image,event_id.description,event_id.contact,event_id.committee_id,created_at',
            sort: '-created_at'
        });
        const res = await fetchDirectus<any[]>(`/items/event_signups?${query}`, 0);
        return Array.isArray(res) ? res : [];
    } catch (error) {
        console.error(`[data-actions] getUserEventSignupsAction(${userId}) error:`, error);
        return [];
    }
}

/**
 * Admin action to search for users.
 */
export async function registerUserAction(userData: any): Promise<any> {
    // Inject default role if not provided
    const roleId = process.env.NEXT_PUBLIC_DEFAULT_USER_ROLE_ID;
    const finalData = {
        ...userData,
        role: userData.role || roleId || null,
        status: 'active',
    };

    return mutateDirectus<any>(`/users`, 'POST', finalData);
}

// =====================
// Helper
// =====================
function cleanName(name?: string | null): string | undefined {
    if (!name) return undefined;
    return name
        .replace(/\s*\(intern\)\s*/gi, '')
        .replace(/\s*\[intern\]\s*/gi, '')
        .replace(/\s*-\s*intern\s*/gi, '')
        .trim() || undefined;
}
