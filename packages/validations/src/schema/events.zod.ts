import { z } from 'zod';

export const BaseEventSchema = z.object({
    event: z.string(),
    timestamp: z.string(),
});

export const PaymentSuccessEventSchema = BaseEventSchema.extend({
    userId: z.string().nullable().optional(),
    paymentId: z.string(),
    email: z.string().email(),
    registrationId: z.union([z.string(), z.number()]).nullable().optional(),
    registrationType: z.enum(['event_signup', 'pub_crawl_signup', 'trip_signup', 'membership']).optional(),
    isContribution: z.boolean().optional(),
    isNewMember: z.boolean().optional(),
    qrToken: z.string().nullable().optional(),
    accessToken: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    dateOfBirth: z.string().nullable().optional(),
});

export const ActivitySignupEventSchema = BaseEventSchema.extend({
    email: z.string().email(),
    name: z.string(),
    eventName: z.string(),
    eventDate: z.string(),
    signupId: z.union([z.string(), z.number()]),
    qrToken: z.string().nullable().optional(),
    accessToken: z.string().nullable().optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type PaymentSuccessEvent = z.infer<typeof PaymentSuccessEventSchema>;
export type ActivitySignupEvent = z.infer<typeof ActivitySignupEventSchema>;
