import {
    type EventSignup,
    type PubCrawlSignup,
    type TripSignup
} from '@salvemundi/validations/directus/schema';

export type PaymentStatus = 'paid' | 'open' | 'failed' | 'canceled' | 'expired' | 'error' | 'unauthorized';

export interface SignupStatusResult {
    status: PaymentStatus;
    signup?: EventSignup | PubCrawlSignup | TripSignup | { id: number | string | null };
    isMembership?: boolean;
    isTrip?: boolean;
    errorType?: string;
}
