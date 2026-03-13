export interface Schema {
    directus_users: DirectusUser[];
    committees: Committee[];
    committee_members: CommitteeMember[];
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
}

export interface CommitteeMember {
    id: number;
    user_id: string;
    committee_id: number;
    is_leader: boolean;
    is_visible: boolean;
}
