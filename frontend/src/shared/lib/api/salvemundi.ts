import { directusFetch } from '../directus';
import { COLLECTIONS, FIELDS } from '@/shared/lib/constants/collections';

// --- Types ---
export interface SiteSettings {
    id: number;
    page?: string; // identifier of the page in Directus
    show?: boolean; // whether to show the page
    disabled_message?: string; // message to display when disabled
    authorized_tokens?: string; // comma-separated list of authorized committee tokens
}

export interface CreateStickerData {
    location_name?: string;
    address?: string;
    latitude: number;
    longitude: number;
    description?: string;
    country?: string;
    city?: string;
    image?: string;
}

export interface Sticker {
    id: number;
    location_name?: string;
    address?: string;
    latitude: number;
    longitude: number;
    description?: string;
    country?: string;
    city?: string;
    image?: string;
    date_created: string;
    user_created?: string | { id?: string | number; first_name?: string; last_name?: string; email?: string; avatar?: string };
    created_by?: string | { id?: string | number; first_name?: string; last_name?: string; email?: string; avatar?: string };
}

export interface StickerStats {
    total: number;
    countries: number;
    cities: number;
    mostRecentCity?: string;
    topCountry?: { country: string; count: number };
}

export interface Transaction {
    id: number;
    user_id: string;
    amount: number;
    description?: string;
    product_name?: string;
    transaction_type?: 'payment' | 'membership' | 'event' | 'other';
    registration?: any;
    pub_crawl_signup?: any;
    trip_signup?: any;
    status?: 'pending' | 'completed' | 'failed' | 'paid';
    payment_status?: 'pending' | 'completed' | 'failed' | 'paid' | 'open';
    created_at: string;
    updated_at?: string;
}

export interface WhatsAppGroup {
    id: number;
    name: string;
    description?: string;
    invite_link: string;
    is_active: boolean;
    requires_membership: boolean;
    created_at: string;
}

export interface PaymentRequest {
    amount: number;
    description: string;
    redirectUrl: string;
    userId?: string;
    email?: string;
    registrationId: number | string;
    isContribution?: boolean;
    registrationType?: 'event_signup' | 'pub_crawl_signup' | 'trip_signup';
    firstName?: string;
    lastName?: string;
}

export interface PaymentResponse {
    checkoutUrl: string;
    paymentId: string;
}

// --- Helper Functions ---
function buildQueryString(params: { fields?: string[]; sort?: string[]; filter?: unknown; limit?: number }): string {
    const queryParams = new URLSearchParams();
    if (params.fields) queryParams.append('fields', params.fields.join(','));
    if (params.sort) queryParams.append('sort', params.sort.join(','));
    if (params.filter) queryParams.append('filter', JSON.stringify(params.filter));
    if (params.limit) queryParams.append('limit', String(params.limit));
    return queryParams.toString();
}

// Clean committee names coming from Directus to remove internal suffixes
function cleanCommitteeName(name?: string | null): string | undefined {
    if (!name) return undefined;
    // Remove any trailing '|| ... Salvemundi' or similar suffixes that include 'salvemundi'
    // Also remove stray pipes and excessive whitespace.
    let s = String(name);
    // Remove patterns like '|| Salve Mundi', '||Salvemundi', '|| Salve Mundi - some'
    s = s.replace(/\|\|.*salvemundi.*$/i, '');
    // Remove any remaining trailing pipes
    s = s.replace(/\|+$/g, '');
    return s.trim();
}

// --- API Collecties ---

