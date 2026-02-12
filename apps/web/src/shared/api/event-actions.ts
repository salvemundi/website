'use server';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';


// We import these dynamically inside the action to avoid build issues if they use Node-only modules
// but since this file is 'use server', it should be fine.

export interface EventSignupData {
    event_id: number;
    email: string;
    name: string;
    phone_number?: string;
    user_id?: string;
    event_name?: string;
    event_date?: string;
    event_price?: number;
    payment_status?: string;
}

// Replicate cleanCommitteeName from salvemundi.ts to avoid dependency
function cleanCommitteeName(name?: string | null): string | undefined {
    if (!name) return undefined;
    let s = String(name);
    s = s.replace(/\|\|.*salvemundi.*$/i, '');
    s = s.replace(/\|+$/g, '');
    return s.trim();
}

/**
 * Fetch all upcoming events (Server Action)
 * Replaces the client-side useSalvemundiEvents / eventsApi.getAll
 */
export async function getEventsAction() {
    try {
        const now = new Date().toISOString();
        const baseFields = [
            'id', 'name', 'event_date', 'event_time', 'inschrijf_deadline',
            'description', 'description_logged_in', 'price_members',
            'price_non_members', 'max_sign_ups', 'only_members', 'image',
            'committee_id', 'contact', 'status', 'publish_date',
            'location'
        ];

        const query = new URLSearchParams({
            fields: baseFields.join(','),
            sort: '-event_date',
            filter: JSON.stringify({
                _or: [
                    { status: { _eq: 'published' }, publish_date: { _null: true } },
                    { status: { _eq: 'published' }, publish_date: { _lte: now } }
                ]
            })
        }).toString();

        const events = await serverDirectusFetch<any[]>(`/items/events?${query}`, {
            tags: [COLLECTION_TAGS.EVENTS],
            ...CACHE_PRESETS.FREQUENT
        });

        if (!events || !Array.isArray(events)) {
            return [];
        }

        // Enrich events with committee details and contact info
        // We do this in parallel for performance
        const enrichedEvents = await Promise.all(events.map(async (event) => {
            // Clone to avoid mutation issues if any
            const e = { ...event };

            // 1. Fetch Committee Details if needed
            if (e.committee_id) {
                try {
                    // Try to fetch specific committee fields
                    // We use a small cache for committees as they don't change often
                    const committee = await serverDirectusFetch<any>(
                        `/items/committees/${e.committee_id}?fields=id,name,email`,
                        { ...CACHE_PRESETS.MODERATE, tags: [`committee_${e.committee_id}`] }
                    );

                    if (committee) {
                        e.committee_name = cleanCommitteeName(committee.name);
                        e.committee_email = committee.email || undefined;
                    }

                    // 2. Fetch Contact/Leaders if contact is missing
                    if (!e.contact) {
                        const leaderQuery = new URLSearchParams({
                            filter: JSON.stringify({ committee_id: { _eq: e.committee_id }, is_leader: { _eq: true } }),
                            fields: 'user_id.first_name,user_id.last_name',
                            limit: '1'
                        }).toString();

                        const leaders = await serverDirectusFetch<any[]>(
                            `/items/committee_members?${leaderQuery}`,
                            { ...CACHE_PRESETS.MODERATE }
                        );

                        if (leaders && leaders.length > 0) {
                            e.contact_name = `${leaders[0].user_id.first_name || ''} ${leaders[0].user_id.last_name || ''}`.trim();
                        }
                    }

                } catch (err) {
                    console.error(`[getEventsAction] Failed to enrich event ${e.id}`, err);
                }
            }

            // 3. Normalized contact fields
            if (e.contact) {
                if (typeof e.contact === 'string' && e.contact.includes('@')) {
                    e.contact_email = e.contact;
                } else {
                    e.contact_phone = e.contact;
                }
            }

            return e;
        }));

        return enrichedEvents;
    } catch (error) {
        console.error('[getEventsAction] Error fetching events:', error);
        return [];
    }
}

export async function getEventAction(id: string) {
    if (!id) return null;

    try {
        const query = new URLSearchParams({
            fields: 'id,name,event_date,event_time,inschrijf_deadline,description,description_logged_in,price_members,price_non_members,max_sign_ups,only_members,image,committee_id,contact,location,status',
        }).toString();

        const event = await serverDirectusFetch<any>(`/items/events/${id}?${query}`, {
            tags: [`event_${id}`, COLLECTION_TAGS.EVENTS],
            ...CACHE_PRESETS.FREQUENT
        });

        if (!event) return null;

        // Enrich with committee details (mimicking eventsApi.getById)
        if (event.committee_id) {
            try {
                const committee = await serverDirectusFetch<any>(`/items/committees/${event.committee_id}?fields=id,name,email`, {
                    ...CACHE_PRESETS.MODERATE
                });
                if (committee) {
                    event.committee_name = cleanCommitteeName(committee.name);
                    event.committee_email = committee.email || undefined;
                }
            } catch (e) {
                console.error(`[Action] Failed to fetch committee for event ${id}`, e);
            }

            // Fetch leaders/contacts
            if (!event.contact) {
                try {
                    const leaderQuery = new URLSearchParams({
                        filter: JSON.stringify({ committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } }),
                        fields: 'user_id.first_name,user_id.last_name',
                        limit: '1'
                    }).toString();
                    const leaders = await serverDirectusFetch<any[]>(`/items/committee_members?${leaderQuery}`, {
                        ...CACHE_PRESETS.MODERATE
                    });

                    if (leaders && leaders.length > 0) {
                        event.contact_name = `${leaders[0].user_id.first_name || ''} ${leaders[0].user_id.last_name || ''}`.trim();
                    }
                } catch (e) {
                    console.error(`[Action] Failed to fetch leaders for event ${id}`, e);
                }
            }
        }

        // Contact fallback
        if (event.contact) {
            if (typeof event.contact === 'string' && event.contact.includes('@')) {
                event.contact_email = event.contact;
            } else {
                event.contact_phone = event.contact;
            }
        }

        return event;
    } catch (error) {
        console.error(`[Action] Failed to fetch event ${id}:`, error);
        return null;
    }
}

