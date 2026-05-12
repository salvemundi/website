import {
    type DbEventSignup,
    type DbPubCrawlSignup,
    type DbTripSignup
} from '@salvemundi/validations/directus/schema';

export type PaymentStatus = 'paid' | 'open' | 'failed' | 'canceled' | 'expired' | 'error' | 'unauthorized';

export interface SignupStatusResult {
    status: PaymentStatus;
    signup?: DbEventSignup | DbPubCrawlSignup | DbTripSignup | { id: number | string | null };
    isMembership?: boolean;
    isTrip?: boolean;
    errorType?: string;
}
