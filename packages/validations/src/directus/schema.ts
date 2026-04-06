/**
 * Directus Schema for Salve Mundi V7.
 */

export interface DbBoard {
    id: number | null;
    user_created?: string | null;
    date_created?: string | null;
    user_updated?: string | null;
    date_updated?: string | null;
    image?: string | null;
    naam?: string | null;
    year?: string | null;
    members?: any | null;
}

export interface DbBoardMember {
    id: number | null;
    date_created?: string | null;
    date_updated?: string | null;
    board_id?: number | null;
    functie?: string | null;
    user_id?: string | null;
    name?: string | null;
}

export interface DbSticker {
    id: number | null;
    user_created?: string | null;
    date_created?: string | null;
    user_updated?: string | null;
    date_updated?: string | null;
    location_name?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
    country?: string | null;
    city?: string | null;
    image?: string | null;
}

export interface DbClubMember {
    club_id?: number | null;
    is_visible?: boolean | null;
    is_leader?: boolean | null;
    id: number | null;
}

export interface DbClub {
    id: number | null;
    name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    whatsapp_link?: string | null;
    discord_link?: string | null;
    website_link?: string | null;
    description?: string | null;
    image?: string | null;
}

export interface DbCommitteeMember {
    id: number | null;
    committee_id?: number | null;
    user_id?: string | null;
    is_visible?: boolean | null;
    is_leader?: boolean | null;
}

export interface DbCommittee {
    id: number | null;
    name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    image?: string | null;
    is_visible?: boolean | null;
    short_description?: string | null;
    description?: string | null;
    email?: string | null;
    commissie_token?: string | null;
    azure_group_id?: string | null;
}

export interface DbContact {
    id: number | null;
    title?: string | null;
    name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    description?: string | null;
    is_active?: boolean | null;
    display_order?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    image?: string | null;
}

export interface DbCoupon {
    id: number | null;
    coupon_code?: string | null;
    discount_type?: string | null;
    usage_limit?: number | null;
    usage_count?: number | null;
    is_active?: boolean | null;
    valid_from?: string | null;
    valid_until?: string | null;
    discount_value?: number | null;
    date_created?: string | null;
}

export interface DbDocument {
    id: number | null;
    title?: string | null;
    description?: string | null;
    category?: string | null;
    is_active?: boolean | null;
    display_order?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    file?: string | null;
}

export interface DbEventSignup {
    id: number | null;
    event_id?: number | DbEvent | null;
    submission_file_url?: string | null;
    created_at?: string | null;
    qr_token?: string | null;
    checked_in?: boolean | null;
    checked_in_at?: string | null;
    participant_name?: string | null;
    participant_email?: string | null;
    participant_phone?: string | null;
    payment_status?: string | null;
    directus_relations?: string | null;
}

export interface DbEvent {
    id: number | null;
    name?: string | null;
    event_date?: string | null;
    description?: string | null;
    description_logged_in?: string | null;
    price_members?: number | null;
    price_non_members?: number | null;
    max_sign_ups?: number | null;
    only_members?: boolean | null;
    one_sign_up_max?: boolean | null;
    committee_id?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    image?: string | null;
    contact?: string | null;
    event_time?: string | null;
    location?: string | null;
    event_time_end?: string | null;
    registration_deadline?: string | null;
    status?: string | null;
    publish_date?: string | null;
    event_date_end?: string | null;
    attendance_officers?: any | null;
    signups?: any | null;
}

export interface DbEventsDirectusUser {
    id: number | null;
    events_id?: number | null;
    directus_users_id?: string | null;
}

export interface DbEventsMember {
    id: number | null;
    events_id?: number | null;
}

export interface DbFeatureFlag {
    id: string | null;
    name?: string | null;
    route_match?: string | null;
    is_active?: boolean | null;
    message?: string | null;
}

