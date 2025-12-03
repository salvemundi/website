export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    entra_id?: string;
    fontys_email?: string;
    phone_number?: string;
    avatar?: string;  // Directus uses 'avatar' not 'picture'
    is_member: boolean;
    member_id?: number;
    membership_status?: 'active' | 'expired' | 'none';
    membership_expiry?: string; // ISO date string
    minecraft_username?: string;
}

export interface SignupData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
}