export const paymentApi = {
    create: async (data: PaymentRequest): Promise<PaymentResponse> => {
        let baseUrl = process.env.NEXT_PUBLIC_PAYMENT_API_URL || '/api/payments';

        // Safety check: if baseUrl looks like an internal docker container and we are in browser, revert to proxy
        if ((baseUrl.includes('payment-api:') || baseUrl.includes('localhost:3002')) && typeof window !== 'undefined') {
            console.warn('[PaymentAPI] Detected internal URL in env var, reverting to /api/payments proxy to avoid connection failure.');
            baseUrl = '/api/payments';
        }

        console.log('[PaymentAPI] Sending request to:', `${baseUrl}/create`);

        try {
            const response = await fetch(`${baseUrl}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Betaling aanmaken mislukt');
            }

            return await response.json();
        } catch (error) {
            console.error('Payment API Error:', error);
            throw error;
        }
    }
};

export const eventsApi = {
    getAll: async () => {
        const now = new Date().toISOString();
        const query = buildQueryString({
            fields: ['id', 'name', 'event_date', 'event_time', 'inschrijf_deadline', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id', 'contact', 'status', 'publish_date'],
            sort: ['-event_date'],
            filter: {
                _or: [
                    { status: { _eq: 'published' }, publish_date: { _null: true } },
                    { status: { _eq: 'published' }, publish_date: { _lte: now } }
                ]
            }
        });
        let events = await directusFetch<any[]>(`/items/events?${query}`);

        if (!Array.isArray(events)) {
            console.warn('[eventsApi.getAll] Expected array response for events, received:', events);
            events = [];
        }

        const eventsWithDetails = await Promise.all(
            events.map(async (event) => {
                if (event.committee_id) {
                    try {
                        const committee = await directusFetch<any>(`/items/committees/${event.committee_id}?fields=id,name,email`);
                        if (committee) {
                            event.committee_name = cleanCommitteeName(committee.name);
                            event.committee_email = committee.email || undefined;
                        }
                    } catch (error) {
                        console.error('eventsApi.getAll: failed to fetch committee for event', { eventId: event.id, committeeId: event.committee_id, error });
                    }
                }

                if (!event.contact && event.committee_id) {
                    try {
                        const leaderQuery = buildQueryString({
                            filter: { committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } },
                            fields: ['user_id.first_name', 'user_id.last_name'],
                            limit: 1
                        });
                        const leaders = await directusFetch<any[]>(`/items/committee_members?${leaderQuery}`);
                        if (leaders && leaders.length > 0) {
                            event.contact_name = `${leaders[0].user_id.first_name || ''} ${leaders[0].user_id.last_name || ''}`.trim();
                        }
                    } catch (error) {
                        console.error('eventsApi.getAll: failed to fetch leaders for event', { eventId: event.id, committeeId: event.committee_id, error });
                    }
                } else if (event.contact) {
                    // Directus 'contact' field may contain either a phone number or an email address.
                    if (typeof event.contact === 'string' && event.contact.includes('@')) {
                        event.contact_email = event.contact;
                    } else {
                        event.contact_phone = event.contact;
                    }
                }
                return event;
            })
        );

        return eventsWithDetails;
    },

    getById: async (id: string) => {
        const query = buildQueryString({
            fields: ['id', 'name', 'event_date', 'event_time', 'inschrijf_deadline', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id', 'contact']
        });
        const event = await directusFetch<any>(`/items/events/${id}?${query}`);

        if (event.committee_id) {
            try {
                const committee = await directusFetch<any>(`/items/committees/${event.committee_id}?fields=id,name,email`);
                if (committee) {
                    event.committee_name = cleanCommitteeName(committee.name);
                    event.committee_email = committee.email || undefined;
                }
            } catch (error) {
                console.error('eventsApi.getById: failed to fetch committee for event', { eventId: id, committeeId: event.committee_id, error });
            }
        }

        if (!event.contact && event.committee_id) {
            try {
                const leaderQuery = buildQueryString({
                    filter: { committee_id: { _eq: event.committee_id }, is_leader: { _eq: true } },
                    fields: ['user_id.first_name', 'user_id.last_name'],
                    limit: 1
                });
                const leaders = await directusFetch<any[]>(`/items/committee_members?${leaderQuery}`);
                if (leaders && leaders.length > 0) {
                    event.contact_name = `${leaders[0].user_id.first_name || ''} ${leaders[0].user_id.last_name || ''}`.trim();
                }
            } catch (error) {
                console.error('eventsApi.getById: failed to fetch leaders for event', { eventId: id, committeeId: event.committee_id, error });
            }
        } else if (event.contact) {
            if (typeof event.contact === 'string' && event.contact.includes('@')) {
                event.contact_email = event.contact;
            } else {
                event.contact_phone = event.contact;
            }
        }

        return event;
    },

    getByCommittee: async (committeeId: number) => {
        const query = buildQueryString({
            filter: { committee_id: { _eq: committeeId } },
            fields: ['id', 'name', 'event_date', 'event_time', 'event_time_end', 'location', 'description', 'price_members', 'price_non_members', 'image'],
            sort: ['-event_date']
        });
        const res = await directusFetch<any[]>(`/items/events?${query}`);
        if (!Array.isArray(res)) {
            console.warn('[eventsApi.getByCommittee] Expected array response for events by committee, received:', res);
            return [];
        }
        return res;
    },

    createSignup: async (signupData: { event_id: number; email: string; name: string; phone_number?: string; user_id?: string; event_name?: string; event_date?: string; event_price?: number }) => {
        // 1. Check bestaande inschrijving (Alleen voor ingelogde leden)
        if (signupData.user_id) {
            const existingQuery = buildQueryString({
                filter: {
                    event_id: { _eq: signupData.event_id },
                    directus_relations: { _eq: signupData.user_id }
                },
                fields: ['id', 'payment_status', 'qr_token'] // We halen de status op
            });

            const existingSignups = await directusFetch<any[]>(`/items/event_signups?${existingQuery}`);

            if (existingSignups && existingSignups.length > 0) {
                const existing = existingSignups[0];

                // Check de betalingsstatus
                if (existing.payment_status === 'paid') {
                    // Echt al ingeschreven en betaald -> Blokkeren
                    throw new Error('Je bent al ingeschreven (en betaald) voor deze activiteit');
                }

                // Als status 'open' (of null) is, recyclen we de inschrijving
                // Dit zorgt ervoor dat de gebruiker opnieuw kan proberen te betalen
                return existing;
            }
        } else if (signupData.email) {
            // Check bestaande inschrijving op basis van email (voor gasten)
            const existingQuery = buildQueryString({
                filter: {
                    event_id: { _eq: signupData.event_id },
                    participant_email: { _eq: signupData.email }
                },
                fields: ['id', 'payment_status', 'qr_token']
            });

            const existingSignups = await directusFetch<any[]>(`/items/event_signups?${existingQuery}`);

            if (existingSignups && existingSignups.length > 0) {
                const existing = existingSignups[0];

                if (existing.payment_status === 'paid') {
                    throw new Error('Er is al een inschrijving met dit emailadres voor deze activiteit.');
                }
                return existing;
            }
        }

        // 2. Nieuwe inschrijving maken
        const payload: any = {
            event_id: signupData.event_id,
            directus_relations: signupData.user_id || null,
            participant_name: signupData.name || null,
            participant_email: signupData.email || null,
            participant_phone: signupData.phone_number ?? null,
            payment_status: 'open' // Zet expliciet op open
        };

        const signup = await directusFetch<any>(`/items/event_signups`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // Try to generate a QR token, image and send confirmation email. Failures here should not break signup.
        try {
            const { default: qrService } = await import('@/shared/lib/qr-service');
            const { sendEventSignupEmail } = await import('@/shared/lib/services/email-service');

            if (signup && signup.id) {
                const token = qrService.generateQRToken(signup.id, signupData.event_id);
                await qrService.updateSignupWithQRToken(signup.id, token);

                // If this is a free event, mark the signup as paid so downstream
                // consumers (UI, admin pages, email flows) see the correct state.
                if (signupData.event_price === 0) {
                    try {
                        await directusFetch(`/items/event_signups/${signup.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ payment_status: 'paid' })
                        });
                        console.log(`eventsApi.createSignup: marked free signup ${signup.id} as paid`);
                    } catch (e) {
                        console.error('eventsApi.createSignup: failed to mark free signup as paid', { signupId: signup.id, error: e });
                    }
                }
                // generate image
                let qrDataUrl: string | undefined = undefined;
                try {
                    qrDataUrl = await qrService.generateQRCode(token);
                } catch (e) {
                    console.error('eventsApi.createSignup: failed to generate QR code', { signupId: signup.id, error: e });
                }

                // send email (best-effort)
                try {
                    // Try to fetch additional event details so we can include committee/contact info
                    let committeeName: string | undefined = undefined;
                    let committeeEmail: string | undefined = undefined;
                    let contactName: string | undefined = undefined;
                    let contactPhone: string | undefined = undefined;

                    try {
                        const eventDetails = await eventsApi.getById(String(signupData.event_id));
                        if (eventDetails) {
                            committeeName = eventDetails.committee_name || undefined;
                            committeeEmail = eventDetails.committee_email || undefined;

                            if (eventDetails.contact) {
                                if (typeof eventDetails.contact === 'string' && eventDetails.contact.includes('@')) {
                                    // Prefer explicit committee email (from committee record). Use event contact only as fallback.
                                    if (!committeeEmail) committeeEmail = eventDetails.contact;
                                } else if (typeof eventDetails.contact === 'string') {
                                    contactPhone = eventDetails.contact;
                                }
                            }

                            // If no contactName found, try to get a leader name
                            if (!contactName && eventDetails.contact_name) {
                                contactName = eventDetails.contact_name;
                            }
                        }
                    } catch (e) {
                        console.error('eventsApi.createSignup: failed to fetch event details for contact info', { eventId: signupData.event_id, error: e });
                    }

                    if (signupData.event_price === 0) {
                        console.log('eventsApi.createSignup: qrDataUrl present?', !!qrDataUrl, qrDataUrl ? `len=${qrDataUrl.length}` : 'none');
                        await sendEventSignupEmail({
                            recipientEmail: signupData.email,
                            recipientName: signupData.name,
                            eventName: signupData.event_name || '',
                            eventDate: signupData.event_date || '',
                            eventPrice: signupData.event_price || 0,
                            phoneNumber: signupData.phone_number,
                            userName: signupData.user_id || 'Gast',
                            qrCodeDataUrl: qrDataUrl,
                            committeeName,
                            committeeEmail,
                            contactName,
                            contactPhone,
                        });
                    } else {
                        console.log('paymentApi.createSignup: skipping email for paid event (will be sent on payment confirmation)', { signupId: signup.id });
                    }
                } catch (e) {
                    console.error('eventsApi.createSignup: failed to send signup email', { signupId: signup.id, error: e });
                }
                // Update the local signup object with the QR token instead of refetching
                signup.qr_token = token;
                return signup;
            }

        } catch (err) {
            console.error('eventsApi.createSignup: unexpected error during post-signup processing', { signupData, error: err });
        }

        return signup;
    }
};

