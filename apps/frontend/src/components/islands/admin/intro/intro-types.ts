export interface IntroSignupRow {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth?: string;
    favorite_gif?: string;
    date_created?: string;
    created_at?: string;
    status?: string;
    approved?: boolean;
}

export interface IntroParentRow {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    motivation?: string;
    date_created?: string;
    created_at?: string;
    status?: string;
    approved?: boolean;
}
