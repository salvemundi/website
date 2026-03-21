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
    inschrijf_deadline?: any | null;
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
    start_date: any;
    end_date: any;
    event_date: any;
    status?: 'published' | 'draft' | 'scheduled' | null;
}

export interface TripSignup {
    id: number;
    trip_id: number | Trip;
    user_id?: string | DirectusUser | null;
    first_name: string;
    last_name: string;
    email: string;
    payment_status?: string | null;
    approval_status?: 'pending' | 'approved' | 'rejected' | null;
    date_created?: any | null;
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
    date_created?: any | null;
}

export interface Coupon {
    id: number;
    is_active?: boolean | null;
}

export interface SystemLog {
    id: number;
    level?: string | null;
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
    coupons: Coupon[];
    system_logs: SystemLog[];
}
