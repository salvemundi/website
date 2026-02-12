export interface Event {
    id: number | string;
    name: string;
    event_date: string;
    event_time?: string;
    inschrijf_deadline?: string;
    description?: string;
    description_logged_in?: string;
    price_members?: number;
    price_non_members?: number;
    max_sign_ups?: number;
    only_members?: boolean;
    image?: string;
    committee_id?: number;
    committee_name?: string;
    committee_email?: string;
    contact?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
}

export interface HeroBanner {
    id: number;
    title?: string;
    image: string | { id: string };
    link?: string;
    sort?: number;
}

export interface Committee {
    id: number;
    name: string;
    email?: string;
    image?: string | { id: string };
    is_visible?: boolean;
    short_description?: string;
    description?: string;
    committee_members?: any[];
}
