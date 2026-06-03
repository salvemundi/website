import {
    type EnrichedPubCrawlSignup
} from '@salvemundi/validations/schema/pub-crawl.zod';

export { type EnrichedPubCrawlSignup };

// --- Database Row Interfaces to enforce 'No ANY' ---
export interface DbPubCrawlEventRow {
    id: number;
    name: string;
    date: string | Date | null;
    description: string | null;
    image: string | null;
    groups?: string[] | unknown;
}

export interface DbPubCrawlSignupRow {
    id: number;
    pub_crawl_event_id: number;
    name: string;
    email: string;
    association?: string | null;
    amount_tickets: number;
    name_initials?: string | unknown[] | null;
    payment_status: string;
    mollie_id?: string | null;
    directus_relations?: string | null;
    created_at?: string | Date;
    group_name?: string | null;
}

export interface DbPubCrawlTicketRow {
    id: number;
    signup_id: number;
    name: string;
    initial: string;
    qr_token: string;
    checked_in: boolean;
    checked_in_at?: string | Date | null;
}

export interface JoinedSignupRow extends DbPubCrawlSignupRow {
    event_name: string;
    event_date: string | Date | null;
    event_description: string | null;
    event_image: string | null;
}

export type QueryParam = string | number | boolean | object | null | undefined;
