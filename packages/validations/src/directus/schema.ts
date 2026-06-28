import type { DirectusUser, DirectusFile } from "@directus/sdk"

export interface Schema {
  Board: Board[];
  Board_Members: BoardMember[];
  Stickers: Sticker[];
  club_members: ClubMember[];
  clubs: Club[];
  committee_members: CommitteeMember[];
  committees: Committee[];
  contacts: Contact[];
  coupons: Coupon[];
  documents: Document[];
  event_signups: EventSignup[];
  events: Event[];
  events_directus_users: EventDirectusUser[];
  events_members: EventMember[];
  feature_flags: FeatureFlag[];
  hero_banners: HeroBanner[];
  hero_banners_files: HeroBannerFile[];
  intro_blog_gallery: IntroBlogGallery[];
  intro_blog_likes: IntroBlogLike[];
  intro_blogs: IntroBlog[];
  intro_parent_signups: IntroParentSignup[];
  intro_planning: IntroPlanning[];
  intro_planning_signups: IntroPlanningSignup[];
  intro_signups: IntroSignup[];
  jobs: Job[];
  permissions: Permission[];
  pub_crawl_events: PubCrawlEvent[];
  pub_crawl_signups: PubCrawlSignup[];
  pub_crawl_signups_transactions: PubCrawlSignupTransaction[];
  pub_crawl_tickets: PubCrawlTicket[];
  push_notification: PushNotification[];
  role_permissions: RolePermission[];
  roles: Role[];
  safe_havens: SafeHaven[];
  sponsors: Sponsor[];
  system_logs: SystemLog[];
  transactions: Transaction[];
  trip_activities: TripActivity[];
  trip_signup_activities: TripSignupActivity[];
  trip_signups: TripSignup[];
  trips: Trip[];
  whatsapp_groups: WhatsappGroup[];
  directus_users: CustomDirectusUser;
  directus_deployments: CustomDirectusDeployment;
  auth_accounts: AuthAccount[];
  auth_sessions: AuthSession[];
  membership_history: MembershipHistory[];
  verification: Verification[];
}

export interface Board {
  id: number;
  user_created: string | DirectusUser<Schema> | null;
  date_created: string | "datetime" | null;
  user_updated: string | DirectusUser<Schema> | null;
  date_updated: string | "datetime" | null;
  image: string | DirectusFile<Schema> | null;
  naam: string | null;
  year: string | null;
  members: number[] | BoardMember[];
}

export interface BoardMember {
  id: number;
  date_created: string | "datetime" | null;
  date_updated: string | "datetime" | null;
  board_id: number | Board | null;
  functie: string | null;
  user_id: string | DirectusUser<Schema> | null;
  name: string | null;
}

export interface Sticker {
  id: number;
  user_created: string | DirectusUser<Schema> | null;
  date_created: string | "datetime" | null;
  user_updated: string | DirectusUser<Schema> | null;
  date_updated: string | "datetime" | null;
  location_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  country: string | null;
  city: string | null;
  image: string | DirectusFile<Schema> | null;
  status: string | null;
}

export interface ClubMember {
  club_id: number;
  is_visible: boolean;
  is_leader: boolean;
  id: number;
}

export interface Club {
  id: number;
  name: string;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
  whatsapp_link: string | null;
  discord_link: string | null;
  website_link: string | null;
  description: string | null;
  image: string | DirectusFile<Schema> | null;
}

export interface CommitteeMember {
  id: number;
  committee_id: number | Committee;
  user_id: string | DirectusUser<Schema> | null;
  is_visible: boolean;
  is_leader: boolean;
}

export interface Committee {
  id: number;
  name: string;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
  image: string | DirectusFile<Schema> | null;
  is_visible: boolean | null;
  short_description: string | null;
  description: string | null;
  email: string | null;
  commissie_token: string | null;
  azure_group_id: string | null;
}

export interface Contact {
  id: number;
  title: string;
  name: string;
  email: string;
  phone_number: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
  image: string | DirectusFile<Schema> | null;
}