export const committeesApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'name', 'email', 'image.id', 'is_visible', 'short_description', 'created_at', 'updated_at'],
            sort: ['name']
        });
        return directusFetch<any[]>(`/items/committees?${query}`);
    },

    getAllWithMembers: async () => {
        try {
            const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,email,image.id,is_visible,short_description,created_at,updated_at&sort=name`);
            const visibleCommittees = committees.filter(c => c.is_visible !== false);

            const committeesWithMembers = await Promise.all(
                visibleCommittees.map(async (committee) => {
                    const members = await directusFetch<any[]>(
                        `/items/committee_members?filter[committee_id][_eq]=${committee.id}&fields=*,user_id.*`
                    );
                    return { ...committee, committee_members: members };
                })
            );
            return committeesWithMembers;
        } catch (error) {
            const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,email,image.id,created_at,updated_at&sort=name`);
            const committeesWithMembers = await Promise.all(
                committees.map(async (committee) => {
                    const members = await directusFetch<any[]>(
                        `/items/committee_members?filter[committee_id][_eq]=${committee.id}&fields=*,user_id.*`
                    );
                    return { ...committee, committee_members: members };
                })
            );
            return committeesWithMembers;
        }
    },

    getById: async (id: number) => {
        try {
            const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,email,image.id,is_visible,short_description,description,created_at,updated_at`);
            const members = await directusFetch<any[]>(
                `/items/committee_members?filter[committee_id][_eq]=${id}&fields=*,user_id.*`
            );
            committee.committee_members = members;
            return committee;
        } catch (error) {
            const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,email,image.id,created_at,updated_at`);
            const members = await directusFetch<any[]>(
                `/items/committee_members?filter[committee_id][_eq]=${id}&fields=*,user_id.*`
            );
            committee.committee_members = members;
            return committee;
        }
    }
};

