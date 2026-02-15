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

export interface IntroBlog {
    id: number;
    title: string;
    slug?: string;
    content: string;
    excerpt?: string;
    image?: string;
    gallery?: string[] | null;
    likes?: number;
    updated_at: string;
    is_published: boolean;
    blog_type: 'update' | 'pictures' | 'event' | 'announcement';
    created_at: string;
}

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

export interface HeroBanner {
    id: number;
    image: string;
    title?: string;
    sort?: number;
}

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