export interface Coupon {
  id: number;
  coupon_code: string | null;
  discount_type: "fixed" | "percentage" | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean | null;
  valid_from: string | "datetime" | null;
  valid_until: string | "datetime" | null;
  discount_value: number | null;
  date_created: string | "datetime" | null;
}

export interface Document {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
  file: string | DirectusFile<Schema> | null;
}

export interface EventSignup {
  event_id: number | Event;
  submission_file_url: string | null;
  created_at: string | "datetime";
  id: number;
  qr_token: string | null;
  checked_in: boolean | null;
  checked_in_at: string | "datetime" | null;
  participant_name: string | null;
  participant_email: string | null;
  participant_phone: string | null;
  payment_status: "open" | "paid" | "failed" | null;
  directus_relations: string | DirectusUser<Schema> | null;
  is_member: boolean | null;
}

export interface Event {
  id: number;
  name: string;
  event_date: string | "datetime";
  description: string | null;
  description_logged_in: string | null;
  price_members: number;
  price_non_members: number;
  max_sign_ups: number | null;
  only_members: boolean;
  one_sign_up_max: boolean;
  committee_id: number | null;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
  image: string | DirectusFile<Schema> | null;
  contact: string | null;
  event_time: string | "datetime" | null;
  location: string | null;
  event_time_end: string | "datetime" | null;
  registration_deadline: string | "datetime" | null;
  status: string | null;
  publish_date: string | "datetime" | null;
  event_date_end: string | "datetime" | null;
  custom_url: string | null;
  short_description: string | null;
  attendance_officers: number[] | EventDirectusUser[];
  signups: number[] | EventSignup[];
}

export interface EventDirectusUser {
  id: number;
  events_id: number | Event | null;
  directus_users_id: string | DirectusUser<Schema> | null;
}

export interface EventMember {
  id: number;
  events_id: number | Event | null;
}

export interface FeatureFlag {
  id: string;
  name: string;
  route_match: string;
  is_active: boolean;
  message: string | null;
}

export interface HeroBanner {
  id: number;
  user_created: string | DirectusUser<Schema> | null;
  date_created: string | "datetime" | null;
  image: string | DirectusFile<Schema> | null;
  sort: number | null;
  title: string | null;
}

export interface HeroBannerFile {
  id: number;
  hero_banners_id: number | null;
  directus_files_id: string | null;
}

export interface IntroBlogGallery {
  id: number;
  intro_blog_id: number;
  directus_files_id: string;
  sort: number | null;
  caption: string | null;
  created_at: string | "datetime" | null;
}

export interface IntroBlogLike {
  id: number;
  blog: number;
  user_id: string;
  created_at: string | "datetime";
  ip_address: unknown | null;
  user_agent: string | null;
}

export interface IntroBlog {
  id: number;
  status: string | null;
  sort: number | null;
  user_created: string | null;
  user_updated: string | null;
  title: string;
  slug: string | null;
  content: string;
  excerpt: string | null;
  image: string | null;
  is_published: boolean | null;
  blog_type: "update" | "event" | "pictures" | "announcement" | null;
  meta_title: string | null;
  meta_description: string | null;
  views_count: number | null;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
  likes: string | null;
  date_updated: string | "datetime" | null;
}

export interface IntroParentSignup {
  id: number;
  status: string | null;
  user_created: string | null;
  user_updated: string | null;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  motivation: string;
  previous_experience: string | null;
  availability: unknown;
  approved: boolean | null;
  approved_by: string | null;
  approved_at: string | "datetime" | null;
  notes: string | null;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
  date_updated: string | "datetime" | null;
}

export interface IntroPlanning {
  id: number;
  status: string | null;
  sort: number | null;
  user_created: string | null;
  date_created: string | "datetime" | null;
  user_updated: string | null;
  date_updated: string | "datetime" | null;
  day: string;
  date: string | "datetime";
  time_start: string | "datetime";
  time_end: string | "datetime" | null;
  title: string;
  description: string | null;
  location: string | null;
  sort_order: number;
  color: string | null;
  capacity: number | null;
  signup_required: boolean | null;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
  icon: string | null;
  is_mandatory: string | null;
}

