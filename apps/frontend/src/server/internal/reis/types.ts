
export type QueryParam = string | number | boolean | object | null | undefined;

export type DbRow = { [key: string]: unknown };

export interface RawTripSignupRow extends DbRow {
    id: number;
    trip_id: number;
    email: string;
    date_of_birth?: string | Date | null;
    document_expiry_date?: string | Date | null;
    created_at?: string | Date;
    deposit_paid?: boolean | null;
    full_payment_paid?: boolean | null;
    willing_to_drive?: boolean | null;
    role?: string | null;
    status?: string | null;
}

export interface RawTripActivityRow extends DbRow {
    id: number;
    trip_id: number;
    name: string;
    price?: string | number | null;
    display_order?: string | number | null;
    max_participants?: string | number | null;
    max_selections?: string | number | null;
}

export interface RawTripRow extends DbRow {
    id: number;
    name: string;
    max_participants?: string | number | null;
    max_crew?: string | number | null;
    base_price?: string | number | null;
    crew_discount?: string | number | null;
    deposit_amount?: string | number | null;
    registration_open?: boolean | null;
    is_bus_trip?: boolean | null;
    allow_final_payments?: boolean | null;
    start_date?: string | Date | null;
    end_date?: string | Date | null;
    registration_start_date?: string | Date | null;
}

export interface RawTripSignupActivityRow extends DbRow {
    id: number;
    trip_signup_id: number;
    trip_activity_id: number;
    selected_options?: unknown;
    activity_name?: string;
    activity_price?: string | number | null;
    activity_options?: unknown;
    first_name?: string;
    last_name?: string;
    email?: string;
    signup_id?: number;
}
