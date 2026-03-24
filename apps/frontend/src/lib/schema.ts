/**
 * Directus Schema definition for Salve Mundi V7.
 * This file contains the TypeScript interfaces for all collections used in the project.
 */

export interface Event {
    id: number;
    name: string;
    description?: string | null;
    description_logged_in?: string | null;
    event_date: any;
    event_date_end?: any | null;
    event_time?: string | null;
    event_time_end?: string | null;
    location?: string | null;
    image?: string | null;
    price_members?: number | null;
    price_non_members?: number | null;
    committee_id?: number | Committee | null;
    contact?: string | null;
    registration_deadline?: any | null;
    only_members?: boolean | null;
    status?: 'published' | 'draft' | 'scheduled' | null;
    publish_date?: any | null;
}

export interface EventSignup {
    id: number;
    event_id: number | Event;
    participant_name: string;
    participant_email: string;
    participant_phone: string;
    user_id?: string | DirectusUser | null;
    payment_status?: 'open' | 'paid' | 'failed' | 'canceled' | 'expired' | null;
    approval_status?: 'pending' | 'approved' | 'rejected' | null;
    qr_token?: string | null;
    checked_in?: boolean | null;
    checked_in_at?: any | null;
    date_created?: any | null;
}

export interface Transaction {
    id: string;
    payment_status?: 'open' | 'paid' | 'failed' | 'canceled' | 'expired' | null;
    registration_id?: string | number | null;
    registration_type?: 'event_signup' | 'membership' | 'pub_crawl_signup' | null;
    user_id?: string | DirectusUser | null;
    amount?: number | null;
    description?: string | null;
    date_created?: any | null;
}

export interface Committee {
    id: number;
    name: string;
    image?: string | null;
    is_visible?: boolean | null;
    short_description?: string | null;
    description?: string | null;
    email?: string | null;
}

export interface CommitteeMember {
    id: number;
    committee_id: number | Committee;
    user_id: string | DirectusUser;
    is_visible?: boolean | null;
    is_leader?: boolean | null;
}

export interface PubCrawlSignup {
    id: number;
    pub_crawl_event_id: number | PubCrawlEvent;
    name: string;
    email: string;
    association?: string | null;
    amount_tickets?: number | null;
    name_initials?: string | null;
    payment_status?: string | null;
    approval_status?: 'pending' | 'approved' | 'rejected' | null;
    date_created?: any | null;
    tickets?: any[] | PubCrawlTicket[] | null;
}

export interface PubCrawlEvent {
    id: number;
    name: string;
    date: any;
    price?: number | null;
    max_tickets_per_person?: number | null;
}

export interface PubCrawlTicket {
    id: string | number;
    signup_id: string | number | PubCrawlSignup;
    name: string;
    initial: string;
    qr_token: string;
    checked_in: boolean;
    checked_in_at?: any | null;
}

export interface Trip {
    id: number;
    name: string;
    description?: string | null;
    image?: string | null;
    start_date: any;
    end_date: any;
    event_date: any;
    registration_start_date?: any | null;
    registration_open?: boolean | null;
    max_participants: number;
    max_crew: number;
    base_price: number;
    crew_discount: number;
    deposit_amount: number;
    is_bus_trip?: boolean | null;
    allow_final_payments?: boolean | null;
    status?: 'published' | 'draft' | 'scheduled' | null;
}

export interface TripActivity {
    id: number;
    trip_id: number | Trip;
    name: string;
    description?: string | null;
    image?: string | null;
    price: number;
    max_participants?: number | null;
    display_order?: number | null;
    is_active?: boolean | null;
    options?: any;
    max_selections?: number | null;
}

