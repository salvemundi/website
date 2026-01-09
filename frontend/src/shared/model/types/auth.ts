export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    entra_id?: string;
    fontys_email?: string;
    phone_number?: string;
    avatar?: string;  
    is_member: boolean;
    member_id?: number;
    membership_status?: 'active' | 'expired' | 'none';
    membership_expiry?: string; // ISO date string
    minecraft_username?: string;
    role?: string; // Optional Directus role id or name
    committees?: Array<{ id: string; name: string; is_leader?: boolean }>;
    is_safe_haven?: boolean; // Flag to indicate if user is a safe haven
}

export interface SignupData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
}

export interface EventSignup {
    id: number;
    created_at: string;
    event_id: {
        id: number;
        name: string;
        event_date: string;
        description: string;
        image?: string;
        contact_phone?: string;
        contact_name?: string;
    };
}