export interface IntroPlanningSignup {
  id: number;
  intro_planning_id: number;
  intro_signup_id: number | null;
  user_id: string | null;
  status: string | null;
  attended: boolean | null;
  attended_at: string | "datetime" | null;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
  date_updated: string | "datetime" | null;
}

export interface IntroSignup {
  id: number;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  email: string | null;
  phone_number: string | null;
  favorite_gif: string | null;
  created_at: string | "datetime" | null;
  status: string | null;
  approved: boolean | null;
}

export interface Job {
  job_id: number;
  name: string;
  description: string | null;
  pay: number | null;
  location: string;
  created_at: string | "datetime";
  skills: string | null;
  profile_description: string | null;
}

export interface Permission {
  id: number;
  name: string;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
}

export interface PubCrawlEvent {
  id: number;
  name: string;
  email: string;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
  image: string | DirectusFile<Schema> | null;
  date: string | "datetime" | null;
  description: string | null;
  whatsapp_community_url: string | null;
  groups: unknown | null;
  pub_crawl_signups: number[] | PubCrawlSignup[];
}

export interface PubCrawlSignup {
  id: number;
  association: string | null;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
  pub_crawl_event_id: number | PubCrawlEvent | null;
  email: string | null;
  name: string | null;
  amount_tickets: number | null;
  payment_status: string | null;
  name_initials: string | null;
  directus_relations: string | DirectusUser<Schema> | null;
  is_member: boolean | null;
  group_name: string | null;
  transactions: number[] | PubCrawlSignupTransaction[];
}

export interface PubCrawlSignupTransaction {
  id: number;
  pub_crawl_signups_id: number | PubCrawlSignup | null;
  transactions_id: number | Transaction | null;
}

export interface PubCrawlTicket {
  id: number;
  signup_id: number | PubCrawlSignup | null;
  name: string | null;
  initial: string | null;
  qr_token: string | null;
  checked_in: boolean | null;
  checked_in_at: string | "datetime" | null;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
}

export interface PushNotification {
  id: number;
  created_at: string | "datetime" | null;
  endpoint: string | null;
  user_id: string | DirectusUser<Schema> | null;
  keys: unknown | null;
  user_agent: string | null;
  last_used: string | "datetime" | null;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
}

export interface Role {
  id: number;
  name: string;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
}

export interface SafeHaven {
  id: number;
  contact_name: string;
  created_at: string | "datetime";
  updated_at: string | "datetime" | null;
  phone_number: string | null;
  image: string | DirectusFile<Schema> | null;
  user_id: string | DirectusUser<Schema> | null;
  email: string | null;
}

export interface Sponsor {
  sponsor_id: number;
  website_url: string | null;
  image: string | DirectusFile<Schema> | null;
  dark_bg: boolean | null;
}

export interface SystemLog {
  id: string;
  type: string;
  status: string;
  payload: unknown | null;
  created_at: string | "datetime" | null;
  acknowledged_at: string | "datetime" | null;
}

export interface Transaction {
  id: number;
  user_id: string | null;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
  transaction_id: string | null;
  product_name: string | null;
  email: string | null;
  amount: number | null;
  payment_status: "open" | "paid" | "failed" | "canceled" | "expired" | null;
  registration: number | EventSignup | null;
  environment: "development" | "production" | null;
  approval_status: "auto_approved" | "pending" | "approved" | "rejected" | null;
  approved_by: string | DirectusUser<Schema> | null;
  approved_at: string | "datetime" | null;
  first_name: string | null;
  last_name: string | null;
  pub_crawl_signup: number | PubCrawlSignup | null;
  trip_signup: number | TripSignup | null;
  coupon_code: string | null;
  product_type: "membership_new" | "membership_renewal" | "event" | "pub_crawl" | "trip" | string;
  mollie_id: string;
  access_token: string | null;
  pub_crawl_signups: number[] | PubCrawlSignupTransaction[];
}

export interface TripActivity {
  id: number;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
  trip_id: number | Trip | null;
  name: string | null;
  description: string | null;
  price: number | null;
  image: string | DirectusFile<Schema> | null;
  max_participants: number | null;
  is_active: boolean | null;
  display_order: number | null;
  options: Array<{ name: string; price: number }> | null;
  max_selections: number | null;
}