export const membersApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'first_name', 'last_name', 'email', 'picture', 'is_current_student'],
            sort: ['last_name', 'first_name']
        });
        return directusFetch<any[]>(`/items/members?${query}`);
    },
    getById: async (id: number) => {
        const query = buildQueryString({
            fields: ['id', 'first_name', 'last_name', 'email', 'picture', 'phone_number', 'date_of_birth', 'is_current_student']
        });
        return directusFetch<any>(`/items/members/${id}?${query}`);
    }
};

export const boardApi = {
    getAll: async () => {
        const query = buildQueryString({
            // Request full member relation and nested user relation fields to ensure names/pictures are populated
            // Note: the API returns user relation as `user_id` on committee/board member rows.
            // include year so UI can show the year on historical boards
            fields: ['id', 'naam', 'image', 'year', 'members.*', 'members.user_id.*', 'members.functie'],
            sort: ['naam']
        });
        return directusFetch<any[]>(`/items/Board?${query}`);
    }
};

export const clubsApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'name', 'description', 'image', 'whatsapp_link', 'discord_link', 'website_link'],
            sort: ['name']
        });
        return directusFetch<any[]>(`/items/clubs?${query}`);
    },
    getById: async (id: number) => {
        const query = buildQueryString({
            fields: ['id', 'name', 'description', 'image', 'whatsapp_link', 'discord_link', 'website_link', 'created_at']
        });
        return directusFetch<any>(`/items/clubs/${id}?${query}`);
    }
};

