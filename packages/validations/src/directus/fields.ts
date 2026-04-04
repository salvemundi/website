/**
 * Standard field selections for Directus collections.
 * Use these to ensure consistent data fetching across the project.
 */

export const EVENT_FIELDS = [
    'id', 'name', 'event_date', 'event_date_end', 'description', 
    'image', 'location', 'event_time', 'event_time_end', 
    'price_members', 'price_non_members', 'only_members', 
    'registration_deadline', 'contact', 'status', 'publish_date'
] as const;

export const EVENT_SIGNUP_FIELDS = [
    'id', 'event_id', 'participant_name', 'participant_email', 'participant_phone', 'payment_status', 'checked_in', 'checked_in_at', 'qr_token', 'created_at'
] as const;

export const EVENT_ADMIN_FIELDS = [
    ...EVENT_FIELDS,
    'max_sign_ups', 'committee_id', 'description_logged_in'
] as const;

export const EVENT_ID_FIELDS = ['id'] as const;

export const PUB_CRAWL_EVENT_FIELDS = [
    'id', 'name', 'date', 'description', 'image', 'email'
] as const;

export const PUB_CRAWL_SIGNUP_FIELDS = [
    'id', 'name', 'email', 'association', 'amount_tickets', 
    'name_initials', 'payment_status', 'pub_crawl_event_id', 'created_at'
] as const;

export const PUB_CRAWL_TICKET_FIELDS = [
    'id', 'signup_id', 'name', 'initial', 'qr_token', 'checked_in', 'checked_in_at', 'created_at'
] as const;

export const FEATURE_FLAG_FIELDS = [
    'id', 'name', 'route_match', 'is_active', 'message'
] as const;

export const COMMITTEE_FIELDS = [
    'id', 'name', 'email', 'azure_group_id', 'description', 'short_description', 'image', 'is_visible'
] as const;

export const COMMITTEE_MEMBER_FIELDS = [
    'id', 'is_leader', 'user_id', 'committee_id', 'is_visible'
] as const;

export const COUPON_FIELDS = [
    'id', 'coupon_code', 'discount_type', 'discount_value', 'usage_count', 'usage_limit', 'valid_from', 'valid_until', 'is_active', 'date_created'
] as const;

export const INTRO_SIGNUP_FIELDS = [
    'id', 'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'favorite_gif'
] as const;

export const INTRO_PARENT_SIGNUP_FIELDS = [
    'id', 'first_name', 'last_name', 'email', 'phone_number', 'motivation'
] as const;

export const INTRO_BLOG_FIELDS = [
    'id', 'title', 'slug', 'excerpt', 'content', 'blog_type', 'image', 'is_published'
] as const;

export const INTRO_PLANNING_FIELDS = [
    'id', 'date', 'day', 'time_start', 'time_end', 'title', 'description', 'location'
] as const;

export const TRIP_FIELDS = [
    'id', 'name', 'description', 'image', 'event_date', 'start_date', 'end_date', 'registration_start_date', 'registration_open', 'max_participants', 'max_crew', 'base_price', 'crew_discount', 'deposit_amount', 'is_bus_trip', 'allow_final_payments'
] as const;

export const TRIP_ID_FIELDS = ['id'] as const;

export const TRIP_SIGNUP_FIELDS = [
    'id', 'trip_id', 'first_name', 'last_name', 
    'email', 'phone_number', 'date_of_birth', 'id_document', 
    'document_number', 'terms_accepted', 'directus_relations', 'allergies', 'special_notes', 'willing_to_drive', 
    'status', 'deposit_paid', 'deposit_paid_at', 'full_payment_paid', 
    'full_payment_paid_at', 'created_at', 'role', 'access_token',
    'deposit_email_sent', 'final_email_sent'
] as const;

export const SAFE_TRIP_SIGNUP_FIELDS = [
    'id', 'trip_id', 'first_name', 'last_name', 'status', 
    'deposit_paid', 'deposit_paid_at', 'full_payment_paid', 
    'full_payment_paid_at', 'created_at', 'role'
] as const;

export const TRIP_ACTIVITY_FIELDS = [
    'id', 'trip_id', 'name', 'description', 'image', 'price', 
    'max_participants', 'display_order', 'is_active', 'options', 'max_selections'
] as const;

export const TRIP_SIGNUP_ACTIVITY_FIELDS = [
    'id', 'trip_signup_id', 'trip_activity_id', 'selected_options'
] as const;

export const STICKER_FIELDS = [
    'id', 'location_name', 'date_created', 'latitude', 'longitude', 'city', 'country', 'address', 'image'
] as const;

export const USER_ID_FIELDS = ['id', 'entra_id'] as const;

export const USER_BASIC_FIELDS = [
    'id', 'first_name', 'last_name', 'email', 'avatar', 'membership_status'
] as const;

export const USER_FULL_FIELDS = [
    ...USER_BASIC_FIELDS,
    // Essential for Azure AD synchronization and auth flows
    'phone_number', 'date_of_birth', 'entra_id', 'membership_expiry', 'description', 
    'location', 'title', 'tags', 'admin_access', 'committees'
] as const;

export const HERO_BANNER_FIELDS = [
    'id', 'title', 'image', 'sort'
] as const;

export const SPONSOR_FIELDS = [
    'sponsor_id', 'image', 'website_url', 'dark_bg'
] as const;

export const TRANSACTION_FIELDS = [
    'id', 'user_id', 'payment_status', 'amount', 'created_at', 
    { registration: ['id', { event_id: ['name'] }, 'qr_token'] },
    { pub_crawl_signup: ['id', { pub_crawl_event_id: ['name'] }, 'amount_tickets', 'qr_token'] },
    { trip_signup: ['id', { trip_id: ['name'] }, 'first_name', 'last_name'] },
    'product_type', 'mollie_id', 'transaction_id', 
    'first_name', 'last_name', 'email', 'coupon_code', 'access_token'
] as const;

export const WHATSAPP_GROUP_FIELDS = [
    'id', 'name', 'invite_link', 'is_active'
] as const;

export const DOCUMENT_FIELDS = [
    'id', 'title', 'file', 'category', 'display_order'
] as const;

export const SYSTEM_LOG_FIELDS = [
    'id', 'type', 'status', 'payload', 'created_at'
] as const;

export const SAFE_HAVEN_FIELDS = [
    'id', 'contact_name', 'email', 'phone_number', 'image'
] as const;