export interface TripSignup {
    id: number;
    trip_id: number | Trip;
    user_id?: string | DirectusUser | null;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth: any;
    id_document_type?: string | null;
    document_number?: string | null;
    allergies?: string | null;
    special_notes?: string | null;
    willing_to_drive?: boolean | null;
    role?: 'participant' | 'crew' | null;
    status: 'registered' | 'waitlist' | 'confirmed' | 'cancelled';
    deposit_paid: boolean;
    deposit_paid_at?: any | null;
    deposit_email_sent?: boolean | null;
    full_payment_paid: boolean;
    full_payment_paid_at?: any | null;
    final_email_sent?: boolean | null;
    terms_accepted?: boolean | null;
    date_created: any;
}

export interface TripSignupActivity {
    id: number;
    trip_signup_id: number | TripSignup;
    trip_activity_id: number | TripActivity;
    selected_options?: any;
}

export interface DirectusUser {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    date_of_birth?: any | null;
    membership_status?: 'active' | 'expired' | 'none' | null;
    membership_expiry?: any | null;
    avatar?: string | null;
    title?: string | null;
    display_name?: string | null;
    committees?: (number | CommitteeMember)[] | null;
    entra_id?: string | null;
}

export interface AuditLog {
    id: number;
    user_id?: string | DirectusUser | null;
    action: string;
    target_collection: string;
    target_id: string;
    data?: any;
    date_created?: any | null;
}

export interface SafeHaven {
    id: number;
    name: string;
    address?: string | null;
}

export interface Sticker {
    id: number;
    name: string;
    date_created?: any | null;
    user_created?: string | DirectusUser | null;
}

export interface Document {
    id: number;
    title: string;
    display_order?: number | null;
}

export interface FeatureFlag {
    id: string;
    key: string;
    value: boolean;
    is_active?: boolean | null;
    route_match?: string | null;
}

export interface HeroBanner {
    id: number;
    title?: string | null;
    image?: string | null;
    sort?: number | null;
}

export interface Sponsor {
    sponsor_id: string;
    image?: string | null;
    website_url?: string | null;
    dark_bg?: boolean | null;
}

export interface AppSettings {
    manual_approval?: boolean | null;
}

export interface SiteSetting {
    id: string;
    show: boolean;
    disabled_message?: string | null;
}

export interface IntroSignup {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
    phone_number?: string | null;
    date_of_birth?: any | null;
    favorite_gif?: string | null;
    status?: string | null;
    date_created?: any | null;
}

export interface IntroParentSignup {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string | null;
    motivation?: string | null;
    date_created?: any | null;
}

export interface IntroBlog {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    blog_type: 'update' | 'pictures' | 'event' | 'announcement';
    image?: string | null;
    is_published: boolean;
    date_created?: any | null;
}

export interface IntroPlanningItem {
    id: number;
    date: any;
    day?: string | null;
    time_start: any;
    time_end?: any | null;
    title: string;
    description?: string | null;
    location?: string | null;
    date_created?: any | null;
}

export interface Coupon {
    id: number;
    is_active?: boolean | null;
}

export interface SystemLog {
    id: number;
    level?: string | null;
    status?: string | null;
    date_created?: any | null;
}

export interface DirectusSchema {
    events: Event[];
    event_signups: EventSignup[];
    transactions: Transaction[];
    committees: Committee[];
    committee_members: CommitteeMember[];
    pub_crawl_signups: PubCrawlSignup[];
    pub_crawl_events: PubCrawlEvent[];
    trips: Trip[];
    trip_signups: TripSignup[];
    directus_users: DirectusUser[];
    audit_logs: AuditLog[];
    safe_havens: SafeHaven[];
    stickers: Sticker[];
    documents: Document[];
    feature_flags: FeatureFlag[];
    hero_banners: HeroBanner[];
    sponsors: Sponsor[];
    app_settings: AppSettings;
    site_settings: SiteSetting[];
    pub_crawl_tickets: PubCrawlTicket[];
    intro_signups: IntroSignup[];
    intro_parent_signups: IntroParentSignup[];
    intro_blogs: IntroBlog[];
    intro_planning: IntroPlanningItem[];
    coupons: Coupon[];
    system_logs: SystemLog[];
    trip_activities: TripActivity[];
    trip_signup_activities: TripSignupActivity[];
}