export interface DbHeroBanner {
    id: number | null;
    user_created?: string | null;
    date_created?: string | null;
    image?: string | null;
    sort?: number | null;
    title?: string | null;
}

export interface DbHeroBannersFile {
    id: number | null;
    hero_banners_id?: number | null;
    directus_files_id?: string | null;
}

export interface DbIntro {
}

export interface DbIntroBlogGallery {
    id: number | null;
    intro_blog_id?: number | null;
    directus_files_id?: string | null;
    sort?: number | null;
    caption?: string | null;
    created_at?: string | null;
}

export interface DbIntroBlogLike {
    id: number | null;
    blog?: number | null;
    user_id?: string | null;
    created_at?: string | null;
    ip_address?: any | null;
    user_agent?: string | null;
}

export interface DbIntroBlog {
    id: number | null;
    status?: string | null;
    sort?: number | null;
    user_created?: string | null;
    user_updated?: string | null;
    title?: string | null;
    slug?: string | null;
    content?: string | null;
    excerpt?: string | null;
    image?: string | null;
    is_published?: boolean | null;
    blog_type?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    views_count?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    likes?: string | null;
    date_updated?: string | null;
}

export interface DbIntroParentSignup {
    id: number | null;
    status?: string | null;
    user_created?: string | null;
    user_updated?: string | null;
    user_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    motivation?: string | null;
    previous_experience?: string | null;
    availability?: any | null;
    approved?: boolean | null;
    approved_by?: string | null;
    approved_at?: string | null;
    notes?: string | null;
    created_at?: string | null;
}

export interface DbIntroPlanning {
    id: number | null;
    status?: string | null;
    sort?: number | null;
    user_created?: string | null;
    date_created?: string | null;
    user_updated?: string | null;
    date_updated?: string | null;
    day?: string | null;
    date?: string | null;
    time_start?: string | null;
    time_end?: string | null;
    title?: string | null;
    description?: string | null;
    location?: string | null;
    sort_order?: number | null;
    color?: string | null;
    capacity?: number | null;
    signup_required?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
    icon?: string | null;
    is_mandatory?: string | null;
}

