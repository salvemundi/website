import { type EventSignup } from '@salvemundi/validations/schema/activity.zod';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { type TripSignup } from '@salvemundi/validations/schema/trip.zod';

export type PaymentStatus = 'paid' | 'open' | 'failed' | 'canceled' | 'expired' | 'error' | 'unauthorized';

export interface SignupStatusResult {
    status: PaymentStatus;
    signup?: EventSignup | PubCrawlSignup | TripSignup | { id: number | string | null };
    isMembership?: boolean;
    isTrip?: boolean;
    errorType?: string;
}