export const pubCrawlEventsApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'name', 'email', 'date', 'description', 'image', 'created_at'],
            sort: ['-date']
        });
        return directusFetch<any[]>(`/items/pub_crawl_events?${query}`);
    },
    getById: async (id: number | string) => {
        return directusFetch<any>(`/items/pub_crawl_events/${id}?fields=*`);
    },
    update: async (id: number | string, data: any) => {
        return directusFetch<any>(`/items/pub_crawl_events/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    delete: async (id: number | string) => {
        return directusFetch<void>(`/items/pub_crawl_events/${id}`, {
            method: 'DELETE'
        });
    }
};

export const pubCrawlSignupsApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: [
                FIELDS.SIGNUPS.ID,
                FIELDS.SIGNUPS.PUB_CRAWL_EVENT_ID,
                FIELDS.SIGNUPS.NAME,
                FIELDS.SIGNUPS.EMAIL,
                FIELDS.SIGNUPS.ASSOCIATION,
                FIELDS.SIGNUPS.AMOUNT_TICKETS,
                FIELDS.SIGNUPS.CREATED_AT,
                FIELDS.SIGNUPS.UPDATED_AT
            ],
            sort: [`-${FIELDS.SIGNUPS.CREATED_AT}`]
        });
        return directusFetch<any[]>(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}?${query}`);
    },
    create: async (data: any) => {
        return directusFetch<any>(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getById: async (id: number | string) => {
        return directusFetch<any>(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}/${id}?fields=*`);
    },
    delete: async (id: number) => {
        return directusFetch<void>(`/items/${COLLECTIONS.PUB_CRAWL_SIGNUPS}/${id}`, {
            method: 'DELETE'
        });
    }
};

export const sponsorsApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['sponsor_id', 'image', 'website_url'],
            sort: ['sponsor_id']
        });
        return directusFetch<any[]>(`/items/sponsors?${query}`);
    }
};

export const jobsApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['job_id', 'name', 'description', 'pay', 'location', 'skills', 'profile_description', 'created_at'],
            sort: ['-created_at']
        });
        return directusFetch<any[]>(`/items/jobs?${query}`);
    },
    getById: async (id: number) => {
        const query = buildQueryString({
            fields: ['job_id', 'name', 'description', 'pay', 'location', 'skills', 'profile_description', 'created_at']
        });
        return directusFetch<any>(`/items/jobs/${id}?${query}`);
    }
};

export interface SafeHaven {
    id: number;
    user_id?: {
        id: string;
        first_name: string;
        last_name: string;
    };
    contact_name: string;
    phone_number?: string;
    email?: string;
    image?: string;
    is_available_today?: boolean;
    availability_times?: Array<{ start: string; end: string }>;
    created_at: string;
}

export interface SafeHavenAvailability {
    // Weekly availability is preferred. If present, `week` contains availability for each day.
    week?: Array<{ day: string; isAvailable: boolean; timeSlots: Array<{ start: string; end: string }> }>;
    // Legacy single-day shape for compatibility
    isAvailableToday?: boolean;
    timeSlots?: Array<{ start: string; end: string }>;
}

export const safeHavensApi = {
    getAll: async () => {
        const query = buildQueryString({
            // availability fields removed from Directus schema -- do not request them
            fields: ['id', 'user_id.id', 'user_id.first_name', 'user_id.last_name', 'contact_name', 'phone_number', 'email', 'image', 'created_at'],
            sort: ['contact_name']
        });
        return directusFetch<SafeHaven[]>(`/items/safe_havens?${query}`);
    },
    getByUserId: async (userId: string) => {
        const query = buildQueryString({
            // availability fields removed from Directus schema -- do not request them
            fields: ['id', 'user_id.id', 'user_id.first_name', 'user_id.last_name', 'contact_name', 'phone_number', 'email', 'image', 'created_at'],
            filter: { 'user_id': { _eq: userId } }
        });
        const results = await directusFetch<SafeHaven[]>(`/items/safe_havens?${query}`);
        return results && results.length > 0 ? results[0] : null;
    }
};

export const stickersApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['*', 'user_created.*', 'created_by.*'],
            sort: ['-date_created'],
            // Request all stickers (Directus defaults to 100 items per page)
            // Use -1 to disable pagination and return all records
            limit: -1
        });
        return directusFetch<any[]>(`/items/Stickers?${query}`);
    },

    create: async (data: CreateStickerData) => {
        return directusFetch<any>(`/items/Stickers`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    delete: async (id: number) => {
        return directusFetch<void>(`/items/Stickers/${id}`, {
            method: 'DELETE'
        });
    }
};

export const transactionsApi = {
    getAll: async (userId: string) => {
        const query = buildQueryString({
            filter: { user_id: { _eq: userId } },
            sort: ['-created_at']
        });
        return directusFetch<Transaction[]>(`/items/transactions?${query}`);
    },
    getById: async (id: number | string) => {
        return directusFetch<any>(`/items/transactions/${id}?fields=*`);
    }
};

export const whatsappGroupsApi = {
    getAll: async (memberOnly: boolean = false) => {
        const filter = memberOnly
            ? { is_active: { _eq: true }, requires_membership: { _eq: true } }
            : { is_active: { _eq: true } };

        const query = buildQueryString({
            filter: filter,
            sort: ['name']
        });
        return directusFetch<WhatsAppGroup[]>(`/items/whatsapp_groups?${query}`);
    }
};

export function calculateStickerStats(stickers: Sticker[]): StickerStats {
    const uniqueCountries = new Set(stickers.filter(s => s.country).map(s => s.country));
    const uniqueCities = new Set(stickers.filter(s => s.city).map(s => s.city));

    // Count stickers per country
    const countryCount: Record<string, number> = {};
    stickers.forEach(sticker => {
        if (sticker.country) {
            countryCount[sticker.country] = (countryCount[sticker.country] || 0) + 1;
        }
    });

    // Find top country
    let topCountry: { country: string; count: number } | undefined;
    Object.entries(countryCount).forEach(([country, count]) => {
        if (!topCountry || count > topCountry.count) {
            topCountry = { country, count };
        }
    });

    // Get most recent city
    const mostRecent = stickers
        .filter(s => s.city)
        .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime())[0];

    return {
        total: stickers.length,
        countries: uniqueCountries.size,
        cities: uniqueCities.size,
        mostRecentCity: mostRecent?.city,
        topCountry,
    };
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number; display_name: string } | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name,
            };
        }
        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
}

export async function reverseGeocode(lat: number, lon: number): Promise<{
    city?: string;
    country?: string;
    display_name: string;
} | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await response.json();

        if (data) {
            return {
                city: data.address?.city || data.address?.town || data.address?.village,
                country: data.address?.country,
                display_name: data.display_name,
            };
        }
        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
}

export const documentsApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'title', 'description', 'file', 'category', 'display_order'],
            filter: { is_active: { _eq: true } },
            sort: ['display_order', 'title']
        });
        return directusFetch<any[]>(`/items/documents?${query}`);
    }
};

export const siteSettingsApi = {
    // If `page` is provided, will filter settings for that page.
    get: async (page?: string): Promise<SiteSettings | null> => {
        try {
            const params: any = {
                fields: ['id', 'page', 'show', 'disabled_message', 'authorized_tokens'],
                limit: 1
            };

            if (page) {
                params.filter = { page: { _eq: page } };
            }

            const query = buildQueryString(params);

            try {
                // Try fetching full settings first (including authorized_tokens)
                // Suppress log because 403 is expected for guests/non-admins
                const data = await directusFetch<SiteSettings | SiteSettings[] | null>(
                    `/items/site_settings?${query}`,
                    { headers: { 'X-Suppress-Log': 'true' } }
                );
                if (Array.isArray(data)) {
                    return data[0] || null;
                }
                return data ?? null;
            } catch (innerError: any) {
                // If forbiddden (403), likely due to 'authorized_tokens' field permission.
                // Retry without that field so at least the rest of the app works.
                if (innerError?.message?.includes('403') || innerError?.toString().includes('403')) {
                    console.warn('[siteSettingsApi] 403 Forbidden on full fetch. Retrying without authorized_tokens.');
                    const limitedParams = { ...params, fields: ['id', 'page', 'show', 'disabled_message'] };
                    const limitedQuery = buildQueryString(limitedParams);
                    const data = await directusFetch<SiteSettings | SiteSettings[] | null>(`/items/site_settings?${limitedQuery}`);
                    if (Array.isArray(data)) {
                        return data[0] || null;
                    }
                    return data ?? null;
                }
                throw innerError;
            }
        } catch (error) {
            // Silently handle errors - site_settings is optional
            // This prevents console errors when the collection doesn't exist or is inaccessible
            console.warn('[siteSettingsApi] Failed to fetch site settings, returning null:', error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }
};

// Add create/update helper for site settings (client code will use this for toggles)
export const siteSettingsMutations = {
    // Create a new site_settings record for a page
    create: async (data: { page: string; show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        return directusFetch<any>(`/items/site_settings`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update an existing site_settings record by id
    update: async (id: number, data: { show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        return directusFetch<any>(`/items/site_settings/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    // Upsert: if a settings row exists update it, otherwise create
    upsertByPage: async (page: string, data: { show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        // Try to fetch existing
        const existing = await siteSettingsApi.get(page);
        if (existing && existing.id) {
            return siteSettingsMutations.update(existing.id, data);
        }
        // Create new
        return siteSettingsMutations.create({ page, ...data });
    }
};

export interface IntroSignup {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    date_of_birth: string;
    email: string;
    phone_number: string;
    favorite_gif?: string;
    created_at: string;
}

export const introSignupsApi = {
    create: async (data: {
        first_name: string;
        middle_name?: string;
        last_name: string;
        date_of_birth: string;
        email: string;
        phone_number: string;
        favorite_gif?: string;
    }) => {
        return directusFetch<any>(`/items/intro_signups`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getAll: async (): Promise<IntroSignup[]> => {
        return directusFetch<IntroSignup[]>(
            `/items/intro_signups?fields=*&sort=-created_at`
        );
    },
    update: async (id: number, data: Partial<IntroSignup>) => {
        return directusFetch<IntroSignup>(`/items/intro_signups/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    delete: async (id: number) => {
        return directusFetch(`/items/intro_signups/${id}`, {
            method: 'DELETE'
        });
    }
};

export interface IntroBlog {
    id: number;
    title: string;
    slug?: string;
    content: string;
    excerpt?: string;
    image?: string;
    likes?: number;
    updated_at: string;
    is_published: boolean;
    blog_type: 'update' | 'pictures' | 'event' | 'announcement';
    created_at: string;
}

export const introBlogsApi = {
    getAll: async (): Promise<IntroBlog[]> => {
        const rows = await directusFetch<IntroBlog[]>(
            `/items/intro_blogs?fields=id,title,slug,content,excerpt,image.id,likes,updated_at,is_published,blog_type,created_at&filter[is_published][_eq]=true&sort=-updated_at`
        );
        return (rows || []).map((r) => {
            const raw = (r as any).likes;
            let likes = 0;
            if (raw !== undefined && raw !== null) {
                likes = typeof raw === 'number' ? raw : parseInt(String(raw), 10) || 0;
            }
            return { ...r, likes };
        });
    },
    getAllAdmin: async (): Promise<IntroBlog[]> => {
        const rows = await directusFetch<IntroBlog[]>(
            `/items/intro_blogs?fields=id,title,slug,content,excerpt,image.id,likes,updated_at,is_published,blog_type,created_at&sort=-updated_at`
        );
        return (rows || []).map((r) => {
            const raw = (r as any).likes;
            let likes = 0;
            if (raw !== undefined && raw !== null) {
                likes = typeof raw === 'number' ? raw : parseInt(String(raw), 10) || 0;
            }
            return { ...r, likes };
        });
    },
    getById: async (id: number): Promise<IntroBlog> => {
        const row = await directusFetch<IntroBlog>(
            `/items/intro_blogs/${id}?fields=id,title,slug,content,excerpt,image.id,likes,updated_at,is_published,blog_type,created_at`
        );
        const raw = (row as any)?.likes;
        let likes = 0;
        if (raw !== undefined && raw !== null) {
            likes = typeof raw === 'number' ? raw : parseInt(String(raw), 10) || 0;
        }
        return { ...(row as any), likes } as IntroBlog;
    },
    getByType: async (type: 'update' | 'pictures' | 'event' | 'announcement'): Promise<IntroBlog[]> => {
        const rows = await directusFetch<IntroBlog[]>(
            `/items/intro_blogs?fields=id,title,slug,content,excerpt,image.id,likes,updated_at,is_published,blog_type,created_at&filter[is_published][_eq]=true&filter[blog_type][_eq]=${type}&sort=-updated_at`
        );
        return (rows || []).map((r) => {
            const raw = (r as any).likes;
            let likes = 0;
            if (raw !== undefined && raw !== null) {
                likes = typeof raw === 'number' ? raw : parseInt(String(raw), 10) || 0;
            }
            return { ...r, likes };
        });
    },
    create: async (data: Partial<IntroBlog>) => {
        return directusFetch<IntroBlog>(`/items/intro_blogs`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    update: async (id: number, data: Partial<IntroBlog>) => {
        return directusFetch<IntroBlog>(`/items/intro_blogs/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    delete: async (id: number) => {
        return directusFetch(`/items/intro_blogs/${id}`, {
            method: 'DELETE'
        });
    }
};

export interface IntroPlanningItem {
    id: number;
    day: string;
    date: string;
    time_start: string;
    time_end?: string;
    title: string;
    description?: string;
    location?: string;
    is_mandatory: boolean;
    // optional icon name selected in Directus (e.g. 'MapPin', 'Clock')
    icon?: string;
    sort_order: number;
    status?: 'published' | 'draft' | 'archived';
}

export const introPlanningApi = {
    getAll: async (): Promise<IntroPlanningItem[]> => {
        return directusFetch<IntroPlanningItem[]>(
            `/items/intro_planning?fields=id,day,date,time_start,time_end,title,description,location,is_mandatory,icon,sort_order&filter[status][_eq]=published&sort=sort_order`
        );
    },
    getAllAdmin: async (): Promise<IntroPlanningItem[]> => {
        return directusFetch<IntroPlanningItem[]>(
            `/items/intro_planning?fields=id,day,date,time_start,time_end,title,description,location,is_mandatory,icon,sort_order,status&sort=sort_order`
        );
    },
    create: async (data: Partial<IntroPlanningItem>) => {
        return directusFetch<IntroPlanningItem>(`/items/intro_planning`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    update: async (id: number, data: Partial<IntroPlanningItem>) => {
        return directusFetch<IntroPlanningItem>(`/items/intro_planning/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    delete: async (id: number) => {
        return directusFetch(`/items/intro_planning/${id}`, {
            method: 'DELETE'
        });
    }
};

export interface IntroParentSignup {
    id?: number;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    motivation?: string;
    availability: string[];
    created_at?: string;
}

export const introParentSignupsApi = {
    create: async (data: IntroParentSignup) => {
        return directusFetch<any>(`/items/intro_parent_signups`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getByUserId: async (userId: string): Promise<IntroParentSignup[]> => {
        return directusFetch<IntroParentSignup[]>(
            `/items/intro_parent_signups?fields=*&filter[user_id][_eq]=${userId}`
        );
    },
    getAll: async (): Promise<IntroParentSignup[]> => {
        return directusFetch<IntroParentSignup[]>(
            `/items/intro_parent_signups?fields=*&sort=-created_at`
        );
    },
    update: async (id: number, data: Partial<IntroParentSignup>) => {
        return directusFetch<IntroParentSignup>(`/items/intro_parent_signups/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    delete: async (id: number) => {
        return directusFetch(`/items/intro_parent_signups/${id}`, {
            method: 'DELETE'
        });
    }
};

export function getImageUrl(imageId: string | undefined | any, options?: { quality?: number; width?: number; height?: number; format?: string }): string {
    if (!imageId) {
        return '/img/placeholder.svg';
    }

    let actualImageId: string;
    if (typeof imageId === 'object' && imageId !== null) {
        actualImageId = imageId.id || imageId.filename_disk || imageId.filename_download;
        if (!actualImageId) {
            // Silently return placeholder for invalid image objects
            return '/img/placeholder.svg';
        }
    } else {
        actualImageId = String(imageId);
    }

    // Validate that actualImageId is a valid UUID or filename
    if (!actualImageId || actualImageId === 'null' || actualImageId === 'undefined') {
        return '/img/placeholder.svg';
    }

    let token: string | null = null;
    try {
        if (typeof window !== 'undefined') {
            token = localStorage.getItem('auth_token');
        }
    } catch (e) {
        console.warn('getImageUrl: Could not access localStorage', e);
    }

    if (!token) {
        token = process.env.NEXT_PUBLIC_DIRECTUS_API_KEY || null;
    }

    // Always use /api proxy which handles authentication via headers
    const baseUrl = '/api';

    // Build query parameters for image optimization only
    // Note: Authentication is handled by the /api/assets proxy via Authorization header
    const params = new URLSearchParams();
    if (options?.quality) {
        params.append('quality', options.quality.toString());
    }
    if (options?.width) {
        params.append('width', options.width.toString());
    }
    if (options?.height) {
        params.append('height', options.height.toString());
    }
    if (options?.format) {
        params.append('format', options.format);
    }

    const queryString = params.toString();
    const imageUrl = queryString
        ? `${baseUrl}/assets/${actualImageId}?${queryString}`
        : `${baseUrl}/assets/${actualImageId}`;

    return imageUrl;
}

export interface HeroBanner {
    id: number;
    image: string;
    title?: string;
    sort?: number;
}

export const heroBannersApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'image', 'title', 'sort'],
            sort: ['sort', '-date_created']
        });
        return directusFetch<HeroBanner[]>(`/items/hero_banners?${query}`);
    }
};

// Safe Haven Availability Functions
export async function getSafeHavenAvailability(userId: string): Promise<SafeHavenAvailability | null> {
    // Availability fields were removed from the Directus schema.
    // To prevent runtime errors, this helper no longer attempts to read availability fields
    // and returns null to indicate availability data is not available.
    console.warn('[getSafeHavenAvailability] Availability support removed; returning null for userId:', userId);
    return null;
}

// Trip API
export interface Trip {
    id: number;
    name: string;
    description: string;
    image?: string | null;
    // For compatibility with single-day trips we keep `event_date`.
    // New multi-day support uses `start_date` and optional `end_date`.
    event_date?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    registration_start_date?: string | null;
    registration_open: boolean;
    max_participants: number;
    max_crew: number;
    base_price: number;
    crew_discount: number;
    deposit_amount: number;
    is_bus_trip: boolean;
    allow_final_payments?: boolean;
    created_at: string;
    updated_at: string;
}

export interface TripActivity {
    id: number;
    trip_id: number;
    name: string;
    description: string;
    price: number;
    image?: string;
    max_participants?: number;
    is_active: boolean;
    display_order: number;
    options?: { name: string; price: number }[];
    max_selections?: number; // 1 = radio/single, null/undefined = unlimited/checkbox
}

export interface TripSignup {
    id: number;
    trip_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth?: string;
    id_document_type?: 'passport' | 'id_card';
    id_document?: 'passport' | 'id_card'; // Legacy/Typo support
    document_number?: string;
    allergies?: string;
    alergies?: string; // Legacy/Typo support
    special_notes?: string;
    willing_to_drive?: boolean;
    role: 'participant' | 'crew';
    status: 'registered' | 'waitlist' | 'confirmed' | 'cancelled';
    deposit_paid: boolean;
    deposit_paid_at?: string;
    full_payment_paid: boolean;
    full_payment_paid_at?: string;
    deposit_email_sent?: boolean;
    final_email_sent?: boolean;
    terms_accepted: boolean;
    created_at: string;
    updated_at: string;
}

export const tripsApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'name', 'description', 'image', 'event_date', 'start_date', 'end_date', 'registration_start_date', 'registration_open', 'max_participants', 'max_crew', 'base_price', 'crew_discount', 'deposit_amount', 'is_bus_trip', 'allow_final_payments', 'created_at', 'updated_at'],
            sort: ['-event_date']
        });
        return directusFetch<Trip[]>(`/items/trips?${query}`);
    },
    getById: async (id: number) => {
        return directusFetch<Trip>(`/items/trips/${id}?fields=*`);
    },
    create: async (data: Partial<Trip>) => {
        return directusFetch<Trip>(`/items/trips`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    update: async (id: number, data: Partial<Trip>) => {
        return directusFetch<Trip>(`/items/trips/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    delete: async (id: number) => {
        return directusFetch(`/items/trips/${id}`, {
            method: 'DELETE'
        });
    },
};

export const tripActivitiesApi = {
    getByTripId: async (tripId: number) => {
        const query = buildQueryString({
            filter: { trip_id: { _eq: tripId }, is_active: { _eq: true } },
            sort: ['display_order', 'name'],
            fields: ['*', 'options', 'max_selections']
        });
        return directusFetch<TripActivity[]>(`/items/trip_activities?${query}`);
    },
    getAllByTripId: async (tripId: number) => {
        // Get all activities including inactive ones for admin purposes
        const query = buildQueryString({
            filter: { trip_id: { _eq: tripId } },
            sort: ['display_order', 'name'],
            fields: ['*', 'options', 'max_selections']
        });
        return directusFetch<TripActivity[]>(`/items/trip_activities?${query}`);
    },
    create: async (data: Partial<TripActivity>) => {
        return directusFetch<TripActivity>(`/items/trip_activities`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    update: async (id: number, data: Partial<TripActivity>) => {
        return directusFetch<TripActivity>(`/items/trip_activities/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    delete: async (id: number) => {
        return directusFetch(`/items/trip_activities/${id}`, {
            method: 'DELETE'
        });
    },
};

export const tripSignupsApi = {
    create: async (data: Partial<TripSignup>) => {
        return directusFetch<TripSignup>(`/items/trip_signups`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getById: async (id: number) => {
        return directusFetch<TripSignup>(`/items/trip_signups/${id}?fields=*`);
    },
    update: async (id: number, data: Partial<TripSignup>) => {
        return directusFetch<TripSignup>(`/items/trip_signups/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },
    getByTripId: async (tripId: number) => {
        const query = buildQueryString({
            filter: { trip_id: { _eq: tripId } },
            sort: ['-created_at']
        });
        return directusFetch<TripSignup[]>(`/items/trip_signups?${query}`);
    },
};

export const tripSignupActivitiesApi = {
    create: async (data: { trip_signup_id: number; trip_activity_id: number; selected_options?: any }) => {
        return directusFetch<any>(`/items/trip_signup_activities`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    delete: async (id: number) => {
        return directusFetch<void>(`/items/trip_signup_activities/${id}`, {
            method: 'DELETE'
        });
    },
    getBySignupId: async (signupId: number) => {
        const query = buildQueryString({
            filter: { trip_signup_id: { _eq: signupId } },
            fields: ['id', 'selected_options', 'trip_activity_id.*']
        });
        return directusFetch<any[]>(`/items/trip_signup_activities?${query}`);
    },
    getByActivityId: async (activityId: number) => {
        const query = buildQueryString({
            filter: { trip_activity_id: { _eq: activityId } },
            fields: ['id', 'selected_options', 'trip_signup_id.*']
        });
        return directusFetch<any[]>(`/items/trip_signup_activities?${query}`);
    },
};

export async function updateSafeHavenAvailability(
    userId: string,
    _availability: SafeHavenAvailability,
    _token: string
): Promise<void> {
    // Availability editing has been removed. Do not attempt to PATCH Directus.
    // Keep a no-op implementation so callers won't cause network errors.
    console.warn('[updateSafeHavenAvailability] Availability updates disabled for userId:', userId);
    return Promise.resolve();
}