export interface TripSignupActivity {
  id: number;
  created_at: string | "datetime" | null;
  trip_signup_id: number | TripSignup | null;
  trip_activity_id: number | TripActivity | null;
  selected_options: unknown | null;
}

export interface TripSignup {
  id: number;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
  trip_id: number | Trip | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  date_of_birth: string | "datetime" | null;
  id_document: string | null;
  allergies: string | null;
  special_notes: string | null;
  willing_to_drive: boolean | null;
  role: string | null;
  status: string | null;
  deposit_paid: boolean | null;
  deposit_paid_at: string | "datetime" | null;
  full_payment_paid: boolean | null;
  full_payment_paid_at: string | "datetime" | null;
  terms_accepted: boolean | null;
  deposit_email_sent: boolean | null;
  final_email_sent: boolean | null;
  document_number: string | null;
  directus_relations: string | null;
  access_token: string | null;
  document_expiry_date: string | "datetime" | null;
  extra_luggage: boolean | null;
}

export interface Trip {
  id: number;
  status: string | null;
  name: string | null;
  description: string | null;
  image: string | DirectusFile<Schema> | null;
  registration_open: boolean | null;
  max_participants: number | null;
  base_price: number | null;
  crew_discount: number | null;
  deposit_amount: number | null;
  is_bus_trip: boolean | null;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
  start_date: string | "datetime" | null;
  end_date: string | "datetime" | null;
  registration_start_date: string | "datetime" | null;
  max_crew: number | null;
  allow_final_payments: boolean | null;
}

export interface WhatsappGroup {
  id: number;
  name: string;
  description: string | null;
  invite_link: string;
  is_active: boolean | null;
  requires_membership: boolean | null;
  created_at: string | "datetime" | null;
  updated_at: string | "datetime" | null;
}

export interface CustomDirectusUser {
  text_direction: string;
  entra_id: string | null;
  fontys_email: string | null;
  phone_number: string | null;
  membership_status: string | null;
  membership_expiry: string | "datetime" | null;
  minecraft_username: string | null;
  photo_etag: string | null;
  date_of_birth: string | "datetime" | null;
  admin_access: boolean | null;
  originele_betaaldatum: string | "datetime" | null;
  emailverified: boolean | null;
  image: string | null;
  name: string | null;
  createdat: string | "datetime" | null;
  updatedat: string | "datetime" | null;
  events: string[] | EventDirectusUser[];
}

export interface CustomDirectusDeployment {
  webhook_secret: string | null;
}

export interface AuthAccount {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: string | "datetime" | null;
  refreshTokenExpiresAt: string | "datetime" | null;
  scope: string | null;
  password: string | null;
  createdAt: string | "datetime";
  updatedAt: string | "datetime";
}

export interface AuthSession {
  id: string;
  expiresAt: string | "datetime";
  token: string;
  createdAt: string | "datetime";
  updatedAt: string | "datetime";
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

export interface MembershipHistory {
  id: string;
  user_id: string | null;
  previous_status: string | null;
  new_status: string | null;
  changed_at: string | "datetime" | null;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: string | "datetime";
  createdAt: string | "datetime" | null;
  updatedAt: string | "datetime" | null;
}

// GeoJSON Types

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface GeoJSONLineString {
  type: "LineString";
  coordinates: Array<[number, number]>;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: Array<Array<[number, number]>>;
}

export interface GeoJSONMultiPoint {
  type: "MultiPoint";
  coordinates: Array<[number, number]>;
}

export interface GeoJSONMultiLineString {
  type: "MultiLineString";
  coordinates: Array<Array<[number, number]>>;
}

export interface GeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: Array<Array<Array<[number, number]>>>;
}

export interface GeoJSONGeometryCollection {
  type: "GeometryCollection";
  geometries: Array<
    | GeoJSONPoint
    | GeoJSONLineString
    | GeoJSONPolygon
    | GeoJSONMultiPoint
    | GeoJSONMultiLineString
    | GeoJSONMultiPolygon
  >;
}
