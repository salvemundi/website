import { API_SERVICE_TOKEN } from '../directus';
import {
    getEventsAction, getEventByIdAction, getEventsByCommitteeAction, createEventSignupAction,
    getCommitteesAction, getCommitteesWithMembersAction, getCommitteeByIdAction,
    getMembersAction, getMemberByIdAction,
    getClubsAction, getClubByIdAction,
    getSponsorsAction,
    getJobsAction, getJobByIdAction,
    getPubCrawlEventsAction, getPubCrawlEventByIdAction, createPubCrawlEventAction, updatePubCrawlEventAction, deletePubCrawlEventAction,
    getPubCrawlSignupsAction, getPubCrawlSignupsByEventIdAction, getPubCrawlSignupByIdAction, createPubCrawlSignupAction, updatePubCrawlSignupAction, deletePubCrawlSignupAction,
    getPubCrawlTicketsAction, getPubCrawlTicketsBySignupIdAction, getPubCrawlTicketsByEventIdAction,
    getStickersAction, createStickerAction, deleteStickerAction,
    getWhatsappGroupsAction,
    getDocumentsAction,
    getHeroBannersAction,
    getSiteSettingsAction, createSiteSettingsAction, updateSiteSettingsAction, upsertSiteSettingsByPageAction,
    searchUsersAction,
    getTransactionsAction, getTransactionByIdAction,
    getSafeHavenByUserIdAction,
    getIntroSignupsAction, createIntroSignupAction, updateIntroSignupAction, deleteIntroSignupAction,
    getIntroBlogsAction, getIntroBlogsAdminAction, getIntroBlogByIdAction, getIntroBlogsByTypeAction,
    createIntroBlogAction, updateIntroBlogAction, deleteIntroBlogAction,
    getIntroPlanningAction, getIntroPlanningAdminAction,
    createIntroPlanningAction, updateIntroPlanningAction, deleteIntroPlanningAction,
    getIntroParentSignupsAction, getIntroParentSignupsByUserIdAction,
    createIntroParentSignupAction, updateIntroParentSignupAction, deleteIntroParentSignupAction,
    getTripsAction, getTripByIdAction, createTripAction, updateTripAction, deleteTripAction,
    getTripActivitiesByTripIdAction, getAllTripActivitiesByTripIdAction,
    createTripActivityAction, updateTripActivityAction, deleteTripActivityAction,
    getTripSignupsByTripIdAction, getTripSignupByIdAction, createTripSignupAction, updateTripSignupAction,
    createTripSignupActivityAction, deleteTripSignupActivityAction,
    getTripSignupActivitiesBySignupIdAction, getTripSignupActivitiesByActivityIdAction,
} from '@/shared/api/data-actions';
import { getSafeHavens } from '@/shared/api/safe-haven-actions';
import { getBoards } from '@/shared/api/board-actions';

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
    transaction_type?: 'payment' | 'membership' | 'event' | 'other' | string;
    registration?: any;
    pub_crawl_signup?: any;
    trip_signup?: any;
    status?: 'pending' | 'completed' | 'failed' | 'paid';
    payment_status?: 'pending' | 'completed' | 'failed' | 'paid' | 'open';
    created_at: string;
    date_created?: string;
    updated_at?: string;
    coupon_code?: string;
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
// buildQueryString and cleanCommitteeName are no longer needed client-side
// All data fetching now goes through server actions in data-actions.ts

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
        return await getEventsAction();
    },
    getById: async (id: string) => {
        return await getEventByIdAction(id);
    },
    getByCommittee: async (committeeId: number) => {
        return await getEventsByCommitteeAction(committeeId);
    },
    createSignup: async (signupData: { event_id: number; email: string; name: string; phone_number?: string; user_id?: string; event_name?: string; event_date?: string; event_price?: number; payment_status?: string }) => {
        return await createEventSignupAction(signupData);
    },
};

export const committeesApi = {
    getAll: async () => {
        return await getCommitteesAction();
    },
    getAllWithMembers: async () => {
        return await getCommitteesWithMembersAction();
    },
    getById: async (id: number) => {
        return await getCommitteeByIdAction(id);
    }
};

