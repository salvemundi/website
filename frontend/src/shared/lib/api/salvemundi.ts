import { directusFetch } from '../directus';

// --- Types ---
export interface SiteSettings {
    id: number;
    page?: string; // identifier of the page in Directus
    show?: boolean; // whether to show the page
    disabled_message?: string; // message to display when disabled
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
    user_created?: any;
    created_by?: any;
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
    description: string;
    transaction_type: 'payment' | 'membership' | 'event' | 'other';
    status: 'pending' | 'completed' | 'failed';
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
}

export interface PaymentResponse {
    checkoutUrl: string;
    paymentId: string;
}

// --- Helper Functions ---
function buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    if (params.fields) queryParams.append('fields', params.fields.join(','));
    if (params.sort) queryParams.append('sort', params.sort.join(','));
    if (params.filter) queryParams.append('filter', JSON.stringify(params.filter));
    if (params.limit) queryParams.append('limit', params.limit.toString());
    return queryParams.toString();
}

// --- API Collecties ---

export const paymentApi = {
    create: async (data: PaymentRequest): Promise<PaymentResponse> => {
        const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_API_URL || '/api/payments';

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
        const query = buildQueryString({
            fields: ['id', 'name', 'event_date', 'event_time', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id', 'contact'],
            sort: ['-event_date']
        });
        const events = await directusFetch<any[]>(`/items/events?${query}`);

        const eventsWithDetails = await Promise.all(
            events.map(async (event) => {
                if (event.committee_id) {
                    try {
                        const committee = await directusFetch<any>(`/items/committees/${event.committee_id}?fields=id,name`);
                        if (committee) {
                            event.committee_name = committee.name;
                        }
                    } catch (error) {
                        console.warn(`Could not fetch committee for event ${event.id}`, error);
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
                        console.warn(`Could not fetch committee leader for event ${event.id}`, error);
                    }
                } else if (event.contact) {
                    event.contact_phone = event.contact;
                }
                return event;
            })
        );

        return eventsWithDetails;
    },

    getById: async (id: string) => {
        const query = buildQueryString({
            fields: ['id', 'name', 'event_date', 'event_time', 'description', 'description_logged_in', 'price_members', 'price_non_members', 'max_sign_ups', 'only_members', 'image', 'committee_id', 'contact']
        });
        const event = await directusFetch<any>(`/items/events/${id}?${query}`);

        if (event.committee_id) {
            try {
                const committee = await directusFetch<any>(`/items/committees/${event.committee_id}?fields=id,name`);
                if (committee) {
                    event.committee_name = committee.name;
                }
            } catch (error) {
                console.warn(`Could not fetch committee for event ${event.id}`, error);
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
                console.warn(`Could not fetch committee leader for event ${event.id}`, error);
            }
        } else if (event.contact) {
            event.contact_phone = event.contact;
        }

        return event;
    },

    getByCommittee: async (committeeId: number) => {
        const query = buildQueryString({
            filter: { committee_id: { _eq: committeeId } },
            fields: ['id', 'name', 'event_date', 'event_time', 'description', 'price_members', 'price_non_members', 'image'],
            sort: ['-event_date']
        });
        return directusFetch<any[]>(`/items/events?${query}`);
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
                // generate image
                let qrDataUrl: string | undefined = undefined;
                try {
                    qrDataUrl = await qrService.generateQRCode(token);
                } catch (e) {
                    console.warn('Failed to generate QR image:', e);
                }

                // send email (best-effort)
                try {
                    await sendEventSignupEmail({
                        recipientEmail: signupData.email,
                        recipientName: signupData.name,
                        eventName: signupData.event_name || '',
                        eventDate: signupData.event_date || '',
                        eventPrice: signupData.event_price || 0,
                        phoneNumber: signupData.phone_number,
                        userName: signupData.user_id || 'Gast',
                        qrCodeDataUrl: qrDataUrl,
                        committeeName: undefined,
                        committeeEmail: undefined,
                        contactName: undefined,
                        contactPhone: undefined,
                    });
                } catch (e) {
                    console.warn('Failed to send signup email:', e);
                }
                // Update the local signup object with the QR token instead of refetching
                signup.qr_token = token;
                return signup;
            }

        } catch (err) {
            console.warn('QR/email post-processing failed:', err);
        }

        return signup;
    }
};