export interface DbIntroPlanningSignup {
    id: number | null;
    intro_planning_id?: number | null;
    intro_signup_id?: number | null;
    user_id?: string | null;
    status?: string | null;
    attended?: boolean | null;
    attended_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface DbIntroSignup {
    id: number | null;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    date_of_birth?: string | null;
    email?: string | null;
    phone_number?: string | null;
    favorite_gif?: string | null;
    created_at?: string | null;
}

export interface DbJob {
    job_id: number | null;
    name?: string | null;
    description?: string | null;
    pay?: number | null;
    location?: string | null;
    created_at?: string | null;
    skills?: string | null;
    profile_description?: string | null;
}

export interface DbKroegentocht {
}

export interface DbPermission {
    id: number | null;
    name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface DbPubCrawlEvent {
    id: number | null;
    name?: string | null;
    email?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    image?: string | null;
    date?: string | null;
    description?: string | null;
    pub_crawl_signups?: any | null;
    // Ephemeral fields hardcoded in frontend per user request
    price?: number;
    max_tickets_per_person?: number;
}

export interface DbPubCrawlSignup {
    id: number | null;
    association?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    pub_crawl_event_id?: number | DbPubCrawlEvent | null;
    email?: string | null;
    name?: string | null;
    amount_tickets?: number | null;
    payment_status?: string | null;
    name_initials?: string | null;
    directus_relations?: string | null;
    // Relation to associated tickets for this signup
    tickets?: DbPubCrawlTicket[] | null;
    transactions?: any | null;
}

export interface DbPubCrawlSignupsTransaction {
    id: number | null;
    pub_crawl_signups_id?: number | null;
    transactions_id?: number | null;
}

export interface DbPubCrawlTicket {
    id: any | null;
    signup_id?: number | null;
    name?: string | null;
    initial?: string | null;
    qr_token?: string | null;
    checked_in?: boolean | null;
    checked_in_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface DbPushNotification {
    id: number | null;
    created_at?: string | null;
    endpoint?: string | null;
    user_id?: string | null;
    keys?: any | null;
    user_agent?: string | null;
    last_used?: string | null;
}

export interface DbRolePermission {
    id: number | null;
    role_id?: number | null;
    permission_id?: number | null;
}

export interface DbRole {
    id: number | null;
    name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface DbSafeHaven {
    id: number | null;
    contact_name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    phone_number?: string | null;
    image?: string | null;
    user_id?: string | null;
    email?: string | null;
}

export interface DbSetting {
}

export interface DbSponsor {
    sponsor_id: number | null;
    website_url?: string | null;
    image?: string | null;
    dark_bg?: boolean | null;
}

export interface DbSystemLog {
    id: string | null;
    type?: string | null;
    status?: string | null;
    payload?: any | null;
    created_at?: string | null;
}

export interface DbTransaction {
    id: number | null;
    user_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    transaction_id?: string | null;
    // Unique identifier from Mollie API for webhook processing and status lookups
    mollie_id?: string | null;
    product_name?: string | null;
    email?: string | null;
    amount?: number | null;
    payment_status?: string | null;
    registration?: number | DbEventSignup | null;
    environment?: string | null;
    approval_status?: string | null;
    approved_by?: string | null;
    approved_at?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    pub_crawl_signup?: number | DbPubCrawlSignup | null;
    trip_signup?: number | DbTripSignup | null;
    coupon_code?: string | null;
    product_type?: 'event_signup' | 'pub_crawl_signup' | 'membership' | 'trip_signup' | string | null;
    pub_crawl_signups?: any | null;
    access_token?: string | null;
}

export interface DbTripActivitie {
    id: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    trip_id?: number | null;
    name?: string | null;
    description?: string | null;
    price?: number | null;
    image?: string | null;
    max_participants?: number | null;
    is_active?: boolean | null;
    display_order?: number | null;
    options?: any | null;
    max_selections?: number | null;
}

export interface DbTripSignupActivitie {
    id: number | null;
    created_at?: string | null;
    trip_signup_id?: number | null;
    trip_activity_id?: number | null;
    selected_options?: any | null;
}

export interface DbTripSignup {
    id: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    trip_id?: number | DbTrip | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    date_of_birth?: string | null;
    id_document?: string | null;
    allergies?: string | null;
    special_notes?: string | null;
    willing_to_drive?: boolean | null;
    role?: string | null;
    status?: string | null;
    deposit_paid?: boolean | null;
    deposit_paid_at?: string | null;
    full_payment_paid?: boolean | null;
    full_payment_paid_at?: string | null;
    terms_accepted?: boolean | null;
    deposit_email_sent?: boolean | null;
    final_email_sent?: boolean | null;
    document_number?: string | null;
    directus_relations?: string | null;
}

export interface DbTrip {
    id: number | null;
    status?: string | null;
    name?: string | null;
    description?: string | null;
    image?: string | null;
    event_date?: string | null;
    registration_open?: boolean | null;
    max_participants?: number | null;
    base_price?: number | null;
    crew_discount?: number | null;
    deposit_amount?: number | null;
    is_bus_trip?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    registration_start_date?: string | null;
    max_crew?: number | null;
    allow_final_payments?: boolean | null;
}

export interface DbTripsRei {
}

export interface DbWhatsappGroup {
    id: number | null;
    name?: string | null;
    description?: string | null;
    invite_link?: string | null;
    is_active?: boolean | null;
    requires_membership?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface DbAuthAccount {
    id: string | null;
    accountId?: string | null;
    providerId?: string | null;
    userId?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    idToken?: string | null;
    accessTokenExpiresAt?: string | null;
    refreshTokenExpiresAt?: string | null;
    scope?: string | null;
    password?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface DbAuthSession {
    id: string | null;
    expiresAt?: string | null;
    token?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId?: string | null;
}

export interface DbMembershipHistory {
    id: string | null;
    user_id?: string | null;
    previous_status?: string | null;
    new_status?: string | null;
    changed_at?: string | null;
}

export interface DbVerification {
    id: string | null;
    identifier?: string | null;
    value?: string | null;
    expiresAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface DbDirectusUser {
    id: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    password?: string | null;
    location?: string | null;
    title?: string | null;
    description?: string | null;
    tags?: any | null;
    avatar?: string | null;
    language?: string | null;
    tfa_secret?: string | null;
    status?: string | null;
    role?: string | null;
    token?: string | null;
    last_access?: string | null;
    last_page?: string | null;
    provider?: string | null;
    external_identifier?: string | null;
    auth_data?: any | null;
    email_notifications?: boolean | null;
    appearance?: string | null;
    theme_dark?: string | null;
    theme_light?: string | null;
    theme_light_overrides?: any | null;
    theme_dark_overrides?: any | null;
    text_direction?: string | null;
    entra_id?: string | null;
    fontys_email?: string | null;
    phone_number?: string | null;
    membership_status?: string | null;
    membership_expiry?: string | null;
    minecraft_username?: string | null;
    photo_etag?: string | null;
    date_of_birth?: string | null;
    admin_access?: boolean | null;
    lidmaatschap_verloopdatum?: string | null;
    originele_betaaldatum?: string | null;
    // M2M relation to committees via committee_members
    committees?: any[] | null;
}

export interface DirectusSchema {
    Board: DbBoard[];
    Board_Members: DbBoardMember[];
    Stickers: DbSticker[];
    club_members: DbClubMember[];
    clubs: DbClub[];
    committee_members: DbCommitteeMember[];
    committees: DbCommittee[];
    contacts: DbContact[];
    coupons: DbCoupon[];
    documents: DbDocument[];
    event_signups: DbEventSignup[];
    events: DbEvent[];
    events_directus_users: DbEventsDirectusUser[];
    events_members: DbEventsMember[];
    feature_flags: DbFeatureFlag[];
    hero_banners: DbHeroBanner[];
    hero_banners_files: DbHeroBannersFile[];
    intro: DbIntro[];
    intro_blog_gallery: DbIntroBlogGallery[];
    intro_blog_likes: DbIntroBlogLike[];
    intro_blogs: DbIntroBlog[];
    intro_parent_signups: DbIntroParentSignup[];
    intro_planning: DbIntroPlanning[];
    intro_planning_signups: DbIntroPlanningSignup[];
    intro_signups: DbIntroSignup[];
    jobs: DbJob[];
    kroegentocht: DbKroegentocht[];
    permissions: DbPermission[];
    pub_crawl_events: DbPubCrawlEvent[];
    pub_crawl_signups: DbPubCrawlSignup[];
    pub_crawl_signups_transactions: DbPubCrawlSignupsTransaction[];
    pub_crawl_tickets: DbPubCrawlTicket[];
    push_notification: DbPushNotification[];
    role_permissions: DbRolePermission[];
    roles: DbRole[];
    safe_havens: DbSafeHaven[];
    settings: DbSetting[];
    sponsors: DbSponsor[];
    system_logs: DbSystemLog[];
    transactions: DbTransaction[];
    trip_activities: DbTripActivitie[];
    trip_signup_activities: DbTripSignupActivitie[];
    trip_signups: DbTripSignup[];
    trips: DbTrip[];
    trips_reis: DbTripsRei[];
    whatsapp_groups: DbWhatsappGroup[];
    auth_accounts: DbAuthAccount[];
    auth_sessions: DbAuthSession[];
    membership_history: DbMembershipHistory[];
    verification: DbVerification[];
    directus_users: DbDirectusUser[];
}