export async function getEventSignupStatusAction(eventId: number, userId?: string, email?: string) {
    try {
        let filter: any = { event_id: { _eq: eventId } };

        if (userId) {
            filter.directus_relations = { _eq: userId };
        } else if (email) {
            filter.participant_email = { _eq: email };
        } else {
            return null;
        }

        const query = new URLSearchParams({
            filter: JSON.stringify(filter),
            fields: 'id,payment_status,qr_token'
        }).toString();

        const signups = await serverDirectusFetch<any[]>(`/items/event_signups?${query}`, {
            revalidate: 0 // Always fresh
        });

        return signups && signups.length > 0 ? signups[0] : null;

    } catch (error) {
        console.error('[Action] Failed to check signup status:', error);
        return null; // Assume not signed up if error? Or fail? Better return null safe.
    }
}

export async function createEventSignupAction(data: EventSignupData) {
    try {
        // 1. Check existing
        const existing = await getEventSignupStatusAction(data.event_id, data.user_id, data.email);

        if (existing) {
            if (existing.payment_status === 'paid') {
                return { success: false, error: 'Je bent al ingeschreven (en betaald) voor deze activiteit.' };
            }
            // Recycle existing "open" signup
            return { success: true, signup: existing, isRecycled: true };
        }

        // 2. Create new
        const payload = {
            event_id: data.event_id,
            directus_relations: data.user_id || null,
            participant_name: data.name || null,
            participant_email: data.email || null,
            participant_phone: data.phone_number ?? null,
            payment_status: data.payment_status || 'open'
        };

        const signup = await serverDirectusFetch<any>('/items/event_signups', {
            method: 'POST',
            body: JSON.stringify(payload),
            revalidate: 0
        });

        if (!signup || !signup.id) {
            return { success: false, error: 'Inschrijving aanmaken mislukt.' };
        }

        // 3. Post-processing (Best effort: QR, Email)
        // We can do this asynchronously without awaiting if we want faster response, 
        // but for reliability awaiting is safer.
        try {
            const { default: qrService } = await import('@/shared/lib/qr-service');
            const { sendEventSignupEmail } = await import('@/shared/lib/services/email-service');

            const token = qrService.generateQRToken(signup.id, data.event_id);
            // Updating token via API to ensure persistence
            // Note: qrService.updateSignupWithQRToken probably uses client fetch, so use server directus fetch here manually
            await serverDirectusFetch(`/items/event_signups/${signup.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ qr_token: token }),
                revalidate: 0
            });
            signup.qr_token = token; // Update local obj

            // Check if free or already paid
            if (data.event_price === 0 || data.payment_status === 'paid') {
                await serverDirectusFetch(`/items/event_signups/${signup.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ payment_status: 'paid' }),
                    revalidate: 0
                });
                console.log(`[Action] Marked free signup ${signup.id} as paid`);

                // Generate QR Image for email
                let qrDataUrl;
                try {
                    qrDataUrl = await qrService.generateQRCode(token);
                } catch (e) { console.error('QR gen failed', e); }

                // Use event details from input or fetch again if needed (we passed event_name etc)
                // Just send email
                await sendEventSignupEmail({
                    recipientEmail: data.email,
                    recipientName: data.name,
                    eventName: data.event_name || '',
                    eventDate: data.event_date || '',
                    eventPrice: data.event_price || 0,
                    phoneNumber: data.phone_number,
                    userName: data.user_id || 'Gast',
                    qrCodeDataUrl: qrDataUrl,
                    // We skip committee/contact helpers here to save complexity, 
                    // or we can fetch them if critical.
                    // The client sets event_name/date.
                });
            }

        } catch (postError) {
            console.error('[Action] Post-signup processing failed (QR/Email)', postError);
            // We don't fail the request, as signup is created.
        }

        return { success: true, signup: signup };

    } catch (error: any) {
        console.error('[Action] Create event signup error:', error);
        return { success: false, error: 'Er ging iets mis bij het inschrijven.' };
    }
}