export const committeesApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'name', 'image.id', 'is_visible', 'short_description', 'created_at', 'updated_at'],
            sort: ['name']
        });
        return directusFetch<any[]>(`/items/committees?${query}`);
    },

    getAllWithMembers: async () => {
        try {
            const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,image.id,is_visible,short_description,created_at,updated_at&sort=name`);
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
            const committees = await directusFetch<any[]>(`/items/committees?fields=id,name,image.id,created_at,updated_at&sort=name`);
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
            const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,image.id,is_visible,short_description,description,created_at,updated_at`);
            const members = await directusFetch<any[]>(
                `/items/committee_members?filter[committee_id][_eq]=${id}&fields=*,user_id.*`
            );
            committee.committee_members = members;
            return committee;
        } catch (error) {
            const committee = await directusFetch<any>(`/items/committees/${id}?fields=id,name,image.id,created_at,updated_at`);
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
            fields: ['id', 'naam', 'image', 'members.id', 'members.member_id.id', 'members.member_id.first_name', 'members.member_id.last_name', 'members.member_id.picture', 'members.functie'],
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
            fields: ['id', 'name', 'email', 'association', 'amount_tickets', 'date', 'description', 'image', 'created_at', 'updated_at'],
            sort: ['-created_at']
        });
        return directusFetch<any[]>(`/items/pub_crawl_events?${query}`);
    }
};

export const pubCrawlSignupsApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'pub_crawl_event_id', 'name', 'email', 'association', 'amount_tickets', 'name_initials', 'created_at', 'updated_at'],
            sort: ['-created_at']
        });
        return directusFetch<any[]>(`/items/pub_crawl_signups?${query}`);
    },
    create: async (data: { name: string; email: string; association?: string; amount_tickets: number; pub_crawl_event_id: number; name_initials?: string }) => {
        const existingQuery = buildQueryString({
            filter: {
                pub_crawl_event_id: { _eq: data.pub_crawl_event_id },
                email: { _eq: data.email }
            },
            fields: ['id'],
            limit: 1
        });
        const existing = await directusFetch<any[]>(`/items/pub_crawl_signups?${existingQuery}`);
        if (existing && existing.length > 0) {
            return directusFetch<any>(`/items/pub_crawl_signups/${existing[0].id}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        }

        return directusFetch<any>(`/items/pub_crawl_signups`, {
            method: 'POST',
            body: JSON.stringify(data)
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

export const safeHavensApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['id', 'member_id.first_name', 'member_id.last_name', 'contact_name', 'phone_number', 'image', 'created_at'],
            sort: ['contact_name']
        });
        return directusFetch<any[]>(`/items/safe_havens?${query}`);
    }
};

export const stickersApi = {
    getAll: async () => {
        const query = buildQueryString({
            fields: ['*', 'user_created.*', 'created_by.*'],
            sort: ['-date_created']
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
        const params: any = {
            fields: ['id', 'page', 'show', 'disabled_message'],
            limit: 1
        };

        if (page) {
            params.filter = { page: { _eq: page } };
        }

        const query = buildQueryString(params);

        const data = await directusFetch<SiteSettings | SiteSettings[] | null>(`/items/site_settings?${query}`);
        if (Array.isArray(data)) {
            return data[0] || null;
        }
        return data ?? null;
    }
};

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
            console.error('[getImageUrl] Could not extract image ID from object:', imageId);
            return '/img/placeholder.svg';
        }
    } else {
        actualImageId = String(imageId);
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

    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const baseUrl = isLocalhost
        ? '/api'
        : (process.env.NEXT_PUBLIC_DIRECTUS_URL || '/api');

    const cleanedToken = token && token !== 'null' && token !== 'undefined' ? token : null;
    
    // Build query parameters for image optimization
    const params = new URLSearchParams();
    if (cleanedToken) {
        params.append('access_token', cleanedToken);
    }
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
