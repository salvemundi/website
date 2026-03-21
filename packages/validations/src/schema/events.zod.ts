import { z } from 'zod';

export const BaseEventSchema = z.object({
    event: z.string(),
    timestamp: z.string(),
});

export const PaymentSuccessEventSchema = BaseEventSchema.extend({
    userId: z.string().optional(),
    paymentId: z.string(),
    email: z.string().email(),
    registrationId: z.union([z.string(), z.number()]),
    registrationType: z.enum(['event_signup', 'pub_crawl_signup', 'trip_signup', 'membership']),
});

export const ActivitySignupEventSchema = BaseEventSchema.extend({
    email: z.string().email(),
    name: z.string(),
    eventName: z.string(),
    eventDate: z.string(),
    signupId: z.union([z.string(), z.number()]),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type PaymentSuccessEvent = z.infer<typeof PaymentSuccessEventSchema>;
export type ActivitySignupEvent = z.infer<typeof ActivitySignupEventSchema>;