export const membersApi = {
    getAll: async () => {
        return await getMembersAction();
    },
    getById: async (id: number) => {
        return await getMemberByIdAction(id);
    }
};

export const boardApi = {
    getAll: async () => {
        // Use Server Action to fetch data with Admin Token, bypassing client-side user permissions
        return await getBoards();
    }
};

export const clubsApi = {
    getAll: async () => {
        return await getClubsAction();
    },
    getById: async (id: number) => {
        return await getClubByIdAction(id);
    }
};

export const pubCrawlEventsApi = {
    getAll: async () => {
        return await getPubCrawlEventsAction();
    },
    getById: async (id: number | string) => {
        return await getPubCrawlEventByIdAction(id);
    },
    create: async (data: any) => {
        return await createPubCrawlEventAction(data);
    },
    update: async (id: number | string, data: any) => {
        return await updatePubCrawlEventAction(id, data);
    },
    delete: async (id: number | string) => {
        return await deletePubCrawlEventAction(id);
    }
};

export const pubCrawlSignupsApi = {
    getAll: async () => {
        return await getPubCrawlSignupsAction();
    },
    getByEventId: async (eventId: number) => {
        return await getPubCrawlSignupsByEventIdAction(eventId);
    },
    create: async (data: any) => {
        return await createPubCrawlSignupAction(data);
    },
    getById: async (id: number | string) => {
        return await getPubCrawlSignupByIdAction(id);
    },
    update: async (id: number | string, data: any) => {
        return await updatePubCrawlSignupAction(id, data);
    },
    delete: async (id: number | string) => {
        return await deletePubCrawlSignupAction(id);
    }
};

export const pubCrawlTicketsApi = {
    getAll: async () => {
        return await getPubCrawlTicketsAction();
    },
    getBySignupId: async (signupId: number | string) => {
        return await getPubCrawlTicketsBySignupIdAction(signupId);
    },
    getByEventId: async (eventId: number | string) => {
        return await getPubCrawlTicketsByEventIdAction(eventId);
    }
};

export const sponsorsApi = {
    getAll: async () => {
        return await getSponsorsAction();
    }
};

export const jobsApi = {
    getAll: async () => {
        return await getJobsAction();
    },
    getById: async (id: number) => {
        return await getJobByIdAction(id);
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
        // Use Server Action to fetch data with Admin Token, bypassing client-side user permissions
        return await getSafeHavens();
    },
    getByUserId: async (userId: string) => {
        return await getSafeHavenByUserIdAction(userId);
    }
};

export const stickersApi = {
    getAll: async () => {
        return await getStickersAction();
    },
    create: async (data: CreateStickerData) => {
        return await createStickerAction(data);
    },
    delete: async (id: number) => {
        return await deleteStickerAction(id);
    }
};

export const transactionsApi = {
    getAll: async (userId: string) => {
        return await getTransactionsAction(userId);
    },
    getById: async (id: number | string) => {
        return await getTransactionByIdAction(id);
    }
};

export const whatsappGroupsApi = {
    getAll: async (memberOnly: boolean = false) => {
        return await getWhatsappGroupsAction(memberOnly);
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
        return await getDocumentsAction();
    }
};

export const usersApi = {
    search: async (searchQuery: string) => {
        return await searchUsersAction(searchQuery);
    }
};

export const siteSettingsApi = {
    get: async (page?: string, includeAuthorizedTokens: boolean = false): Promise<SiteSettings | null> => {
        return await getSiteSettingsAction(page, includeAuthorizedTokens);
    }
};

