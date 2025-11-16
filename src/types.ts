// Events (Activities)
export interface Event {
  id: number;
  name: string;
  event_date: string;
  description: string;
  description_logged_in?: string;
  price_members: number;
  price_non_members: number;
  max_sign_ups?: number;
  only_members: boolean;
  image?: string;
  committee_id?: number;
  signups?: EventSignup[];
}

export interface EventSignup {
  id: number;
  event_id: number;
  member_id?: number;
  email: string;
  name: string;
  student_number?: string;
  submission_file_url?: string;
  created_at: string;
}

// Committees
export interface Committee {
  id: number;
  name: string;
  image?: string;
  is_visible?: boolean; // Whether committee should be visible on website
  short_description?: string; // Short description for cards/list view
  description?: string; // Full description for detail page
  created_at: string;
  updated_at?: string;
  committee_members?: CommitteeMember[];
}

export interface CommitteeMember {
  id: number;
  committee_id: number;
  user_id: DirectusUser; // Links to directus_users via user_id
  is_visible: boolean;
  is_leader: boolean;
}

// Directus User (from the committee_members.user_id relationship)
export interface DirectusUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
  phone_number?: string;
  title?: string;
}

// Members
export interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  fontys_email?: string;
  date_of_birth?: string;
  phone_number?: string;
  picture?: string;
  is_current_student?: boolean;
  minecraft_name?: string;
  HasActiveMembership?: string;
  created_at: string;
  updated_at?: string;
}

// Board
export interface Board {
  id: number;
  naam: string;
  image?: string;
  members?: BoardMember[];
}

export interface BoardMember {
  id: number;
  board_id: number;
  member_id: Member;
  functie: string;
}

// Clubs
export interface Club {
  id: number;
  name: string;
  description?: string;
  image?: string;
  whatsapp_link?: string;
  discord_link?: string;
  website_link?: string;
  created_at: string;
  updated_at?: string;
}

// Pub Crawl
export interface PubCrawlEvent {
  id: number;
  name: string;
  email: string;
  association?: string;
  amount_tickets: number;
  name_initials?: string;
  created_at: string;
}

export interface PubCrawlGroup {
  group_id: number;
  name: string;
  initials?: string;
  pub_crawl_events_id?: number;
}

// Sponsors
export interface Sponsor {
  sponsor_id: number;
  image?: string;
  website_url?: string;
}

// Jobs
export interface Job {
  job_id: number;
  name: string;
  description?: string;
  pay?: number;
  location: string;
  skills?: string;
  profile_description?: string;
  created_at: string;
}

// Safe Havens
export interface SafeHaven {
  id: number;
  member_id: number;
  contact_name: string;
  phone_number?: string;
  image?: string;
  created_at: string;
}

// Stickers
export interface Sticker {
  id: number;
  date_created: string;
}
