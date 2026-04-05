export interface Schema {
    directus_users: DirectusUser[];
    committees: Committee[];
    committee_members: CommitteeMember[];
    events: Event[];
    event_signups: EventSignup[];
}

export interface Event {
    id: number;
    name: string;
    event_date: string;
    event_time?: string;
    location?: string;
}

export interface EventSignup {
    id: number;
    event_id?: number;
    participant_name: string;
    participant_email: string;
    payment_status?: string;
}

export interface DirectusUser {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    entra_id?: string;
    membership_expiry?: string | null;
    date_of_birth?: string | null;
    originele_betaaldatum?: string | null;
}

export interface Committee {
    id: number;
    name: string;
    azure_group_id?: string;
}

export interface CommitteeMember {
    id: number;
    user_id: string;
    committee_id: number;
    is_leader: boolean;
    is_visible: boolean;
}