export const siteSettingsMutations = {
    create: async (data: { page: string; show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        return await createSiteSettingsAction(data);
    },
    update: async (id: number, data: { show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        return await updateSiteSettingsAction(id, data);
    },
    upsertByPage: async (page: string, data: { show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        return await upsertSiteSettingsByPageAction(page, data);
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
    create: async (data: any) => {
        return await createIntroSignupAction(data);
    },
    getAll: async (): Promise<IntroSignup[]> => {
        return await getIntroSignupsAction();
    },
    update: async (id: number, data: Partial<IntroSignup>) => {
        return await updateIntroSignupAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteIntroSignupAction(id);
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
        return await getIntroBlogsAction();
    },
    getAllAdmin: async (): Promise<IntroBlog[]> => {
        return await getIntroBlogsAdminAction();
    },
    getById: async (id: number): Promise<IntroBlog> => {
        return await getIntroBlogByIdAction(id);
    },
    getByType: async (type: 'update' | 'pictures' | 'event' | 'announcement'): Promise<IntroBlog[]> => {
        return await getIntroBlogsByTypeAction(type);
    },
    create: async (data: Partial<IntroBlog>) => {
        return await createIntroBlogAction(data);
    },
    update: async (id: number, data: Partial<IntroBlog>) => {
        return await updateIntroBlogAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteIntroBlogAction(id);
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
        return await getIntroPlanningAction();
    },
    getAllAdmin: async (): Promise<IntroPlanningItem[]> => {
        return await getIntroPlanningAdminAction();
    },
    create: async (data: Partial<IntroPlanningItem>) => {
        return await createIntroPlanningAction(data);
    },
    update: async (id: number, data: Partial<IntroPlanningItem>) => {
        return await updateIntroPlanningAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteIntroPlanningAction(id);
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
        return await createIntroParentSignupAction(data);
    },
    getByUserId: async (userId: string): Promise<IntroParentSignup[]> => {
        return await getIntroParentSignupsByUserIdAction(userId);
    },
    getAll: async (): Promise<IntroParentSignup[]> => {
        return await getIntroParentSignupsAction();
    },
    update: async (id: number, data: Partial<IntroParentSignup>) => {
        return await updateIntroParentSignupAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteIntroParentSignupAction(id);
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
        token = API_SERVICE_TOKEN || null;
    }

    // Always use /api proxy which handles authentication via headers
    const baseUrl = '/api';

    // Build query parameters for image optimization ONLY
    // DO NOT add access_token here - the proxy will handle authentication via Cookie/Authorization headers
    // Adding access_token causes "double auth" (query + cookie) which Directus rejects with 400
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
        return await getHeroBannersAction();
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
        return await getTripsAction();
    },
    getById: async (id: number) => {
        return await getTripByIdAction(id);
    },
    create: async (data: Partial<Trip>) => {
        return await createTripAction(data);
    },
    update: async (id: number, data: Partial<Trip>) => {
        return await updateTripAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteTripAction(id);
    },
};

export const tripActivitiesApi = {
    getByTripId: async (tripId: number) => {
        return await getTripActivitiesByTripIdAction(tripId);
    },
    getAllByTripId: async (tripId: number) => {
        return await getAllTripActivitiesByTripIdAction(tripId);
    },
    create: async (data: Partial<TripActivity>) => {
        return await createTripActivityAction(data);
    },
    update: async (id: number, data: Partial<TripActivity>) => {
        return await updateTripActivityAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteTripActivityAction(id);
    },
};

export const tripSignupsApi = {
    create: async (data: Partial<TripSignup>) => {
        return await createTripSignupAction(data);
    },
    getById: async (id: number) => {
        return await getTripSignupByIdAction(id);
    },
    update: async (id: number, data: Partial<TripSignup>) => {
        return await updateTripSignupAction(id, data);
    },
    getByTripId: async (tripId: number) => {
        return await getTripSignupsByTripIdAction(tripId);
    },
};

export const tripSignupActivitiesApi = {
    create: async (data: { trip_signup_id: number; trip_activity_id: number; selected_options?: any }) => {
        return await createTripSignupActivityAction(data);
    },
    delete: async (id: number) => {
        return await deleteTripSignupActivityAction(id);
    },
    getBySignupId: async (signupId: number) => {
        return await getTripSignupActivitiesBySignupIdAction(signupId);
    },
    getByActivityId: async (activityId: number) => {
        return await getTripSignupActivitiesByActivityIdAction(activityId);
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
